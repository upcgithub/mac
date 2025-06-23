import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  cartItems: CartItem[] = [];
  cartTotal = 0;
  showCartDropdown = false;
  private cartSubscription?: Subscription;
  private cartItemsSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse al contador de items del carrito
    this.cartSubscription = this.cartService.cartItemCount$.subscribe(
      count => this.cartItemCount = count
    );

    // Suscribirse a los items del carrito
    this.cartItemsSubscription = this.cartService.cartItems$.subscribe(
      items => {
        this.cartItems = items;
        this.cartTotal = this.cartService.getCartTotal();
      }
    );
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }
  }

  onSearchClick(): void {
    // TODO: Implement search functionality
    console.log('Search clicked');
  }

  onLanguageToggle(): void {
    // TODO: Implement language switching
    console.log('Language toggle clicked');
  }

  onCartClick(): void {
    // TODO: Navigate to cart page
    console.log('Cart clicked');
  }

  onTicketsClick(): void {
    // TODO: Navigate to tickets page
    console.log('Tickets clicked');
  }

  onSettingsClick(): void {
    // TODO: Open settings/account menu
    console.log('Settings clicked');
  }

  // Cart dropdown methods
  increaseQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  viewCart(): void {
    this.showCartDropdown = false;
    this.router.navigate(['/cart']);
  }

  checkout(): void {
    this.showCartDropdown = false;
    this.router.navigate(['/checkout']);
  }
}
