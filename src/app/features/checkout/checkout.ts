import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CouponService, Coupon } from '../../core/services/coupon.service';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { SHIPPING_CONSTANTS, FUTURE_SHIPPING_RATES } from '../../core/constants/shipping.constants';
import { CreateOrderData } from '../../core/services/supabase.service';

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

  // Address management
  savedAddresses: any[] = [];
  selectedAddressId: string = '';
  showAddressSelector: boolean = false;
  showNewAddressForm: boolean = false;
  saveNewAddress: boolean = false;

  // TODO: Usar estas tarifas dinámicas cuando se implemente el sistema completo
  // Shipping rates by country (configuración futura)
  private shippingRates: ShippingRate[] = FUTURE_SHIPPING_RATES;

  // Coupon error message
  discountErrorMessage: string = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private couponService: CouponService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadCartItems();
    this.calculateShipping();
    await this.loadUserDataForCheckout();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // Load user data for checkout auto-fill
  private async loadUserDataForCheckout(): Promise<void> {
    if (!this.authService.isAuthenticated) {
      console.log('👤 [CHECKOUT] Usuario no autenticado, no se auto-rellenan datos');
      return;
    }

    try {
      console.log('🔄 [CHECKOUT] Cargando datos del usuario para auto-rellenar...');
      
      // Get user profile data
      const { data: profileData, error: profileError } = await this.authService.getCurrentUserProfile();
      
      if (profileError) {
        console.error('❌ [CHECKOUT] Error al cargar perfil del usuario:', profileError);
        return;
      }

      if (profileData) {
        console.log('✅ [CHECKOUT] Datos del perfil cargados:', profileData);
        
        // Auto-fill customer information
        this.customerInfo = {
          email: profileData.email || '',
          firstName: this.extractFirstName(profileData.full_name || ''),
          lastName: this.extractLastName(profileData.full_name || ''),
          phone: profileData.phone || ''
        };

        console.log('📝 [CHECKOUT] Información del cliente auto-rellenada:', this.customerInfo);
      }

      // Get user shipping addresses
      const { data: addresses, error: addressError } = await this.authService.getShippingAddresses();
      
      if (addressError) {
        console.error('❌ [CHECKOUT] Error al cargar direcciones:', addressError);
        return;
      }

      if (addresses && addresses.length > 0) {
        console.log('✅ [CHECKOUT] Direcciones cargadas:', addresses.length, 'direcciones');
        
        // Store saved addresses
        this.savedAddresses = addresses;
        this.showAddressSelector = true;
        
        // Find default address or use first one
        const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
        
        if (defaultAddress) {
          console.log('📍 [CHECKOUT] Usando dirección por defecto:', defaultAddress);
          
          // Set selected address ID
          this.selectedAddressId = defaultAddress.id;
          
          // Auto-fill shipping address
          this.shippingAddress = {
            address: defaultAddress.address_line_1,
            apartment: defaultAddress.address_line_2 || '',
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.postal_code,
            country: defaultAddress.country
          };

          console.log('📝 [CHECKOUT] Dirección de envío auto-rellenada:', this.shippingAddress);
        }
      } else {
        // No saved addresses, show new address form
        this.showAddressSelector = false;
        this.showNewAddressForm = true;
        console.log('📝 [CHECKOUT] No hay direcciones guardadas, mostrando formulario de nueva dirección');
      }

    } catch (error) {
      console.error('💥 [CHECKOUT] Error inesperado al cargar datos del usuario:', error);
    }
  }

  // Helper methods to extract names
  private extractFirstName(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    return names[0] || '';
  }

  private extractLastName(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    return names.length > 1 ? names.slice(1).join(' ') : '';
  }

  // Address management methods
  onAddressSelect(addressId: string): void {
    console.log('📍 [CHECKOUT] Seleccionando dirección:', addressId);
    
    const selectedAddress = this.savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      this.selectedAddressId = addressId;
      
      // Fill shipping address form
      this.shippingAddress = {
        address: selectedAddress.address_line_1,
        apartment: selectedAddress.address_line_2 || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.postal_code,
        country: selectedAddress.country
      };
      
      console.log('✅ [CHECKOUT] Dirección seleccionada y formulario actualizado');
    }
  }

  showNewAddressFormToggle(): void {
    this.showNewAddressForm = !this.showNewAddressForm;
    this.selectedAddressId = '';
    
    if (this.showNewAddressForm) {
      // Clear form for new address
      this.shippingAddress = {
        address: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };
      console.log('📝 [CHECKOUT] Formulario de nueva dirección activado');
    }
  }

  // Format address for display
  formatAddressForDisplay(address: any): string {
    let formatted = address.address_line_1;
    if (address.address_line_2) {
      formatted += `, ${address.address_line_2}`;
    }
    formatted += `, ${address.city}, ${address.state} ${address.postal_code}`;
    return formatted;
  }

  // Save new address if requested
  private async saveAddressIfRequested(): Promise<void> {
    if (!this.saveNewAddress || !this.showNewAddressForm) {
      return;
    }

    try {
      console.log('💾 [CHECKOUT] Guardando nueva dirección...');
      
      const addressData = {
        title: 'Casa', // Default title, could be customizable
        first_name: this.customerInfo.firstName,
        last_name: this.customerInfo.lastName,
        address_line_1: this.shippingAddress.address,
        address_line_2: this.shippingAddress.apartment,
        city: this.shippingAddress.city,
        state: this.shippingAddress.state,
        postal_code: this.shippingAddress.zipCode,
        country: this.shippingAddress.country,
        phone: this.customerInfo.phone,
        is_default: this.savedAddresses.length === 0 // First address is default
      };

      const { data, error } = await this.authService.createShippingAddress(addressData);
      
      if (error) {
        console.error('❌ [CHECKOUT] Error al guardar dirección:', error);
        // Don't fail the order, just log the error
        return;
      }

      if (data) {
        console.log('✅ [CHECKOUT] Dirección guardada exitosamente:', data);
        this.savedAddresses.push(data);
      }
    } catch (error) {
      console.error('💥 [CHECKOUT] Error inesperado al guardar dirección:', error);
      // Don't fail the order, just log the error
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
    if (!this.discountCode.trim()) {
      return;
    }

    // Check if coupon is already applied
    if (this.appliedDiscount > 0) {
      this.discountErrorMessage = 'Ya tienes un cupón aplicado. Remuévelo primero.';
      return;
    }

    const coupon = this.couponService.validateCoupon(this.discountCode);
    
    if (coupon) {
      this.appliedDiscount = coupon.discount;
      this.discountCode = '';
      this.discountErrorMessage = '';
    } else {
      this.discountErrorMessage = 'Código de cupón inválido. Por favor, inténtalo de nuevo.';
    }

    // Clear error message after 5 seconds
    if (this.discountErrorMessage) {
      setTimeout(() => {
        this.discountErrorMessage = '';
      }, 5000);
    }
  }

  removeDiscount(): void {
    this.appliedDiscount = 0;
    this.discountErrorMessage = '';
  }

  // Calculation methods
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getDiscountAmount(): number {
    return this.couponService.calculateDiscount(this.getSubtotal(), this.appliedDiscount);
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

    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      alert('Please log in to place an order');
      this.router.navigate(['/login']);
      return;
    }

    this.isProcessing = true;

    try {
      console.log('🔄 [CHECKOUT] Iniciando proceso de pedido...');
      
      // Save new address if requested (do this before creating order)
      await this.saveAddressIfRequested();
      
      // Prepare order data
      const orderData: CreateOrderData = {
        // Customer Information
        customer_email: this.customerInfo.email,
        customer_first_name: this.customerInfo.firstName,
        customer_last_name: this.customerInfo.lastName,
        customer_phone: this.customerInfo.phone,
        
        // Shipping Address
        shipping_address_line_1: this.shippingAddress.address,
        shipping_address_line_2: this.shippingAddress.apartment,
        shipping_city: this.shippingAddress.city,
        shipping_state: this.shippingAddress.state,
        shipping_postal_code: this.shippingAddress.zipCode,
        shipping_country: this.shippingAddress.country,
        
        // Billing Address
        billing_address_line_1: this.useSameForBilling ? this.shippingAddress.address : this.billingAddress.address,
        billing_address_line_2: this.useSameForBilling ? this.shippingAddress.apartment : this.billingAddress.apartment,
        billing_city: this.useSameForBilling ? this.shippingAddress.city : this.billingAddress.city,
        billing_state: this.useSameForBilling ? this.shippingAddress.state : this.billingAddress.state,
        billing_postal_code: this.useSameForBilling ? this.shippingAddress.zipCode : this.billingAddress.zipCode,
        billing_country: this.useSameForBilling ? this.shippingAddress.country : this.billingAddress.country,
        use_same_for_billing: this.useSameForBilling,
        
        // Payment Information
        payment_method: this.selectedPaymentMethod,
        
        // Order Totals
        subtotal: this.getSubtotal(),
        discount_amount: this.getDiscountAmount(),
        discount_code: this.discountCode || undefined,
        discount_percentage: this.appliedDiscount,
        shipping_cost: this.shippingCost,
        total_amount: this.getGrandTotal(),
        
        // Order Items
        items: this.cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.image,
          product_type: this.getProductType(item.name), // Extract product type from name
          product_variant: this.getProductVariant(item.name), // Extract variant if any
          unit_price: item.price,
          quantity: item.quantity,
          total_price: item.price * item.quantity
        })),
        
        // Additional info
        notes: `Pedido realizado desde checkout. Método de pago: ${this.selectedPaymentMethod}`
      };

      console.log('📝 [CHECKOUT] Datos del pedido preparados:', orderData);

      // Create order in database
      const { data: order, error } = await this.authService.createOrder(orderData);

      if (error) {
        console.error('❌ [CHECKOUT] Error al crear pedido:', error);
        alert('There was an error processing your order. Please try again.');
        return;
      }

      if (!order) {
        console.error('❌ [CHECKOUT] No se recibió datos del pedido');
        alert('There was an error processing your order. Please try again.');
        return;
      }

      console.log('✅ [CHECKOUT] Pedido creado exitosamente:', order);

      // Simulate payment processing
      await this.simulateOrderProcessing();
      
      // Clear cart
      this.cartService.clearCart();
      
      // Redirect to success page with order details
      this.router.navigate(['/order-success'], {
        queryParams: {
          orderNumber: order.order_number,
          total: order.total_amount.toFixed(2),
          orderId: order.id
        }
      });
      
    } catch (error) {
      console.error('💥 [CHECKOUT] Error inesperado al procesar pedido:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  // Helper methods for product information
  private getProductType(productName: string): string {
    const name = productName.toLowerCase();
    if (name.includes('hoodie') || name.includes('sudadera')) return 'hoodie';
    if (name.includes('t-shirt') || name.includes('camiseta')) return 't-shirt';
    if (name.includes('poster') || name.includes('cuadro')) return 'poster';
    if (name.includes('sweatshirt')) return 'sweatshirt';
    if (name.includes('mug') || name.includes('taza')) return 'mug';
    if (name.includes('canvas') || name.includes('lienzo')) return 'canvas';
    return 'other';
  }

  private getProductVariant(productName: string): string {
    // This could be extended to extract size, color, etc. from product name
    // For now, we'll return a basic variant or empty string
    return '';
  }

  // Simulate order processing
  private simulateOrderProcessing(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000); // Simulate 2 second processing time
    });
  }

  // Navigation methods
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
} 