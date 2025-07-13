import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { AuthService } from '../../core/services/auth.service';
import { Order, OrderWithDetails, OrderStatusHistory } from '../../core/services/supabase.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State management
  loading = false;
  error: string | null = null;
  
  // Orders data
  orders: Order[] = [];
  selectedOrder: OrderWithDetails | null = null;
  showOrderDetails = false;
  
  // UI state
  activeFilter: 'all' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' = 'all';
  
  // Status configuration
  statusConfig = {
    confirmed: {
      label: 'Confirmado',
      color: '#22c55e',
      icon: '✓',
      bgColor: '#dcfce7'
    },
    processing: {
      label: 'Procesando',
      color: '#f59e0b',
      icon: '⏳',
      bgColor: '#fef3c7'
    },
    shipped: {
      label: 'Enviado',
      color: '#3b82f6',
      icon: '🚚',
      bgColor: '#dbeafe'
    },
    delivered: {
      label: 'Entregado',
      color: '#10b981',
      icon: '📦',
      bgColor: '#d1fae5'
    },
    cancelled: {
      label: 'Cancelado',
      color: '#ef4444',
      icon: '❌',
      bgColor: '#fee2e2'
    }
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('🔄 [ORDERS] Iniciando componente de pedidos...');
    await this.loadOrders();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadOrders() {
    console.log('🔄 [ORDERS] Cargando pedidos del usuario...');
    this.loading = true;
    this.error = null;

    try {
      const { data, error } = await this.authService.getUserOrders();

      if (error) {
        console.error('❌ [ORDERS] Error al cargar pedidos:', error);
        this.error = 'Error al cargar los pedidos';
        return;
      }

      if (data) {
        this.orders = data;
        console.log('✅ [ORDERS] Pedidos cargados exitosamente:', data.length, 'pedidos');
        console.log('📊 [ORDERS] Detalles de pedidos:', data);
      } else {
        console.warn('⚠️ [ORDERS] No se recibieron datos de pedidos');
        this.orders = [];
      }
    } catch (error) {
      console.error('💥 [ORDERS] Error inesperado al cargar pedidos:', error);
      this.error = 'Error al cargar los pedidos';
    } finally {
      this.loading = false;
      console.log('🏁 [ORDERS] Carga de pedidos completada');
    }
  }

  async showOrderDetail(order: Order) {
    console.log('🔄 [ORDERS] Mostrando detalles del pedido:', order.order_number);
    this.loading = true;
    this.error = null;

    try {
      const { data, error } = await this.authService.getOrderWithDetails(order.id);

      if (error) {
        console.error('❌ [ORDERS] Error al cargar detalles del pedido:', error);
        this.error = 'Error al cargar los detalles del pedido';
        return;
      }

      if (data) {
        this.selectedOrder = data;
        this.showOrderDetails = true;
        console.log('✅ [ORDERS] Detalles del pedido cargados exitosamente:', data);
      } else {
        console.warn('⚠️ [ORDERS] No se recibieron detalles del pedido');
      }
    } catch (error) {
      console.error('💥 [ORDERS] Error inesperado al cargar detalles del pedido:', error);
      this.error = 'Error al cargar los detalles del pedido';
    } finally {
      this.loading = false;
      console.log('🏁 [ORDERS] Carga de detalles del pedido completada');
    }
  }

  closeOrderDetails() {
    console.log('🔄 [ORDERS] Cerrando detalles del pedido');
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  setActiveFilter(filter: typeof this.activeFilter) {
    console.log('🔄 [ORDERS] Cambiando filtro a:', filter);
    this.activeFilter = filter;
  }

  get filteredOrders(): Order[] {
    if (this.activeFilter === 'all') {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.activeFilter);
  }

  // Filter count methods for template
  getConfirmedOrdersCount(): number {
    return this.orders.filter(order => order.status === 'confirmed').length;
  }

  getProcessingOrdersCount(): number {
    return this.orders.filter(order => order.status === 'processing').length;
  }

  getShippedOrdersCount(): number {
    return this.orders.filter(order => order.status === 'shipped').length;
  }

  getDeliveredOrdersCount(): number {
    return this.orders.filter(order => order.status === 'delivered').length;
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatOrderDateTime(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Si es hoy, mostrar solo la hora
    if (date.toDateString() === today.toDateString()) {
      return `Hoy a las ${date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    // Si es ayer, mostrar "Ayer"
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer a las ${date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    // Si es de esta semana, mostrar día de la semana
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const time = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${weekday} a las ${time}`;
    }

    // Para fechas más antiguas, mostrar fecha completa con hora
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  getStatusConfig(status: Order['status']) {
    return this.statusConfig[status] || this.statusConfig.confirmed;
  }

  formatAddress(order: Order): string {
    let address = order.shipping_address_line_1;
    if (order.shipping_address_line_2) {
      address += `, ${order.shipping_address_line_2}`;
    }
    address += `, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`;
    address += `, ${order.shipping_country}`;
    return address;
  }

  getOrderProgress(status: Order['status']): number {
    const progressMap = {
      confirmed: 25,
      processing: 50,
      shipped: 75,
      delivered: 100,
      cancelled: 0
    };
    return progressMap[status] || 0;
  }

  getNextStatus(currentStatus: Order['status']): string {
    const statusFlow = {
      confirmed: 'En proceso de preparación',
      processing: 'Será enviado pronto',
      shipped: 'En camino a su destino',
      delivered: 'Pedido completado',
      cancelled: 'Pedido cancelado'
    };
    return statusFlow[currentStatus] || 'Estado desconocido';
  }

  // Navigation methods
  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  // Error handling
  clearError() {
    this.error = null;
  }
} 