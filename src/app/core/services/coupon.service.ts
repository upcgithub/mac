import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Coupon {
  code: string;
  discount: number;
  description: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  appliedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private validCoupons: { [key: string]: Coupon } = {
    'MAC10': { code: 'MAC10', discount: 10, description: '10% de descuento' },
    'WELCOME5': { code: 'WELCOME5', discount: 5, description: '5% de descuento' },
    'ART20': { code: 'ART20', discount: 20, description: '20% de descuento' },
    'FLORENCE15': { code: 'FLORENCE15', discount: 15, description: '15% de descuento' },
    'MEDICI25': { code: 'MEDICI25', discount: 25, description: '25% de descuento' }
  };

  private appliedCouponSubject = new BehaviorSubject<AppliedCoupon | null>(null);
  public appliedCoupon$ = this.appliedCouponSubject.asObservable();

  validateCoupon(code: string): Coupon | null {
    const upperCode = code.toUpperCase().trim();
    return this.validCoupons[upperCode] || null;
  }

  getAllCoupons(): Coupon[] {
    return Object.values(this.validCoupons);
  }

  getCouponByCode(code: string): Coupon | null {
    return this.validateCoupon(code);
  }

  applyCoupon(code: string): AppliedCoupon | null {
    const coupon = this.validateCoupon(code);
    if (coupon) {
      const appliedCoupon = { coupon, appliedAt: new Date() };
      this.appliedCouponSubject.next(appliedCoupon);
      return appliedCoupon;
    }
    return null;
  }

  removeCoupon(): void {
    this.appliedCouponSubject.next(null);
  }

  getAppliedCoupon(): AppliedCoupon | null {
    return this.appliedCouponSubject.value;
  }

  calculateDiscount(subtotal: number, discountPercentage: number): number {
    return (subtotal * discountPercentage) / 100;
  }
} 