import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  title: string; // e.g., "Casa", "Oficina", "Casa de mis padres"
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileData {
  profile: Profile;
  addresses: ShippingAddress[];
}

// =============================================
// ORDER SYSTEM INTERFACES
// =============================================

export interface Order {
  id: string;
  user_id: string;
  order_number: string; // Format: UF12345678
  
  // Customer Information
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  
  // Shipping Address
  shipping_address_line_1: string;
  shipping_address_line_2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  
  // Billing Address (optional)
  billing_address_line_1?: string;
  billing_address_line_2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  use_same_for_billing: boolean;
  
  // Payment Information
  payment_method: string; // 'card', 'paypal', etc.
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Order Totals
  subtotal: number;
  discount_amount: number;
  discount_code?: string;
  discount_percentage: number;
  shipping_cost: number;
  total_amount: number;
  
  // Order Status
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Additional tracking info
  notes?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  
  // Product Information
  product_id: string;
  product_name: string;
  product_image?: string;
  product_type: string; // 'hoodie', 't-shirt', 'poster', etc.
  product_variant?: string; // Size, color, etc.
  
  // Pricing
  unit_price: number;
  quantity: number;
  total_price: number; // unit_price * quantity
  
  // Timestamps
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  
  // Status Information
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  status_message: string;
  
  // Tracking Information
  tracking_number?: string;
  carrier?: string; // 'DHL', 'FedEx', 'UPS', etc.
  tracking_url?: string;
  
  // Location Information
  current_location?: string;
  estimated_delivery?: string;
  
  // Additional Notes
  notes?: string;
  
  // Timestamps
  created_at: string;
  created_by?: string;
}

