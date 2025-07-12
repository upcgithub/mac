import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { AuthService, LoginCredentials } from '../../core/services/auth.service';

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginData: LoginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  showPassword = false;
  isLoading = false;
  loginError = '';
  emailError = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to auth service observables
    this.authService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    this.authService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.loginError = error?.message || '';
      });

    // Check if user is already authenticated
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';

    // Email validation
    if (!this.loginData.email) {
      this.emailError = 'El correo electrónico es requerido';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.emailError = 'Por favor ingresa un correo electrónico válido';
      return false;
    }

    // Password validation
    if (!this.loginData.password) {
      this.passwordError = 'La contraseña es requerida';
      return false;
    }

    if (this.loginData.password.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    return true;
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    const credentials: LoginCredentials = {
      email: this.loginData.email,
      password: this.loginData.password,
      rememberMe: this.loginData.rememberMe
    };

    try {
      const result = await this.authService.login(credentials);
      
      if (result.success) {
        // Navigation will be handled by the auth state subscription
        console.log('Login successful');
      } else {
        // Error will be handled by the error subscription
        console.log('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.loginError = 'Error inesperado. Por favor intenta nuevamente.';
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const result = await this.authService.loginWithGoogle();
      
      if (result.success) {
        console.log('Google login successful');
        // The OAuth flow will redirect to the callback URL
      } else {
        console.log('Google login failed:', result.error);
      }
    } catch (error) {
      console.error('Google login error:', error);
      this.loginError = 'Error al iniciar sesión con Google. Por favor intenta nuevamente.';
    }
  }

  async loginWithFacebook(): Promise<void> {
    try {
      const result = await this.authService.loginWithFacebook();
      
      if (result.success) {
        console.log('Facebook login successful');
        // The OAuth flow will redirect to the callback URL
      } else {
        console.log('Facebook login failed:', result.error);
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      this.loginError = 'Error al iniciar sesión con Facebook. Por favor intenta nuevamente.';
    }
  }
} 