import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { AuthService, RegisterCredentials } from '../../core/services/auth.service';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  acceptTerms: boolean;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registerData: RegisterData = {
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    acceptTerms: false
  };

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  registerError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  fullNameError = '';
  termsError = '';
  successMessage = '';

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
        this.registerError = error?.message || '';
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

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.fullNameError = '';
    this.termsError = '';
    this.registerError = '';

    // Full name validation
    if (!this.registerData.fullName.trim()) {
      this.fullNameError = 'El nombre completo es requerido';
      return false;
    }

    // Email validation
    if (!this.registerData.email) {
      this.emailError = 'El correo electrónico es requerido';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.emailError = 'Por favor ingresa un correo electrónico válido';
      return false;
    }

    // Password validation
    if (!this.registerData.password) {
      this.passwordError = 'La contraseña es requerida';
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    // Confirm password validation
    if (!this.registerData.confirmPassword) {
      this.confirmPasswordError = 'Confirma tu contraseña';
      return false;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
      return false;
    }

    // Terms validation
    if (!this.registerData.acceptTerms) {
      this.termsError = 'Debes aceptar los términos y condiciones';
      return false;
    }

    return true;
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    const credentials: RegisterCredentials = {
      email: this.registerData.email,
      password: this.registerData.password,
      fullName: this.registerData.fullName
    };

    try {
      const result = await this.authService.register(credentials);
      
      if (result.success) {
        this.successMessage = 'Cuenta creada exitosamente. Por favor verifica tu correo electrónico.';
        // Redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        // Error will be handled by the error subscription
        console.log('Registration failed:', result.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.registerError = 'Error inesperado. Por favor intenta nuevamente.';
    }
  }

  async registerWithGoogle(): Promise<void> {
    try {
      const result = await this.authService.loginWithGoogle();
      
      if (result.success) {
        console.log('Google registration successful');
        // The OAuth flow will redirect to the callback URL
      } else {
        console.log('Google registration failed:', result.error);
      }
    } catch (error) {
      console.error('Google registration error:', error);
      this.registerError = 'Error al registrarse con Google. Por favor intenta nuevamente.';
    }
  }

  async registerWithFacebook(): Promise<void> {
    try {
      const result = await this.authService.loginWithFacebook();
      
      if (result.success) {
        console.log('Facebook registration successful');
        // The OAuth flow will redirect to the callback URL
      } else {
        console.log('Facebook registration failed:', result.error);
      }
    } catch (error) {
      console.error('Facebook registration error:', error);
      this.registerError = 'Error al registrarse con Facebook. Por favor intenta nuevamente.';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 