import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  totalSlides = 3;
  autoSlideInterval: any;
  readonly SLIDE_DURATION = 5000; // 5 seconds

  // Product data matching New Arrivals
  newArrivalsProducts = [
    { slug: '20th-century-art-collection', title: '20TH CENTURY ART COLLECTION' },
    { slug: 'abstraktes-bild-gerhard-richter', title: 'ABSTRAKTES BILD - GERHARD RICHTER' },
    { slug: 'andy-warhol-print-collection', title: 'ANDY WARHOL PRINT COLLECTION' },
    { slug: 'damien-hirst-contemporary', title: 'DAMIEN HIRST CONTEMPORARY' },
    { slug: 'david-hockney-pool-series', title: 'DAVID HOCKNEY POOL SERIES' },
    { slug: 'nina-con-un-globo', title: 'NINA CON UN GLOBO' },
    { slug: 'kaws-contemporary-collection', title: 'KAWS CONTEMPORARY COLLECTION' },
    { slug: 'yayoi-kusama-infinity', title: 'YAYOI KUSAMA INFINITY' }
  ];

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.startAutoSlide();
    // Make functions available globally for onclick handlers
    (window as any).changeSlide = this.changeSlide.bind(this);
    (window as any).currentSlide = this.goToSlide.bind(this);
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    // Clean up global functions
    delete (window as any).changeSlide;
    delete (window as any).currentSlide;
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.SLIDE_DURATION);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  changeSlide(direction: number) {
    this.stopAutoSlide();
    
    if (direction === 1) {
      this.nextSlide();
    } else {
      this.prevSlide();
    }
    
    this.startAutoSlide();
  }

  goToSlide(slideIndex: number) {
    this.stopAutoSlide();
    this.currentSlide = slideIndex - 1; // Convert to 0-based index
    this.updateSlider();
    this.startAutoSlide();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.updateSlider();
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
    this.updateSlider();
  }

  updateSlider() {
    // Update active slide
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentSlide);
    });
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentSlide);
    });
  }

  // Navigation to product detail page
  navigateToProduct(slug: string) {
    this.router.navigate(['/product', slug]);
  }


}
