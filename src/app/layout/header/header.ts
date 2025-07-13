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
  userProfile: any = null; // Profile data from profiles table
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

  async ngOnInit(): Promise<void> {
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
      async user => {
        this.currentUser = user;
        if (user) {
          // Load profile data when user is authenticated
          await this.loadUserProfile();
        } else {
          this.userProfile = null;
        }
      }
    );
  }

  async loadUserProfile(): Promise<void> {
    console.log('🔄 [HEADER] Cargando perfil del usuario para el header...');
    
    try {
      const { data, error } = await this.authService.getCurrentUserProfile();
      
      if (data && !error) {
        console.log('✅ [HEADER] Perfil del usuario cargado exitosamente:', data);
        this.userProfile = data;
      } else {
        console.error('❌ [HEADER] Error al cargar perfil del usuario:', error);
      }
    } catch (error) {
      console.error('💥 [HEADER] Error inesperado al cargar perfil del usuario:', error);
    }
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
    this.showUserDropdown = false;
    this.router.navigate(['/profile']);
  }

  goToOrders(): void {
    this.showUserDropdown = false;
    this.router.navigate(['/orders']);
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
    console.log('🔍 [HEADER] Obteniendo nombre para mostrar...', {
      userProfile: this.userProfile,
      currentUser: this.currentUser?.email
    });
    
    if (this.userProfile?.full_name) {
      console.log('✅ [HEADER] Usando full_name del perfil:', this.userProfile.full_name);
      return this.userProfile.full_name;
    }
    if (this.userProfile?.email) {
      const displayName = this.userProfile.email.split('@')[0];
      console.log('✅ [HEADER] Usando email del perfil:', displayName);
      return displayName;
    }
    if (this.currentUser?.email) {
      const displayName = this.currentUser.email.split('@')[0];
      console.log('✅ [HEADER] Usando email de auth:', displayName);
      return displayName;
    }
    console.log('⚠️ [HEADER] Usando nombre por defecto');
    return 'Usuario';
  }

  getUserEmail(): string {
    console.log('🔍 [HEADER] Obteniendo email del usuario...', {
      profileEmail: this.userProfile?.email,
      authEmail: this.currentUser?.email
    });
    
    const email = this.userProfile?.email || this.currentUser?.email || '';
    console.log('✅ [HEADER] Email obtenido:', email);
    return email;
  }

  getUserAvatar(): string {
    console.log('🔍 [HEADER] Obteniendo avatar del usuario...', {
      profileAvatar: this.userProfile?.avatar_url
    });
    
    const avatar = this.userProfile?.avatar_url || '';
    console.log('✅ [HEADER] Avatar obtenido:', avatar);
    return avatar;
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
