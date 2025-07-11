import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
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

  constructor(private router: Router) {}

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

    this.isLoading = true;
    this.loginError = '';

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Integrate with Supabase Auth
      console.log('Login attempt:', this.loginData);
      
      // For now, simulate successful login
      if (this.loginData.email === 'test@example.com' && this.loginData.password === 'password') {
        // Store user session
        if (this.loginData.rememberMe) {
          localStorage.setItem('user_session', JSON.stringify({
            email: this.loginData.email,
            timestamp: new Date().toISOString()
          }));
        } else {
          sessionStorage.setItem('user_session', JSON.stringify({
            email: this.loginData.email,
            timestamp: new Date().toISOString()
          }));
        }
        
        // Navigate to home page
        this.router.navigate(['/']);
      } else {
        this.loginError = 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.';
      }
    } catch (error) {
      console.error('Login error:', error);
      this.loginError = 'Error al iniciar sesión. Por favor intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;
    this.loginError = '';

    try {
      // TODO: Integrate with Supabase Google OAuth
      console.log('Google login attempt');
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, simulate success
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Google login error:', error);
      this.loginError = 'Error al iniciar sesión con Google. Por favor intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithFacebook(): Promise<void> {
    this.isLoading = true;
    this.loginError = '';

    try {
      // TODO: Integrate with Supabase Facebook OAuth
      console.log('Facebook login attempt');
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, simulate success
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Facebook login error:', error);
      this.loginError = 'Error al iniciar sesión con Facebook. Por favor intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }
} 