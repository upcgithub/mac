import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenaiImageService, AiTryonResult } from '../../../../core/services/openai-image.service';
import { Subscription } from 'rxjs';

export interface GeneratedImage {
  id: string;
  originalImage: string;
  generatedImage: string;
  timestamp: Date;
  productType: string;
  productName: string;
}

@Component({
  selector: 'app-ai-tryon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-tryon.component.html',
  styleUrls: ['./ai-tryon.component.scss']
})
export class AiTryonComponent implements OnInit, OnDestroy {
  @Input() productName: string = '';
  @Input() productType: string = '';
  @Input() productImage: string = '';
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<GeneratedImage>();

  // Estados del componente
  currentStep: 'upload' | 'processing' | 'result' = 'upload';
  uploadedImage: File | null = null;
  uploadedImagePreview: string = '';
  generatedImages: GeneratedImage[] = [];
  selectedGeneratedImage: GeneratedImage | null = null;
  
  // Estados de progreso
  isProcessing: boolean = false;
  processingProgress: number = 0;
  processingMessage: string = '';
  estimatedTimeRemaining: number = 0;
  
  // Estados de UI
  isDragOver: boolean = false;
  showTimeline: boolean = false;
  error: string = '';

  private progressInterval?: any;
  private generationSubscription?: Subscription;

  constructor(private openAIService: OpenaiImageService) {}

  ngOnInit() {
    this.loadSavedGenerations();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  // ===== UPLOAD DE IMÁGENES =====
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  private handleFile(file: File): void {
    this.error = '';
    
    // Validar imagen
    const validation = this.openAIService.validateImage(file);
    if (!validation.valid) {
      this.error = validation.error || 'Imagen no válida';
      return;
    }

    this.uploadedImage = file;
    this.createImagePreview(file);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeUploadedImage(): void {
    this.uploadedImage = null;
    this.uploadedImagePreview = '';
    this.error = '';
  }

  // ===== GENERACIÓN DE IMÁGENES =====
  async generateImage(): Promise<void> {
    if (!this.uploadedImage) return;

    this.startProcessing();

    try {
      // Convert product image URL to File
      const productImageFile = await this.urlToFile(this.productImage, 'product.jpg');
      
      this.generationSubscription = this.openAIService.generateTryOnImage(
        this.uploadedImage, 
        productImageFile, 
        this.productType
      ).subscribe({
        next: (result: AiTryonResult) => {
          this.handleGenerationComplete(result);
        },
        error: (error: any) => {
          this.handleGenerationError(error);
        }
      });

    } catch (error) {
      this.handleGenerationError(error);
    }
  }

  private async urlToFile(url: string, filename: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }

  private startProcessing(): void {
    this.isProcessing = true;
    this.currentStep = 'processing';
    this.processingProgress = 0;
    this.estimatedTimeRemaining = 90; // 90 segundos estimado
    this.processingMessage = 'Analizando tu imagen...';

    // Simular progreso
    this.startProgressSimulation();
  }

  private startProgressSimulation(): void {
    const messages = [
      'Analizando tu imagen...',
      'Detectando elementos de la foto...',
      'Preparando la integración del producto...',
      'Generando imagen con IA...',
      'Aplicando toques finales...',
      'Casi listo...'
    ];

    let messageIndex = 0;
    let progress = 0;

    this.progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Incremento entre 5-20%
      
      if (progress > 95) {
        progress = 95; // No llegar a 100% hasta completar
      }
      
      this.processingProgress = Math.min(progress, 95);
      this.estimatedTimeRemaining = Math.max(0, this.estimatedTimeRemaining - 3);
      
      // Cambiar mensaje cada ~20%
      if (progress > (messageIndex + 1) * 15 && messageIndex < messages.length - 1) {
        messageIndex++;
        this.processingMessage = messages[messageIndex];
      }
      
    }, 3000); // Cada 3 segundos
  }

