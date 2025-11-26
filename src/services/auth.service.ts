import { supabase } from '../lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  name: string;
  role: 'student' | 'sponsor' | 'admin';
  studentId?: string;
  grade?: string;
  section?: string;
}

export const authService = {
  // Sign in with email and password
  async signIn(credentials: LoginCredentials) {
    console.log('===== ATTEMPTING LOGIN =====');
    console.log('Email:', credentials.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Auth error:', error);
      throw error;
    }

    console.log('Auth successful, user ID:', data.user.id);
    console.log('User confirmed?', data.user.email_confirmed_at);

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, students(*), sponsors(*), admins(*)')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    console.log('Profile loaded:', profile);
    console.log('============================');

    return { user: data.user, profile };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Get current user with profile
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return null;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, students(*), sponsors(*), admins(*)')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return { user, profile };
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Admin: Create new user (requires admin privileges)
  async createUser(_userData: SignUpData) {
    // This would be called from an admin function
    // For now, we'll use the service role key in a server function
    // or Edge Function to create users with specific roles
    throw new Error('User creation must be done through admin API');
  },
};
