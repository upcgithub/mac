import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '@supabase/supabase-js';

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
  
  // Auth properties
  isAuthenticated = false;
  currentUser: User | null = null;
  showUserDropdown = false;
  
  private cartSubscription?: Subscription;
  private cartItemsSubscription?: Subscription;
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
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

    // Suscribirse al estado de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuthenticated => this.isAuthenticated = isAuthenticated
    );

    // Suscribirse al usuario actual
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => this.currentUser = user
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
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

  // Auth methods
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.showUserDropdown = false;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  goToProfile(): void {
    // TODO: Navigate to profile page
    this.showUserDropdown = false;
    console.log('Profile clicked');
  }

  goToOrders(): void {
    // TODO: Navigate to orders page
    this.showUserDropdown = false;
    console.log('Orders clicked');
  }

  // User dropdown methods
  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showUserDropdown) {
      this.showCartDropdown = false;
    }
  }

  // Cart dropdown methods
  toggleCartDropdown(): void {
    this.showCartDropdown = !this.showCartDropdown;
    if (this.showCartDropdown) {
      this.showUserDropdown = false;
    }
  }

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

  // Utility methods
  getUserDisplayName(): string {
    if (this.currentUser?.user_metadata?.['full_name']) {
      return this.currentUser.user_metadata['full_name'];
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.split('@')[0];
    }
    return 'Usuario';
  }

  getUserEmail(): string {
    return this.currentUser?.email || '';
  }

  getUserAvatar(): string {
    return this.currentUser?.user_metadata?.['avatar_url'] || '';
  }

  // Close dropdowns when clicking outside
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close cart dropdown if clicking outside
    if (this.showCartDropdown && !target.closest('.cart-dropdown-container')) {
      this.showCartDropdown = false;
    }
    
    // Close user dropdown if clicking outside
    if (this.showUserDropdown && !target.closest('.user-dropdown-container')) {
      this.showUserDropdown = false;
    }
  }
}
