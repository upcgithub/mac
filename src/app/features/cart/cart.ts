import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { CartService, CartItem } from '../../core/services/cart.service';
import { SHIPPING_CONSTANTS } from '../../core/constants/shipping.constants';

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  suggestedProducts: SuggestedProduct[] = [];
  couponCode = '';
  couponMessage = '';
  isApplyingCoupon = false;
  // TODO: Implementar cálculo dinámico de shipping - por ahora usamos constante
  shippingCost: number = SHIPPING_CONSTANTS.DEFAULT_SHIPPING_COST;
  shippingLocation: string = SHIPPING_CONSTANTS.DEFAULT_SHIPPING_LOCATION;
  appliedDiscount = 0;
  
  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
    this.loadSuggestedProducts();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  private loadCartItems(): void {
    this.cartSubscription = this.cartService.cartItems$.subscribe((items: CartItem[]) => {
      this.cartItems = items;
    });
  }

  private loadSuggestedProducts(): void {
    // Mock suggested products - in real app, this would come from a service
    this.suggestedProducts = [
      {
        id: '101',
        name: 'SHOPPER LOQI GU LOGO - White',
        price: 18.00,
        image: '/assets/images/David Hockney.png',
        slug: 'shopper-loqi-gu-logo-white'
      },
      {
        id: '102',
        name: 'COFFEE CUP WITH SCENTED CANDLE GU',
        price: 22.00,
        image: '/assets/images/Yayoi Kusama.png',
        slug: 'coffee-cup-scented-candle-gu'
      }
    ];
  }

  // Cart Item Management
  removeFromCart(itemId: string): void {
    this.cartService.removeFromCart(itemId);
  }

  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity >= 1) {
      this.cartService.updateQuantity(itemId, newQuantity);
    }
  }

  onQuantityInputChange(itemId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);
    
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      this.updateQuantity(itemId, newQuantity);
    } else {
      // Reset to current quantity if invalid input
      const currentItem = this.cartItems.find(item => item.id === itemId);
      if (currentItem) {
        input.value = currentItem.quantity.toString();
      }
    }
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }

  // Coupon Management
  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      return;
    }

    this.isApplyingCoupon = true;
    this.couponMessage = '';

    // Simulate coupon validation
    setTimeout(() => {
      this.isApplyingCoupon = false;
      
      // Mock coupon logic
      const validCoupons = {
        'MAC10': 10, // 10% discount
        'WELCOME5': 5,  // 5% discount
        'ART20': 20     // 20% discount
      };

      const discount = validCoupons[this.couponCode.toUpperCase() as keyof typeof validCoupons];
      
      if (discount) {
        this.appliedDiscount = discount;
        this.couponMessage = `Coupon applied! You saved ${discount}% on your order.`;
        this.couponCode = '';
      } else {
        this.couponMessage = 'Invalid coupon code. Please try again.';
      }

      // Clear message after 5 seconds
      setTimeout(() => {
        this.couponMessage = '';
      }, 5000);
    }, 1000);
  }

  updateCart(): void {
    // Force refresh cart data (useful after quantity changes)
    this.loadCartItems();
  }

  // Calculations
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getDiscountAmount(): number {
    return this.getSubtotal() * (this.appliedDiscount / 100);
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    return subtotal - discount + this.shippingCost;
  }

  // Suggested Products
  addToCart(product: SuggestedProduct): void {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    };
    
    this.cartService.addToCart(cartItem);
  }

  // Navigation
  continueShopping(): void {
    this.router.navigate(['/']);
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      console.log('Cart is empty, cannot proceed to checkout');
      return;
    }
    
    console.log('Navigating to checkout page...');
    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }

  changeAddress(): void {
    // TODO: Implementar modal/página para cambio de dirección con cálculo dinámico
    const newLocation = prompt('Enter new shipping location:', this.shippingLocation);
    if (newLocation && newLocation.trim()) {
      this.shippingLocation = newLocation.trim();
      
      // TODO: Implementar lógica dinámica - por ahora mantiene tarifa constante
      // Update shipping cost based on location (mock logic)
      if (newLocation.toLowerCase().includes('italy')) {
        this.shippingCost = 5.00;
      } else if (newLocation.toLowerCase().includes('europe')) {
        this.shippingCost = 15.00;
      } else {
        this.shippingCost = SHIPPING_CONSTANTS.DEFAULT_SHIPPING_COST; // International
      }
    }
  }

  // Utility method for better UX
  isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }
} 