export interface OrderWithDetails {
  order: Order;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface CreateOrderData {
  // Customer Information
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  
  // Shipping Address
  shipping_address_line_1: string;
  shipping_address_line_2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  
  // Billing Address (optional)
  billing_address_line_1?: string;
  billing_address_line_2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  use_same_for_billing: boolean;
  
  // Payment Information
  payment_method: string;
  
  // Order Totals
  subtotal: number;
  discount_amount: number;
  discount_code?: string;
  discount_percentage: number;
  shipping_cost: number;
  total_amount: number;
  
  // Order Items
  items: {
    product_id: string;
    product_name: string;
    product_image?: string;
    product_type: string;
    product_variant?: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }[];
  
  // Additional info
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event, session);
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user ?? null);
    });

    // Initialize with current session
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.sessionSubject.next(session);
    this.currentUserSubject.next(session?.user ?? null);
  }

  // Observables for reactive programming
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get session$(): Observable<Session | null> {
    return this.sessionSubject.asObservable();
  }

  get isAuthenticated$(): Observable<boolean> {
    return new Observable(observer => {
      this.currentUserSubject.subscribe(user => {
        observer.next(!!user);
      });
    });
  }

  // Current user getter
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get session(): Session | null {
    return this.sessionSubject.value;
  }

  // Authentication methods
  async signUp(email: string, password: string, metadata?: any) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error };
    }
  }

  async signInWithFacebook() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Facebook sign in error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  async resetPassword(email: string) {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  }

  async updatePassword(password: string) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  }

  // Profile methods
  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get profile error:', error);
      return { data: null, error };
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  }

  // Database access
  get db() {
    return this.supabase;
  }

  // Storage access
  get storage() {
    return this.supabase.storage;
  }

  // Utility methods
  async uploadAvatar(file: File, userId: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: { path: filePath, publicUrl }, error: null };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { data: null, error };
    }
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Helper method to get user ID
  getUserId(): string | null {
    return this.currentUser?.id ?? null;
  }

  // Helper method to get user email
  getUserEmail(): string | null {
    return this.currentUser?.email ?? null;
  }

  // Shipping Address methods
  async getShippingAddresses(userId: string): Promise<{ data: ShippingAddress[] | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get shipping addresses error:', error);
      return { data: null, error };
    }
  }

  async createShippingAddress(address: Omit<ShippingAddress, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ShippingAddress | null; error: any }> {
    try {
      // If this is set as default, unset other defaults first
      if (address.is_default) {
        await this.supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', address.user_id);
      }

      const { data, error } = await this.supabase
        .from('shipping_addresses')
        .insert({
          ...address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create shipping address error:', error);
      return { data: null, error };
    }
  }

  async updateShippingAddress(addressId: string, updates: Partial<ShippingAddress>): Promise<{ data: ShippingAddress | null; error: any }> {
    try {
      // If this is set as default, unset other defaults first
      if (updates.is_default) {
        const { data: currentAddress } = await this.supabase
          .from('shipping_addresses')
          .select('user_id')
          .eq('id', addressId)
          .single();

        if (currentAddress) {
          await this.supabase
            .from('shipping_addresses')
            .update({ is_default: false })
            .eq('user_id', currentAddress.user_id);
        }
      }

      const { data, error } = await this.supabase
        .from('shipping_addresses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update shipping address error:', error);
      return { data: null, error };
    }
  }

  async deleteShippingAddress(addressId: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete shipping address error:', error);
      return { error };
    }
  }

  async setDefaultShippingAddress(addressId: string, userId: string): Promise<{ error: any }> {
    try {
      // First, unset all defaults for this user
      await this.supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Then set the new default
      const { error } = await this.supabase
        .from('shipping_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Set default shipping address error:', error);
      return { error };
    }
  }

  // Get complete user profile data
  async getUserProfileData(userId: string): Promise<{ data: UserProfileData | null; error: any }> {
    try {
      const [profileResult, addressesResult] = await Promise.all([
        this.getProfile(userId),
        this.getShippingAddresses(userId)
      ]);

      if (profileResult.error) throw profileResult.error;
      if (addressesResult.error) throw addressesResult.error;

      const data: UserProfileData = {
        profile: profileResult.data!,
        addresses: addressesResult.data || []
      };

      return { data, error: null };
    } catch (error) {
      console.error('Get user profile data error:', error);
      return { data: null, error };
    }
  }

  // =============================================
  // ORDER MANAGEMENT METHODS
  // =============================================

  // Create a new order
  async createOrder(userId: string, orderData: CreateOrderData): Promise<{ data: Order | null; error: any }> {
    try {
      console.log('🔄 [SUPABASE] Creating new order for user:', userId);
      console.log('📝 [SUPABASE] Order data:', orderData);

      // Generate order number
      const { data: orderNumber, error: orderNumberError } = await this.supabase
        .rpc('generate_order_number');

      if (orderNumberError) {
        console.error('❌ [SUPABASE] Error generating order number:', orderNumberError);
        throw orderNumberError;
      }

      console.log('🔢 [SUPABASE] Generated order number:', orderNumber);

      // Create order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_number: orderNumber,
          customer_email: orderData.customer_email,
          customer_first_name: orderData.customer_first_name,
          customer_last_name: orderData.customer_last_name,
          customer_phone: orderData.customer_phone,
          shipping_address_line_1: orderData.shipping_address_line_1,
          shipping_address_line_2: orderData.shipping_address_line_2,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_postal_code: orderData.shipping_postal_code,
          shipping_country: orderData.shipping_country,
          billing_address_line_1: orderData.billing_address_line_1,
          billing_address_line_2: orderData.billing_address_line_2,
          billing_city: orderData.billing_city,
          billing_state: orderData.billing_state,
          billing_postal_code: orderData.billing_postal_code,
          billing_country: orderData.billing_country,
          use_same_for_billing: orderData.use_same_for_billing,
          payment_method: orderData.payment_method,
          payment_status: 'paid', // Assuming payment is successful
          subtotal: orderData.subtotal,
          discount_amount: orderData.discount_amount,
          discount_code: orderData.discount_code,
          discount_percentage: orderData.discount_percentage,
          shipping_cost: orderData.shipping_cost,
          total_amount: orderData.total_amount,
          status: 'confirmed',
          notes: orderData.notes
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ [SUPABASE] Error creating order:', orderError);
        throw orderError;
      }

      console.log('✅ [SUPABASE] Order created successfully:', order);

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        product_type: item.product_type,
        product_variant: item.product_variant,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price
      }));

      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ [SUPABASE] Error creating order items:', itemsError);
        throw itemsError;
      }

      console.log('✅ [SUPABASE] Order items created successfully');

      return { data: order, error: null };
    } catch (error) {
      console.error('💥 [SUPABASE] Error creating order:', error);
      return { data: null, error };
    }
  }

  // Get user orders
  async getUserOrders(userId: string): Promise<{ data: Order[] | null; error: any }> {
    try {
      console.log('🔄 [SUPABASE] Getting orders for user:', userId);

      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [SUPABASE] Error getting user orders:', error);
        throw error;
      }

      console.log('✅ [SUPABASE] User orders retrieved:', data?.length || 0, 'orders');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [SUPABASE] Error getting user orders:', error);
      return { data: null, error };
    }
  }

  // Get order with details (items and status history)
  async getOrderWithDetails(orderId: string): Promise<{ data: OrderWithDetails | null; error: any }> {
    try {
      console.log('🔄 [SUPABASE] Getting order details for:', orderId);

      const [orderResult, itemsResult, historyResult] = await Promise.all([
        this.supabase.from('orders').select('*').eq('id', orderId).single(),
        this.supabase.from('order_items').select('*').eq('order_id', orderId),
        this.supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: true })
      ]);

      if (orderResult.error) {
        console.error('❌ [SUPABASE] Error getting order:', orderResult.error);
        throw orderResult.error;
      }

      if (itemsResult.error) {
        console.error('❌ [SUPABASE] Error getting order items:', itemsResult.error);
        throw itemsResult.error;
      }

      if (historyResult.error) {
        console.error('❌ [SUPABASE] Error getting order history:', historyResult.error);
        throw historyResult.error;
      }

      const data: OrderWithDetails = {
        order: orderResult.data,
        items: itemsResult.data || [],
        statusHistory: historyResult.data || []
      };

      console.log('✅ [SUPABASE] Order details retrieved successfully');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [SUPABASE] Error getting order details:', error);
      return { data: null, error };
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status'], notes?: string, trackingNumber?: string): Promise<{ data: Order | null; error: any }> {
    try {
      console.log('🔄 [SUPABASE] Updating order status:', { orderId, status, notes, trackingNumber });

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) updateData.notes = notes;
      if (trackingNumber) updateData.tracking_number = trackingNumber;

      const { data, error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ [SUPABASE] Error updating order status:', error);
        throw error;
      }

      console.log('✅ [SUPABASE] Order status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [SUPABASE] Error updating order status:', error);
      return { data: null, error };
    }
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<{ data: Order | null; error: any }> {
    try {
      console.log('🔄 [SUPABASE] Getting order by number:', orderNumber);

      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        console.error('❌ [SUPABASE] Error getting order by number:', error);
        throw error;
      }

      console.log('✅ [SUPABASE] Order retrieved by number successfully');
      return { data, error: null };
    } catch (error) {
      console.error('💥 [SUPABASE] Error getting order by number:', error);
      return { data: null, error };
    }
  }
} 