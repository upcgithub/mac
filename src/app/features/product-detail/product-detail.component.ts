import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { CartService } from '../../core/services/cart.service';
import { AiTryonComponent, GeneratedImage } from './components/ai-tryon/ai-tryon.component';

interface ProductType {
  id: string;
  name: string;
  icon: string;
  basePrice: number;
  description: string;
}

interface ProductAngle {
  name: string;
  image: string;
  label: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  description: string;
  shortDescription: string;
  availability: 'in-stock' | 'out-of-stock';
  sku: string;
  categories: string[];
  artistSlug?: string; // Para mapear con las imágenes organizadas
  productTypes?: ProductType[];
  details: {
    editor?: string;
    publisher?: string;
    cover?: string;
    pages?: number;
    dimensions?: string;
    publicationDate?: number;
    isbn?: string;
    weight?: string;
    language?: string;
  };
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, AiTryonComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  quantity: number = 1;
  activeTab: 'description' | 'additional' = 'description';
  loading: boolean = true;
  
  // Nueva funcionalidad para tipos de productos
  selectedProductType: ProductType | null = null;
  currentAngleIndex: number = 0;
  productAngles: ProductAngle[] = [];
  
  // AI Try-On functionality
  showAiTryon: boolean = false;
  
  // Tipos de productos disponibles
  availableProductTypes: ProductType[] = [
    {
      id: 't-shirt',
      name: 'Camiseta',
      icon: '👕',
      basePrice: 25.00,
      description: 'Camiseta 100% algodón con diseño de alta calidad'
    },
    {
      id: 'sweatshirt',
      name: 'Sudadera',
      icon: '👔',
      basePrice: 45.00,
      description: 'Sudadera cómoda con forro interior suave'
    },
    {
      id: 'hoodie',
      name: 'Hoodie',
      icon: '🧥',
      basePrice: 55.00,
      description: 'Hoodie con capucha y bolsillo frontal'
    },
    {
      id: 'mug',
      name: 'Taza',
      icon: '☕',
      basePrice: 15.00,
      description: 'Taza cerámica premium de 11oz'
    },
    {
      id: 'poster',
      name: 'Póster',
      icon: '🖼️',
      basePrice: 20.00,
      description: 'Póster de alta calidad en papel mate'
    },

  ];

