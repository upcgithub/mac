import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { SupabaseService, Order, CreateOrderData } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<AuthError | null>(null);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // Observables
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get error$(): Observable<AuthError | null> {
    return this.errorSubject.asObservable();
  }

  get currentUser$(): Observable<User | null> {
    return this.supabaseService.currentUser$;
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.supabaseService.isAuthenticated$;
  }

  get session$(): Observable<Session | null> {
    return this.supabaseService.session$;
  }

  // Current user
  get currentUser(): User | null {
    return this.supabaseService.currentUser;
  }

  get isAuthenticated(): boolean {
    return this.supabaseService.isAuthenticated();
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      if (data?.user) {
        // Store remember me preference
        if (credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        return { success: true };
      }

      return { success: false, error: { message: 'Login failed' } };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signUp(
        credentials.email,
        credentials.password,
        {
          full_name: credentials.fullName
        }
      );

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      if (data?.user) {
        return { success: true };
      }

      return { success: false, error: { message: 'Registration failed' } };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signInWithGoogle();

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async loginWithFacebook(): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signInWithFacebook();

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async logout(): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { error } = await this.supabaseService.signOut();

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      // Clear local storage
      localStorage.removeItem('rememberMe');
      
      // Navigate to home page
      this.router.navigate(['/']);
      
      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.resetPassword(email);

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async updatePassword(password: string): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.updatePassword(password);

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  // Profile methods
  async getProfile() {
    const userId = this.supabaseService.getUserId();
    if (!userId) return { data: null, error: { message: 'User not authenticated' } };

    return await this.supabaseService.getProfile(userId);
  }

  async updateProfile(updates: any) {
    console.log('🔄 [AUTH_SERVICE] Actualizando perfil del usuario...');
    console.log('📝 [AUTH_SERVICE] Datos a actualizar:', updates);
    
    const userId = this.supabaseService.getUserId();
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    console.log('📡 [AUTH_SERVICE] ID de usuario:', userId);
    const result = await this.supabaseService.updateProfile(userId, updates);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al actualizar perfil:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Perfil actualizado exitosamente:', result.data);
    }
    
    return result;
  }

  // Extended profile methods
  async getUserProfileData() {
    console.log('🔄 [AUTH_SERVICE] Obteniendo datos completos del perfil...');
    const userId = this.supabaseService.getUserId();
    
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    console.log('📡 [AUTH_SERVICE] ID de usuario:', userId);
    const result = await this.supabaseService.getUserProfileData(userId);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al obtener datos del perfil:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Datos del perfil obtenidos exitosamente:', result.data);
    }
    
    return result;
  }

  // Shipping address methods
  async getShippingAddresses() {
    console.log('🔄 [AUTH_SERVICE] Obteniendo direcciones de envío...');
    const userId = this.supabaseService.getUserId();
    
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    console.log('📡 [AUTH_SERVICE] ID de usuario:', userId);
    const result = await this.supabaseService.getShippingAddresses(userId);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al obtener direcciones:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Direcciones obtenidas exitosamente:', result.data?.length || 0, 'direcciones');
    }
    
    return result;
  }

  async createShippingAddress(address: any) {
    console.log('🔄 [AUTH_SERVICE] Creando nueva dirección de envío...');
    console.log('📝 [AUTH_SERVICE] Datos de dirección:', address);
    
    const userId = this.supabaseService.getUserId();
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const addressWithUserId = {
      ...address,
      user_id: userId
    };
    
    console.log('📡 [AUTH_SERVICE] Enviando dirección con user_id:', addressWithUserId);
    const result = await this.supabaseService.createShippingAddress(addressWithUserId);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al crear dirección:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Dirección creada exitosamente:', result.data);
    }
    
    return result;
  }

  async updateShippingAddress(addressId: string, updates: any) {
    console.log('🔄 [AUTH_SERVICE] Actualizando dirección de envío...');
    console.log('📝 [AUTH_SERVICE] ID:', addressId, 'Actualizaciones:', updates);
    
    const result = await this.supabaseService.updateShippingAddress(addressId, updates);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al actualizar dirección:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Dirección actualizada exitosamente:', result.data);
    }
    
    return result;
  }

  async deleteShippingAddress(addressId: string) {
    console.log('🔄 [AUTH_SERVICE] Eliminando dirección de envío...');
    console.log('📝 [AUTH_SERVICE] ID de dirección:', addressId);
    
    const result = await this.supabaseService.deleteShippingAddress(addressId);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al eliminar dirección:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Dirección eliminada exitosamente');
    }
    
    return result;
  }

  async setDefaultShippingAddress(addressId: string) {
    console.log('🔄 [AUTH_SERVICE] Estableciendo dirección por defecto...');
    console.log('📝 [AUTH_SERVICE] ID de dirección:', addressId);
    
    const userId = this.supabaseService.getUserId();
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { error: { message: 'User not authenticated' } };
    }

    console.log('📡 [AUTH_SERVICE] ID de usuario:', userId);
    const result = await this.supabaseService.setDefaultShippingAddress(addressId, userId);
    
    if (result.error) {
      console.error('❌ [AUTH_SERVICE] Error al establecer dirección por defecto:', result.error);
    } else {
      console.log('✅ [AUTH_SERVICE] Dirección por defecto establecida exitosamente');
    }
    
    return result;
  }

  // Get combined user data (auth + profile)
  async getCurrentUserProfile() {
    console.log('🔄 [AUTH_SERVICE] Obteniendo perfil combinado del usuario...');
    const userId = this.supabaseService.getUserId();
    
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    console.log('📡 [AUTH_SERVICE] ID de usuario:', userId);

    try {
      const { data: profile, error } = await this.supabaseService.getProfile(userId);
      
      if (error) {
        console.error('❌ [AUTH_SERVICE] Error al obtener perfil:', error);
        return { data: null, error };
      }

      console.log('📊 [AUTH_SERVICE] Datos del perfil obtenidos:', profile);

      // Combine auth user data with profile data
      const authUser = this.supabaseService.currentUser;
      console.log('📊 [AUTH_SERVICE] Datos del usuario auth:', {
        id: authUser?.id,
        email: authUser?.email,
        metadata: authUser?.user_metadata
      });

      const combinedData = {
        id: userId,
        email: authUser?.email || profile?.email || '',
        full_name: profile?.full_name || authUser?.user_metadata?.['full_name'] || '',
        avatar_url: profile?.avatar_url || authUser?.user_metadata?.['avatar_url'] || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
        created_at: profile?.created_at || '',
        updated_at: profile?.updated_at || ''
      };

      console.log('✅ [AUTH_SERVICE] Perfil combinado creado exitosamente:', combinedData);
      return { data: combinedData, error: null };
    } catch (error) {
      console.error('💥 [AUTH_SERVICE] Error inesperado al obtener perfil combinado:', error);
      return { data: null, error };
    }
  }

  // =============================================
  // ORDER MANAGEMENT METHODS
  // =============================================

  // Create a new order
  async createOrder(orderData: CreateOrderData) {
    console.log('🔄 [AUTH_SERVICE] Creando nuevo pedido...');
    const userId = this.supabaseService.getUserId();
    
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado para crear pedido');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    console.log('📝 [AUTH_SERVICE] Datos del pedido:', orderData);

    try {
      const { data, error } = await this.supabaseService.createOrder(userId, orderData);
      
      if (error) {
        console.error('❌ [AUTH_SERVICE] Error al crear pedido:', error);
        return { data: null, error };
      }

      console.log('✅ [AUTH_SERVICE] Pedido creado exitosamente:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 [AUTH_SERVICE] Error inesperado al crear pedido:', error);
      return { data: null, error };
    }
  }

  // Get user orders
  async getUserOrders() {
    console.log('🔄 [AUTH_SERVICE] Obteniendo pedidos del usuario...');
    const userId = this.supabaseService.getUserId();
    
    if (!userId) {
      console.error('❌ [AUTH_SERVICE] Usuario no autenticado');
      return { data: null, error: { message: 'User not authenticated' } };
    }

    try {
      const { data, error } = await this.supabaseService.getUserOrders(userId);
      
      if (error) {
        console.error('❌ [AUTH_SERVICE] Error al obtener pedidos:', error);
        return { data: null, error };
      }

      console.log('✅ [AUTH_SERVICE] Pedidos obtenidos exitosamente:', data?.length || 0, 'pedidos');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [AUTH_SERVICE] Error inesperado al obtener pedidos:', error);
      return { data: null, error };
    }
  }

  // Get order with details
  async getOrderWithDetails(orderId: string) {
    console.log('🔄 [AUTH_SERVICE] Obteniendo detalles del pedido:', orderId);
    
    try {
      const { data, error } = await this.supabaseService.getOrderWithDetails(orderId);
      
      if (error) {
        console.error('❌ [AUTH_SERVICE] Error al obtener detalles del pedido:', error);
        return { data: null, error };
      }

      console.log('✅ [AUTH_SERVICE] Detalles del pedido obtenidos exitosamente');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [AUTH_SERVICE] Error inesperado al obtener detalles del pedido:', error);
      return { data: null, error };
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status'], notes?: string, trackingNumber?: string) {
    console.log('🔄 [AUTH_SERVICE] Actualizando estado del pedido:', { orderId, status, notes, trackingNumber });
    
    try {
      const { data, error } = await this.supabaseService.updateOrderStatus(orderId, status, notes, trackingNumber);
      
      if (error) {
        console.error('❌ [AUTH_SERVICE] Error al actualizar estado del pedido:', error);
        return { data: null, error };
      }

      console.log('✅ [AUTH_SERVICE] Estado del pedido actualizado exitosamente');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [AUTH_SERVICE] Error inesperado al actualizar estado del pedido:', error);
      return { data: null, error };
    }
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string) {
    console.log('🔄 [AUTH_SERVICE] Obteniendo pedido por número:', orderNumber);
    
    try {
      const { data, error } = await this.supabaseService.getOrderByNumber(orderNumber);
      
      if (error) {
        console.error('❌ [AUTH_SERVICE] Error al obtener pedido por número:', error);
        return { data: null, error };
      }

      console.log('✅ [AUTH_SERVICE] Pedido obtenido por número exitosamente');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [AUTH_SERVICE] Error inesperado al obtener pedido por número:', error);
      return { data: null, error };
    }
  }

  // Utility methods
  getUserId(): string | null {
    return this.supabaseService.getUserId();
  }

  getUserEmail(): string | null {
    return this.supabaseService.getUserEmail();
  }

  // Private methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: AuthError | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private handleAuthError(error: any): AuthError {
    console.error('Auth error:', error);

    // Handle specific Supabase errors
    if (error?.message) {
      switch (error.message) {
        case 'Invalid login credentials':
          return { message: 'Credenciales incorrectas. Verifica tu email y contraseña.', code: 'invalid_credentials' };
        case 'Email not confirmed':
          return { message: 'Por favor confirma tu email antes de iniciar sesión.', code: 'email_not_confirmed' };
        case 'User already registered':
          return { message: 'Este email ya está registrado.', code: 'user_exists' };
        case 'Password should be at least 6 characters':
          return { message: 'La contraseña debe tener al menos 6 caracteres.', code: 'weak_password' };
        case 'Invalid email':
          return { message: 'El formato del email no es válido.', code: 'invalid_email' };
        case 'Too many requests':
          return { message: 'Demasiados intentos. Intenta de nuevo más tarde.', code: 'rate_limit' };
        default:
          return { message: error.message, code: error.code };
      }
    }

    return { message: 'Error de autenticación. Intenta de nuevo.', code: 'unknown_error' };
  }
} 