  private handleGenerationComplete(result: AiTryonResult): void {
    this.cleanup();
    
    if (result && result.generatedImageUrl) {
      const newGeneration: GeneratedImage = {
        id: result.id,
        originalImage: this.uploadedImagePreview,
        generatedImage: result.generatedImageUrl,
        timestamp: result.timestamp,
        productType: this.productType,
        productName: this.productName
      };

      this.generatedImages.unshift(newGeneration);
      this.selectedGeneratedImage = newGeneration;
      this.currentStep = 'result';
      this.processingProgress = 100;
      this.processingMessage = '¡Completado!';
      
      // Guardar en localStorage
      this.saveGeneration(newGeneration);
      
      // Mostrar timeline si hay múltiples generaciones
      this.showTimeline = this.generatedImages.length > 1;
      
    } else {
      this.handleGenerationError(new Error('No se pudo generar la imagen'));
    }
  }

  private handleGenerationError(error: any): void {
    this.cleanup();
    this.currentStep = 'upload';
    this.error = error?.message || 'Error al generar la imagen. Inténtalo de nuevo.';
    console.error('Generation error:', error);
  }

  private cleanup(): void {
    this.isProcessing = false;
    this.processingProgress = 0;
    this.estimatedTimeRemaining = 0;
    
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
    
    if (this.generationSubscription) {
      this.generationSubscription.unsubscribe();
      this.generationSubscription = undefined;
    }
  }

  // ===== NAVEGACIÓN DE RESULTADOS =====
  selectGeneration(generation: GeneratedImage): void {
    this.selectedGeneratedImage = generation;
  }

  regenerateImage(): void {
    this.generateImage();
  }

  downloadImage(): void {
    if (!this.selectedGeneratedImage) return;
    
    const link = document.createElement('a');
    link.href = this.selectedGeneratedImage.generatedImage;
    link.download = `tryon-${this.productName}-${Date.now()}.png`;
    link.click();
  }

  shareImage(): void {
    if (!this.selectedGeneratedImage) return;
    
    if (navigator.share) {
      // API Web Share nativa (móviles principalmente)
      navigator.share({
        title: `Prueba virtual - ${this.productName}`,
        text: `¡Mira cómo me queda este ${this.productName}!`,
        url: this.selectedGeneratedImage.generatedImage
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(this.selectedGeneratedImage.generatedImage)
        .then(() => {
          alert('¡Enlace copiado al portapapeles!');
        });
    }
  }

  addGeneratedToCart(): void {
    if (this.selectedGeneratedImage) {
      this.addToCart.emit(this.selectedGeneratedImage);
    }
  }

  // ===== PERSISTENCIA =====
  private saveGeneration(generation: GeneratedImage): void {
    try {
      const saved = localStorage.getItem('ai_generations') || '[]';
      const generations = JSON.parse(saved);
      generations.unshift(generation);
      
      // Mantener solo las últimas 10
      const limited = generations.slice(0, 10);
      localStorage.setItem('ai_generations', JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  }

  private loadSavedGenerations(): void {
    try {
      const saved = localStorage.getItem('ai_generations');
      if (saved) {
        const generations = JSON.parse(saved);
        this.generatedImages = generations.filter((gen: any) => 
          gen.productType === this.productType && gen.productName === this.productName
        );
        this.showTimeline = this.generatedImages.length > 1;
      }
    } catch (error) {
      console.error('Error loading generations:', error);
    }
  }

  // ===== ACCIONES DE UI =====
  closeModal(): void {
    this.cleanup();
    this.currentStep = 'upload';
    this.close.emit();
  }

  // ===== GETTERS =====
  get canGenerate(): boolean {
    return !!this.uploadedImage && !this.isProcessing;
  }

  get uploadInstructions(): string {
    if (this.productType === 'hoodie' || this.productType === 't-shirt') {
      return 'Sube una foto tuya de torso completo con buena iluminación';
    } else if (this.productType === 'poster' || this.productType === 'cuadro') {
      return 'Sube una foto de la habitación donde quieres colocar el cuadro';
    }
    return 'Sube una foto clara con buena iluminación';
  }

  get processingTimeFormatted(): string {
    const minutes = Math.floor(this.estimatedTimeRemaining / 60);
    const seconds = this.estimatedTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  trackGeneration(index: number, generation: GeneratedImage): string {
    return generation.id;
  }
} 