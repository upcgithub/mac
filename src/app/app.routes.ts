import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'MAC Shop - Official Store'
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent),
    title: 'Iniciar Sesión - MAC Shop'
  },
  {
    path: 'product/:slug',
    loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    title: 'Product Details - MAC Shop'
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then(m => m.CartComponent),
    title: 'Shopping Cart - MAC Shop'
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout').then(m => m.CheckoutComponent),
    title: 'Checkout - MAC Shop'
  },
  {
    path: 'order-success',
    loadComponent: () => import('./features/order-success/order-success').then(m => m.OrderSuccessComponent),
    title: 'Order Confirmed - MAC Shop'
  },
  // TODO: Add other routes
  // {
  //   path: 'apparel',
  //   loadComponent: () => import('./features/products/products').then(m => m.ProductsComponent)
  // },
  // {
  //   path: 'kids',
  //   loadComponent: () => import('./features/products/products').then(m => m.ProductsComponent)
  // },
  // Add more routes as needed
  {
    path: '**',
    redirectTo: ''
  }
];
