import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private cartItemCount = new BehaviorSubject<number>(0);

  // Observables para que los componentes se suscriban
  cartItems$ = this.cartItems.asObservable();
  cartItemCount$ = this.cartItemCount.asObservable();

  constructor() {
    // Cargar carrito desde localStorage si existe
    this.loadCartFromStorage();
  }

  // Agregar producto al carrito
  addToCart(product: Omit<CartItem, 'quantity'>, quantity: number = 1): void {
    const currentItems = this.cartItems.value;
    const existingItemIndex = currentItems.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      // Si el producto ya existe, aumentar la cantidad
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      // Si es un producto nuevo, agregarlo
      currentItems.push({ ...product, quantity });
    }

    this.updateCart(currentItems);
  }

  // Quitar producto del carrito
  removeFromCart(productId: string): void {
    const currentItems = this.cartItems.value.filter(item => item.id !== productId);
    this.updateCart(currentItems);
  }

  // Actualizar cantidad de un producto específico
  updateQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const itemIndex = currentItems.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        currentItems.splice(itemIndex, 1); // Quitar si cantidad es 0 o menos
      } else {
        currentItems[itemIndex].quantity = quantity;
      }
      this.updateCart(currentItems);
    }
  }

  // Limpiar carrito
  clearCart(): void {
    this.updateCart([]);
  }

  // Obtener total del carrito
  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Obtener número total de items
  getTotalItemCount(): number {
    return this.cartItems.value.reduce((total, item) => total + item.quantity, 0);
  }

  // Actualizar carrito y persistir en localStorage
  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    this.cartItemCount.next(this.getTotalItemCount());
    this.saveCartToStorage();
  }

  // Guardar en localStorage
  private saveCartToStorage(): void {
    localStorage.setItem('mac-cart', JSON.stringify(this.cartItems.value));
  }

  // Cargar desde localStorage
  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('mac-cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart) as CartItem[];
        this.updateCart(items);
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        this.updateCart([]);
      }
    }
  }
} 