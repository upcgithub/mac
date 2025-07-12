import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<AuthError | null>(null);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // Observables
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get error$(): Observable<AuthError | null> {
    return this.errorSubject.asObservable();
  }

  get currentUser$(): Observable<User | null> {
    return this.supabaseService.currentUser$;
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.supabaseService.isAuthenticated$;
  }

  get session$(): Observable<Session | null> {
    return this.supabaseService.session$;
  }

  // Current user
  get currentUser(): User | null {
    return this.supabaseService.currentUser;
  }

  get isAuthenticated(): boolean {
    return this.supabaseService.isAuthenticated();
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      if (data?.user) {
        // Store remember me preference
        if (credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        return { success: true };
      }

      return { success: false, error: { message: 'Login failed' } };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signUp(
        credentials.email,
        credentials.password,
        {
          full_name: credentials.fullName
        }
      );

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      if (data?.user) {
        return { success: true };
      }

      return { success: false, error: { message: 'Registration failed' } };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signInWithGoogle();

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async loginWithFacebook(): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.signInWithFacebook();

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async logout(): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { error } = await this.supabaseService.signOut();

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      // Clear local storage
      localStorage.removeItem('rememberMe');
      
      // Navigate to home page
      this.router.navigate(['/']);
      
      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.resetPassword(email);

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  async updatePassword(password: string): Promise<{ success: boolean; error?: AuthError }> {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await this.supabaseService.updatePassword(password);

      if (error) {
        const authError = this.handleAuthError(error);
        this.setError(authError);
        return { success: false, error: authError };
      }

      return { success: true };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.setError(authError);
      return { success: false, error: authError };
    } finally {
      this.setLoading(false);
    }
  }

  // Profile methods
  async getProfile() {
    const userId = this.supabaseService.getUserId();
    if (!userId) return { data: null, error: { message: 'User not authenticated' } };

    return await this.supabaseService.getProfile(userId);
  }

  async updateProfile(updates: any) {
    const userId = this.supabaseService.getUserId();
    if (!userId) return { data: null, error: { message: 'User not authenticated' } };

    return await this.supabaseService.updateProfile(userId, updates);
  }

  // Utility methods
  getUserId(): string | null {
    return this.supabaseService.getUserId();
  }

  getUserEmail(): string | null {
    return this.supabaseService.getUserEmail();
  }

  // Private methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: AuthError | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private handleAuthError(error: any): AuthError {
    console.error('Auth error:', error);

    // Handle specific Supabase errors
    if (error?.message) {
      switch (error.message) {
        case 'Invalid login credentials':
          return { message: 'Credenciales incorrectas. Verifica tu email y contraseña.', code: 'invalid_credentials' };
        case 'Email not confirmed':
          return { message: 'Por favor confirma tu email antes de iniciar sesión.', code: 'email_not_confirmed' };
        case 'User already registered':
          return { message: 'Este email ya está registrado.', code: 'user_exists' };
        case 'Password should be at least 6 characters':
          return { message: 'La contraseña debe tener al menos 6 caracteres.', code: 'weak_password' };
        case 'Invalid email':
          return { message: 'El formato del email no es válido.', code: 'invalid_email' };
        case 'Too many requests':
          return { message: 'Demasiados intentos. Intenta de nuevo más tarde.', code: 'rate_limit' };
        default:
          return { message: error.message, code: error.code };
      }
    }

    return { message: 'Error de autenticación. Intenta de nuevo.', code: 'unknown_error' };
  }
} 