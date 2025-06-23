import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import OpenAI from 'openai';

export interface AiTryonResult {
  id: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  prompt: string;
  timestamp: Date;
  processing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OpenaiImageService {
  private openai: OpenAI;
  private readonly STORAGE_KEY = 'ai_tryon_results';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly TIMEOUT_MS = 120000; // 2 minutes

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.openai.apiKey,
      dangerouslyAllowBrowser: true // Needed for client-side usage
    });
  }

  /**
   * Generate AI try-on image using OpenAI GPT-4.1 with image generation
   */
  generateTryOnImage(userImage: File, productImage: File, productType: string): Observable<AiTryonResult> {
    console.log('🎯 Starting AI try-on generation with OpenAI...');
    console.log('User image:', userImage.name, userImage.size, 'bytes');
    console.log('Product image:', productImage.name, productImage.size, 'bytes');
    console.log('Product type:', productType);

    // Validate inputs
    if (!userImage || !productImage) {
      console.error('❌ Missing required images');
      return throwError(() => new Error('Se requieren ambas imágenes para el try-on'));
    }

    if (userImage.size > this.MAX_FILE_SIZE || productImage.size > this.MAX_FILE_SIZE) {
      console.error('❌ File size too large');
      return throwError(() => new Error('Las imágenes son demasiado grandes (máximo 10MB)'));
    }

    const tempResult: AiTryonResult = {
      id: this.generateId(),
      originalImageUrl: URL.createObjectURL(userImage),
      generatedImageUrl: '',
      prompt: this.generatePrompt(productType),
      timestamp: new Date(),
      processing: true
    };

    return from(this.processTryOnWithOpenAI(userImage, productImage, productType)).pipe(
      timeout(this.TIMEOUT_MS),
      map((imageBase64: string) => {
        console.log('✅ OpenAI API response received');
        const result: AiTryonResult = {
          ...tempResult,
          generatedImageUrl: `data:image/png;base64,${imageBase64}`,
          processing: false
        };
        this.saveResult(result);
        return result;
      }),
      catchError(error => {
        console.error('❌ OpenAI API error:', error);
        tempResult.processing = false;
        return throwError(() => new Error('Error generando la imagen. Inténtalo de nuevo.'));
      })
    );
  }

  /**
   * Process virtual try-on using OpenAI API with file uploads
   */
  private async processTryOnWithOpenAI(userImage: File, productImage: File, productType: string): Promise<string> {
    console.log('📤 Uploading images to OpenAI...');
    console.log('📏 User image size:', (userImage.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📏 Product image size:', (productImage.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('🎨 Product type:', productType);

    // Upload files to OpenAI (correct approach for Responses API)
    const [userFileId, productFileId] = await Promise.all([
      this.uploadFileToOpenAI(userImage, 'user-photo'),
      this.uploadFileToOpenAI(productImage, 'product-image')
    ]);

    console.log('✅ Files uploaded successfully');
    console.log('🆔 User file ID:', userFileId);
    console.log('🆔 Product file ID:', productFileId);

    const prompt = this.generatePrompt(productType);
    console.log('📝 Generated prompt:', prompt.substring(0, 200) + '...');
    
    console.log('🚀 Calling OpenAI API...');
    console.log('🔧 Model being used:', 'gpt-4.1');
    console.log('🛠️ API configuration check:');
    console.log('  - API Key configured:', !!environment.openai.apiKey);
    console.log('  - API Key starts with sk-:', environment.openai.apiKey?.startsWith('sk-'));
    console.log('  - Service configured:', this.isConfigured());

    console.log('📦 Request payload structure:');
    console.log('  - Model: gpt-4.1');
    console.log('  - Input messages count: 1');
    console.log('  - Content items count: 3 (1 text + 2 file uploads)');
    console.log('  - Tools: image_generation');
    console.log('  - Product file ID:', productFileId);
    console.log('  - User file ID:', userFileId);
    
    try {
      console.log('⏳ Sending request to OpenAI...');
      const response = await this.retryWithBackoff(() => 
        this.openai.responses.create({
          model: "gpt-4.1",
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: prompt },
                {
                  type: "input_image",
                  file_id: productFileId,
                  detail: "low" // Use low detail for smaller token usage
                },
                {
                  type: "input_image",
                  file_id: userFileId,
                  detail: "high" // Keep high detail for user photo
                }
              ],
            },
          ],
          tools: [{ type: "image_generation" }],
        })
      );

      console.log('📥 Raw OpenAI response received');
      console.log('🔍 Response structure:');
      console.log('  - Response ID:', response.id);
      console.log('  - Status:', response.status);
      console.log('  - Model used:', response.model);
      console.log('  - Output items count:', response.output?.length);
      console.log('  - Usage:', response.usage);
      
      console.log('📋 Full response object:', JSON.stringify(response, null, 2));

      console.log('🔍 Analyzing output items:');
      response.output?.forEach((output: any, index: number) => {
        console.log(`  Output ${index}:`, {
          type: output.type,
          id: output.id,
          hasResult: !!output.result,
          resultLength: output.result?.length || 0,
          keys: Object.keys(output)
        });
      });

      const imageData = response.output
        ?.filter((output: any) => {
          console.log(`🔍 Filtering output type: ${output.type} === "image_generation_call"?`, output.type === "image_generation_call");
          return output.type === "image_generation_call";
        })
        ?.map((output: any) => {
          console.log('📸 Extracting image result, length:', output.result?.length);
          return output.result;
        });

      console.log('🖼️ Filtered image data:');
      console.log('  - Image data count:', imageData?.length || 0);
      console.log('  - Has image data:', !!(imageData && imageData.length > 0));

      if (imageData && imageData.length > 0) {
        const firstImage = imageData[0];
        console.log('✅ Image generated successfully');
        console.log('📏 Generated image base64 length:', firstImage?.length);
        console.log('🎯 First 100 characters of base64:', firstImage?.substring(0, 100));
        
        // Clean up uploaded files
        await this.cleanupFiles([userFileId, productFileId]);
        
        return firstImage;
      } else {
        console.error('❌ No image data in response');
        console.error('🔍 Available output types:', response.output?.map((o: any) => o.type));
        console.error('🔍 Full output structure:', response.output);
        
        // Clean up uploaded files even on error
        await this.cleanupFiles([userFileId, productFileId]);
        
        throw new Error('No se pudo generar la imagen');
      }
    } catch (error: any) {
      console.error('❌ OpenAI API error details:');
      console.error('  - Error type:', typeof error);
      console.error('  - Error message:', error?.message);
      console.error('  - Error status:', error?.status);
      console.error('  - Error code:', error?.code);
      console.error('  - Error body:', error?.body);
      console.error('  - Full error object:', error);
      
      if (error?.status) {
        switch (error.status) {
          case 401:
            console.error('🔑 Authentication error - check API key');
            break;
          case 403:
            console.error('🚫 Forbidden - check permissions and quotas');
            break;
          case 429:
            console.error('⏰ Rate limit exceeded');
            break;
          case 500:
            console.error('🔥 OpenAI server error');
            break;
          default:
            console.error('❓ Unknown error status');
        }
      }
      
      // Clean up uploaded files on error
      try {
        await this.cleanupFiles([userFileId, productFileId]);
      } catch (cleanupError) {
        console.warn('⚠️ Error during cleanup:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Generate appropriate prompt based on product type
   */
  private generatePrompt(productType: string): string {
    const basePrompt = `Generate a photorealistic image showing virtual try-on result. `;
    
    switch (productType.toLowerCase()) {
      case 'hoodie':
      case 'sudadera':
        return basePrompt + `utiliza la prenda de la primera imagen y usala como la prenda de la persona de la segunda imagen.`;
      
      case 't-shirt':
      case 'camiseta':
        return basePrompt + `utiliza la prenda de la primera imagen y usala como la prenda de la persona de la segunda imagen.`;
      
      case 'poster':
      case 'cuadro':
      case 'artwork':
        return basePrompt + `Take the artwork/poster from IMAGEN 1 and place it naturally on a wall in the room shown in IMAGEN 2. The artwork should be properly sized, have realistic perspective, and cast appropriate shadows. Maintain the room's lighting and atmosphere.`;
      
      default:
        return basePrompt + `Take the item from IMAGEN 1 and apply it to IMAGEN 2 in a realistic way. For clothing items, replace the current clothing with the new item. For artworks, place them naturally in the room. Maintain realistic proportions, lighting, and shadows.`;
    }
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get all saved results from localStorage
   */
  getSavedResults(): AiTryonResult[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved results:', error);
      return [];
    }
  }

  /**
   * Save result to localStorage
   */
  private saveResult(result: AiTryonResult): void {
    try {
      const existing = this.getSavedResults();
      existing.unshift(result); // Add to beginning
      
      // Keep only last 10 results
      const trimmed = existing.slice(0, 10);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
      console.log('✅ Result saved to localStorage');
    } catch (error) {
      console.error('Error saving result:', error);
    }
  }

  /**
   * Delete a specific result
   */
  deleteResult(id: string): void {
    try {
      const existing = this.getSavedResults();
      const filtered = existing.filter(r => r.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Result deleted');
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  }

  /**
   * Clear all saved results
   */
  clearAllResults(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ All results cleared');
    } catch (error) {
      console.error('Error clearing results:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Archivo requerido' };
    }

    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Debe ser una imagen' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'Imagen demasiado grande (máximo 10MB)' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Formato no soportado (usar JPG, PNG o WebP)' };
    }

    return { valid: true };
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!environment.openai.apiKey && environment.openai.apiKey.startsWith('sk-');
  }

  /**
   * Get service status
   */
  getServiceStatus(): Observable<any> {
    return from(this.checkOpenAIConnection()).pipe(
      map(response => ({ status: 'available', service: 'OpenAI GPT-4.1' })),
      catchError(error => {
        console.warn('OpenAI service status check failed:', error);
        return throwError(() => ({ status: 'unavailable', error }));
      })
    );
  }

  /**
   * Check OpenAI connection
   */
  private async checkOpenAIConnection(): Promise<any> {
    try {
      // Simple test call to verify API key works
      const response = await this.openai.models.list();
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retry function with exponential backoff for rate limit handling
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries + 1}`);
        return await fn();
      } catch (error: any) {
        console.log(`❌ Attempt ${attempt + 1} failed:`, error?.status, error?.message);
        
        // If it's a rate limit error (429) and we have retries left
        if (error?.status === 429 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`⏰ Rate limit hit. Waiting ${delay}ms before retry...`);
          
          // Extract retry-after header if available
          const retryAfter = error?.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          
          console.log(`⏳ Waiting ${waitTime}ms (${waitTime/1000}s) before next attempt...`);
          await this.delay(waitTime);
          continue;
        }
        
        // If it's not a rate limit error, or we've exhausted retries, throw the error
        console.error(`💥 Final error after ${attempt + 1} attempts:`, error);
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Max retries exceeded');
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload file to OpenAI and get file ID
   */
  private async uploadFileToOpenAI(file: File, purpose: string): Promise<string> {
    try {
      console.log(`📤 Uploading ${purpose} file:`, file.name, `(${(file.size / 1024).toFixed(1)}KB)`);
      
      const uploadResponse = await this.openai.files.create({
        file: file,
        purpose: 'vision'
      });

      console.log(`✅ ${purpose} uploaded successfully:`, uploadResponse.id);
      return uploadResponse.id;
    } catch (error: any) {
      console.error(`❌ Error uploading ${purpose}:`, error);
      throw new Error(`Failed to upload ${purpose}: ${error.message}`);
    }
  }

  /**
   * Clean up uploaded files after processing
   */
  private async cleanupFiles(fileIds: string[]): Promise<void> {
    console.log('🧹 Cleaning up uploaded files...');
    
    for (const fileId of fileIds) {
      try {
        await this.openai.files.delete(fileId);
        console.log(`🗑️ Deleted file: ${fileId}`);
      } catch (error) {
        console.warn(`⚠️ Could not delete file ${fileId}:`, error);
      }
    }
  }
}