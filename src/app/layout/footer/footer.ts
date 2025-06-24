import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  newsletterEmail = '';
  isSubscribing = false;
  subscriptionMessage = '';

  constructor() {}

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.newsletterEmail || !this.isValidEmail(this.newsletterEmail)) {
      this.subscriptionMessage = 'Please enter a valid email address.';
      return;
    }

    this.isSubscribing = true;
    this.subscriptionMessage = '';

    // Simulate newsletter subscription
    setTimeout(() => {
      this.isSubscribing = false;
      this.subscriptionMessage = 'Thank you for subscribing to our newsletter!';
      this.newsletterEmail = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        this.subscriptionMessage = '';
      }, 3000);
    }, 1000);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Navigation methods for footer links
  navigateToProducts(): void {
    // TODO: Implement navigation to products page
    console.log('Navigate to products');
  }

  navigateToSupport(): void {
    // TODO: Implement navigation to support page
    console.log('Navigate to support');
  }

  navigateToTerms(): void {
    // TODO: Implement navigation to terms page
    console.log('Navigate to terms');
  }

  // Social media methods
  openSocialMedia(platform: string): void {
    const urls = {
          facebook: 'https://www.facebook.com/maclima',
    instagram: 'https://www.instagram.com/maclima',
    twitter: 'https://twitter.com/maclima',
      youtube: 'https://www.youtube.com/channel/UCVFaRNkLFtdKqNLsLLOFv5w'
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // Contact methods
  callPhone(): void {
    window.location.href = 'tel:+390552388651';
  }

  // Get current year for copyright
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
} 