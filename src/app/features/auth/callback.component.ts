import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">
        <div class="loading-spinner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
        </div>
        <h2>Procesando autenticación...</h2>
        <p>Por favor espera mientras completamos tu inicio de sesión.</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #ffffff;
    }

    .callback-content {
      text-align: center;
      padding: 40px;
      max-width: 400px;
    }

    .loading-spinner {
      margin-bottom: 24px;
    }

    .loading-spinner svg {
      animation: spin 1s linear infinite;
      color: var(--uffizi-black);
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    h2 {
      color: var(--uffizi-black);
      margin-bottom: 12px;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      color: var(--uffizi-gray-dark);
      font-size: 16px;
      line-height: 1.5;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Get the session from the URL hash
      const { data, error } = await this.supabaseService.db.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        this.router.navigate(['/login'], { 
          queryParams: { error: 'auth_error' } 
        });
        return;
      }

      if (data.session) {
        // Check if there's a redirect URL stored
        const redirectUrl = localStorage.getItem('redirectUrl');
        localStorage.removeItem('redirectUrl');
        
        // Navigate to the intended page or home
        this.router.navigate([redirectUrl || '/']);
      } else {
        // No session found, redirect to login
        this.router.navigate(['/login'], { 
          queryParams: { error: 'no_session' } 
        });
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/login'], { 
        queryParams: { error: 'unexpected_error' } 
      });
    }
  }
} 