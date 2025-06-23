import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../core/services/cart.service';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { SHIPPING_CONSTANTS, FUTURE_SHIPPING_RATES } from '../../core/constants/shipping.constants';

// Interfaces for checkout data
interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Address {
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

interface ShippingRate {
  country: string;
  rate: number;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  // Subscriptions
  private cartSubscription?: Subscription;

  // Cart data
  cartItems: CartItem[] = [];
  
  // Form data
  customerInfo: CustomerInfo = {
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  };

  shippingAddress: Address = {
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };

  billingAddress: Address = {
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };

  paymentInfo: PaymentInfo = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  };

  // Checkout options
  useSameForBilling: boolean = true;
  selectedPaymentMethod: string = 'card';
  
  // Discount system
  discountCode: string = '';
  appliedDiscount: number = 0;
  
  // Shipping - TODO: Implementar cálculo dinámico, por ahora usamos tarifa fija
  shippingCost: number = SHIPPING_CONSTANTS.DEFAULT_SHIPPING_COST;
  
  // Processing state
  isProcessing: boolean = false;

  // TODO: Usar estas tarifas dinámicas cuando se implemente el sistema completo
  // Shipping rates by country (configuración futura)
  private shippingRates: ShippingRate[] = FUTURE_SHIPPING_RATES;

  // Valid discount codes
  private validDiscountCodes: { [key: string]: number } = {
          'MAC10': 10,
    'WELCOME5': 5,
    'ART20': 20,
    'FLORENCE15': 15,
    'MEDICI25': 25
  };

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
    this.calculateShipping();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // Load cart items
  private loadCartItems(): void {
    this.cartSubscription = this.cartService.cartItems$.subscribe((items: CartItem[]) => {
      this.cartItems = items;
      if (this.cartItems.length === 0) {
        // Redirect to cart if empty
        this.router.navigate(['/cart']);
      }
    });
  }

  // Calculate shipping cost based on country
  onCountryChange(event: any): void {
    const country = event.target.value;
    this.calculateShipping(country);
  }

  private calculateShipping(country?: string): void {
    // TODO: Implementar cálculo dinámico basado en país
    // Por ahora usamos tarifa fija para consistencia con cart
    this.shippingCost = SHIPPING_CONSTANTS.DEFAULT_SHIPPING_COST;
    
    // Código comentado para futura implementación:
    // const selectedCountry = country || this.shippingAddress.country;
    // const shippingRate = this.shippingRates.find(rate => rate.country === selectedCountry);
    // this.shippingCost = shippingRate ? shippingRate.rate : this.shippingRates.find(rate => rate.country === 'OTHER')!.rate;
  }

  // Discount functionality
  applyDiscount(): void {
    const code = this.discountCode.toUpperCase();
    if (this.validDiscountCodes[code]) {
      this.appliedDiscount = this.validDiscountCodes[code];
      this.discountCode = '';
    } else {
      // Show error message (in a real app, you'd use a notification service)
      alert('Invalid discount code');
    }
  }

  removeDiscount(): void {
    this.appliedDiscount = 0;
  }

  // Calculation methods
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getDiscountAmount(): number {
    return (this.getSubtotal() * this.appliedDiscount) / 100;
  }

  getGrandTotal(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    return subtotal - discount + this.shippingCost;
  }

  // Payment form formatting
  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
    
    if (formattedValue.length > 19) {
      formattedValue = formattedValue.substring(0, 19);
    }
    
    this.paymentInfo.cardNumber = formattedValue;
    event.target.value = formattedValue;
  }

  formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.paymentInfo.expiryDate = value;
    event.target.value = value;
  }

  // Form validation
  isFormValid(): boolean {
    // Customer info validation
    if (!this.customerInfo.email || !this.customerInfo.firstName || !this.customerInfo.lastName) {
      return false;
    }

    // Shipping address validation
    if (!this.shippingAddress.address || !this.shippingAddress.city || 
        !this.shippingAddress.zipCode || !this.shippingAddress.country) {
      return false;
    }

    // Payment validation
    if (this.selectedPaymentMethod === 'card') {
      if (!this.paymentInfo.cardNumber || !this.paymentInfo.expiryDate || 
          !this.paymentInfo.cvv || !this.paymentInfo.cardName) {
        return false;
      }
    }

    return true;
  }

  // Place order
  async placeOrder(): Promise<void> {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    this.isProcessing = true;

    try {
      // Simulate API call
      await this.simulateOrderProcessing();
      
      // Clear cart
      this.cartService.clearCart();
      
      // Redirect to success page (you can create this page)
      this.router.navigate(['/order-success'], {
        queryParams: {
          orderNumber: this.generateOrderNumber(),
          total: this.getGrandTotal().toFixed(2)
        }
      });
      
    } catch (error) {
      console.error('Order processing failed:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  // Simulate order processing
  private simulateOrderProcessing(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000); // Simulate 2 second processing time
    });
  }

  // Generate order number
  private generateOrderNumber(): string {
    return 'UF' + Date.now().toString().slice(-8);
  }

  // Navigation methods
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
} 