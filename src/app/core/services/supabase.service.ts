import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event, session);
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user ?? null);
    });

    // Initialize with current session
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.sessionSubject.next(session);
    this.currentUserSubject.next(session?.user ?? null);
  }

  // Observables for reactive programming
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get session$(): Observable<Session | null> {
    return this.sessionSubject.asObservable();
  }

  get isAuthenticated$(): Observable<boolean> {
    return new Observable(observer => {
      this.currentUserSubject.subscribe(user => {
        observer.next(!!user);
      });
    });
  }

  // Current user getter
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get session(): Session | null {
    return this.sessionSubject.value;
  }

  // Authentication methods
  async signUp(email: string, password: string, metadata?: any) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error };
    }
  }

  async signInWithFacebook() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Facebook sign in error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  async resetPassword(email: string) {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  }

  async updatePassword(password: string) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  }

  // Profile methods
  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get profile error:', error);
      return { data: null, error };
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  }

  // Database access
  get db() {
    return this.supabase;
  }

  // Storage access
  get storage() {
    return this.supabase.storage;
  }

  // Utility methods
  async uploadAvatar(file: File, userId: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: { path: filePath, publicUrl }, error: null };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { data: null, error };
    }
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Helper method to get user ID
  getUserId(): string | null {
    return this.currentUser?.id ?? null;
  }

  // Helper method to get user email
  getUserEmail(): string | null {
    return this.currentUser?.email ?? null;
  }
} 