  // Mock data - Productos de New Arrivals para navegación
  private mockProducts: Product[] = [
    // New Arrivals Products (usando las mismas imágenes e info)
    {
      id: '1',
      slug: '20th-century-art-collection',
      name: '20TH CENTURY ART COLLECTION',
      price: 45.00,
      image: '/assets/images/Century.png',
      description: 'A comprehensive collection showcasing the revolutionary art movements of the 20th century, featuring works from major artists who shaped modern artistic expression.',
      shortDescription: 'Comprehensive collection of 20th century revolutionary art movements and major artists.',
      availability: 'in-stock',
      sku: 'ART-20C-001',
      categories: ['Books', 'Art History'],
      artistSlug: '20th-century',
      details: {
        publisher: 'MAC Editions',
        cover: 'Hardback',
        pages: 320,
        dimensions: 'cm 28 x 35',
        publicationDate: 2024,
        weight: 'gr 1800',
        language: 'English'
      }
    },
    {
      id: '2',
      slug: 'abstraktes-bild-gerhard-richter',
      name: 'ABSTRAKTES BILD - GERHARD RICHTER',
      price: 85.00,
      image: '/assets/images/Abstraktes Bild.png',
      description: 'Explore the abstract masterpieces of Gerhard Richter, one of the most important contemporary artists, known for his innovative techniques and conceptual depth.',
      shortDescription: 'Abstract masterpieces by Gerhard Richter, contemporary art innovator.',
      availability: 'in-stock',
      sku: 'RICH-AB-001',
      categories: ['Books', 'Contemporary Art'],
      artistSlug: 'abstraktes-bild',
      details: {
        publisher: 'Modern Art Press',
        cover: 'Hardback',
        pages: 240,
        dimensions: 'cm 25 x 30',
        publicationDate: 2024,
        weight: 'gr 1500',
        language: 'English'
      }
    },
    {
      id: '3',
      slug: 'andy-warhol-print-collection',
      name: 'ANDY WARHOL PRINT COLLECTION',
      price: 65.00,
      image: '/assets/images/Andy Warhol.png',
      description: 'Discover the iconic pop art prints of Andy Warhol, featuring his most famous works including Campbell\'s Soup Cans, Marilyn Monroe, and other cultural icons.',
      shortDescription: 'Iconic pop art prints including Campbell\'s Soup Cans and Marilyn Monroe.',
      availability: 'in-stock',
      sku: 'WARH-PC-001',
      categories: ['Books', 'Pop Art'],
      artistSlug: 'andy-warhol',
      details: {
        publisher: 'Pop Art Publications',
        cover: 'Hardback',
        pages: 180,
        dimensions: 'cm 30 x 30',
        publicationDate: 2024,
        weight: 'gr 1200',
        language: 'English'
      }
    },
    {
      id: '4',
      slug: 'damien-hirst-contemporary',
      name: 'DAMIEN HIRST CONTEMPORARY',
      price: 120.00,
      image: '/assets/images/Damien Hirst.png',
      description: 'A comprehensive look at Damien Hirst\'s provocative contemporary works, from his famous shark installations to diamond skulls and butterfly paintings.',
      shortDescription: 'Provocative contemporary works from shark installations to diamond skulls.',
      availability: 'in-stock',
      sku: 'HIRST-CON-001',
      categories: ['Books', 'Contemporary Art'],
      artistSlug: 'damien-hirst',
      details: {
        publisher: 'Contemporary Art Review',
        cover: 'Hardback',
        pages: 280,
        dimensions: 'cm 27 x 32',
        publicationDate: 2024,
        weight: 'gr 2200',
        language: 'English'
      }
    },
    {
      id: '5',
      slug: 'david-hockney-pool-series',
      name: 'DAVID HOCKNEY POOL SERIES',
      price: 95.00,
      image: '/assets/images/David Hockney.png',
      description: 'Immerse yourself in David Hockney\'s famous pool paintings, capturing the essence of California lifestyle with vibrant colors and innovative perspectives.',
      shortDescription: 'Famous pool paintings capturing California lifestyle with vibrant colors.',
      availability: 'in-stock',
      sku: 'HOCK-POOL-001',
      categories: ['Books', 'Modern Art'],
      details: {
        publisher: 'California Art Press',
        cover: 'Hardback',
        pages: 200,
        dimensions: 'cm 26 x 30',
        publicationDate: 2024,
        weight: 'gr 1400',
        language: 'English'
      }
    },
    {
      id: '6',
      slug: 'nina-con-un-globo',
      name: 'NINA CON UN GLOBO',
      price: 55.00,
      image: '/assets/images/Nina con un Globo.png',
      description: 'A touching artistic exploration of childhood innocence and dreams, featuring contemporary interpretations of classic themes through modern artistic techniques.',
      shortDescription: 'Artistic exploration of childhood innocence through modern techniques.',
      availability: 'in-stock',
      sku: 'NINA-GLOB-001',
      categories: ['Books', 'Contemporary Art'],
      artistSlug: 'nina-con-globo',
      details: {
        publisher: 'Modern Expressions',
        cover: 'Softcover',
        pages: 150,
        dimensions: 'cm 22 x 28',
        publicationDate: 2024,
        weight: 'gr 800',
        language: 'Spanish'
      }
    },
    {
      id: '7',
      slug: 'kaws-contemporary-collection',
      name: 'KAWS CONTEMPORARY COLLECTION',
      price: 180.00,
      image: '/assets/images/Obras de Kaws.png',
      description: 'Explore the world of KAWS, from street art to gallery exhibitions, featuring his iconic characters and sculptures that blur the lines between high and low culture.',
      shortDescription: 'Street art to gallery exhibitions with iconic characters and sculptures.',
      availability: 'in-stock',
      sku: 'KAWS-COL-001',
      categories: ['Books', 'Street Art'],
      artistSlug: 'kaws',
      details: {
        publisher: 'Urban Art Editions',
        cover: 'Hardback Premium',
        pages: 350,
        dimensions: 'cm 30 x 35',
        publicationDate: 2024,
        weight: 'gr 2500',
        language: 'English'
      }
    },
    {
      id: '8',
      slug: 'yayoi-kusama-infinity',
      name: 'YAYOI KUSAMA INFINITY',
      price: 150.00,
      image: '/assets/images/Yayoi Kusama.png',
      description: 'Enter the infinite world of Yayoi Kusama\'s polka dots and infinity rooms, exploring her unique artistic vision and psychological depth through decades of creation.',
      shortDescription: 'Infinite world of polka dots and infinity rooms with unique artistic vision.',
      availability: 'in-stock',
      sku: 'KUSAMA-INF-001',
      categories: ['Books', 'Contemporary Art'],
      details: {
        publisher: 'Infinity Art Press',
        cover: 'Hardback',
        pages: 300,
        dimensions: 'cm 28 x 32',
        publicationDate: 2024,
        weight: 'gr 2000',
        language: 'English'
      }
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Simular carga de datos
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadProduct(slug);
    });
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  private loadProduct(slug: string) {
    // Simular llamada a API
    setTimeout(() => {
      this.product = this.mockProducts.find(p => p.slug === slug) || null;
      this.loading = false;
      
      if (!this.product) {
        // Redirect to 404 or homepage
        this.router.navigate(['/']);
      }
    }, 500);
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (this.product) {
      // Agregar producto al carrito usando el servicio
      this.cartService.addToCart({
        id: this.product.id,
        name: this.product.name,
        price: this.product.price,
        image: this.product.image
      }, this.quantity);
      
      console.log(`Added ${this.quantity} x ${this.product.name} to cart`);
      
      // Mostrar feedback visual (opcional)
      this.showAddToCartFeedback();
    }
  }

