import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.html',
  styleUrls: ['./order-success.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent
  ]
})
export class OrderSuccessComponent implements OnInit {
  orderNumber: string = '';
  orderTotal: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get order details from query parameters
    this.route.queryParams.subscribe(params => {
      this.orderNumber = params['orderNumber'] || 'UF00000000';
      this.orderTotal = params['total'] || '0.00';
    });
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  viewOrders(): void {
    // In a real app, this would navigate to a user orders page
    // For now, we'll just navigate to home
    alert('Order tracking feature coming soon!');
    this.router.navigate(['/']);
  }
} 