  private showAddToCartFeedback() {
    // Cambiar temporalmente el texto del botón para mostrar confirmación
    const button = document.querySelector('.add-to-cart-btn') as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Added to cart ✓';
      button.style.backgroundColor = '#22c55e';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 2000);
    }
  }

  setActiveTab(tab: 'description' | 'additional') {
    this.activeTab = tab;
  }

  goBack() {
    window.history.back();
  }

  // Nuevas funciones para tipos de productos y ángulos
  selectProductType(productType: ProductType) {
    this.selectedProductType = productType;
    this.currentAngleIndex = 0;
    this.loadProductAngles();
  }

  private loadProductAngles() {
    if (!this.product?.artistSlug || !this.selectedProductType) {
      this.productAngles = [];
      return;
    }

    // Cargar las 4 imágenes de ángulos para el tipo de producto seleccionado
    const basePath = `/assets/images/products/${this.product.artistSlug}/${this.selectedProductType.id}`;
    this.productAngles = [
      {
        name: 'front',
        image: `${basePath}/front.jpg`,
        label: 'Vista Frontal'
      },
      {
        name: 'back', 
        image: `${basePath}/back.jpg`,
        label: 'Vista Trasera'
      },
      {
        name: 'left',
        image: `${basePath}/left.jpg`, 
        label: 'Vista Lateral Izquierda'
      },
      {
        name: 'right',
        image: `${basePath}/right.jpg`,
        label: 'Vista Lateral Derecha'
      }
    ];
  }

  selectAngle(index: number) {
    this.currentAngleIndex = index;
  }

  nextAngle() {
    this.currentAngleIndex = (this.currentAngleIndex + 1) % this.productAngles.length;
  }

  previousAngle() {
    this.currentAngleIndex = this.currentAngleIndex === 0 
      ? this.productAngles.length - 1 
      : this.currentAngleIndex - 1;
  }

  getCurrentImage(): string {
    if (this.productAngles.length > 0) {
      return this.productAngles[this.currentAngleIndex].image;
    }
    return this.product?.image || '';
  }

  getCurrentPrice(): number {
    if (this.selectedProductType) {
      return this.selectedProductType.basePrice;
    }
    return this.product?.price || 0;
  }

  hasProductTypes(): boolean {
    return this.product?.artistSlug !== undefined;
  }

  addCustomProductToCart() {
    if (this.product && this.selectedProductType) {
      // Agregar producto personalizado al carrito
      this.cartService.addToCart({
        id: `${this.product.id}-${this.selectedProductType.id}`,
        name: `${this.product.name} - ${this.selectedProductType.name}`,
        price: this.selectedProductType.basePrice,
        image: this.getCurrentImage()
      }, this.quantity);
      
      console.log(`Added ${this.quantity} x ${this.selectedProductType.name} to cart`);
      this.showAddToCartFeedback();
    }
  }

  // ===== AI TRY-ON METHODS =====
  openAiTryon() {
    this.showAiTryon = true;
  }

  closeAiTryon() {
    this.showAiTryon = false;
  }

  onAiTryonAddToCart(generatedImage: GeneratedImage) {
    if (this.product && this.selectedProductType) {
      this.cartService.addToCart({
        id: `${this.product.id}-${this.selectedProductType.id}-ai-${generatedImage.id}`,
        name: `${this.product.name} - ${this.selectedProductType.name} (AI Generated)`,
        price: this.selectedProductType.basePrice,
        image: generatedImage.generatedImage
      }, this.quantity);
      
      this.showAddToCartFeedback();
      this.closeAiTryon();
    }
  }

  // Determina si el producto es apto para AI Try-On
  canUseAiTryon(): boolean {
    return !!this.selectedProductType && ['t-shirt', 'hoodie', 'sweatshirt', 'mug', 'poster'].includes(this.selectedProductType.id);
  }

  // Obtiene el tipo de producto para el AI Try-On
  getProductTypeForAI(): string {
    return this.selectedProductType?.id || '';
  }

  // Obtiene el nombre del producto para el AI Try-On
  getProductNameForAI(): string {
    if (this.product && this.selectedProductType) {
      return `${this.product.name} - ${this.selectedProductType.name}`;
    }
    return this.product?.name || '';
  }
} 