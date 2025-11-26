import { supabase } from '../lib/supabase';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'sponsor' | 'admin';
  studentId?: string;
  grade?: string;
  section?: string;
}

export const adminService = {
  // Create a new user (student, sponsor, or admin)
  async createUser(userData: CreateUserData) {
    // Save current admin session before creating new user
    const { data: currentSession } = await supabase.auth.getSession();

    // Step 1: Create auth user using signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: undefined,
        data: {
          name: userData.name,
          role: userData.role,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const userId = authData.user.id;

    try {
      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        });

      if (profileError) throw profileError;

      // Step 3: Create role-specific record
      if (userData.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            id: userId,
            student_id: userData.studentId!,
            grade: userData.grade!,
            section: userData.section || null,
          });

        if (studentError) throw studentError;
      } else if (userData.role === 'sponsor') {
        const { error: sponsorError } = await supabase
          .from('sponsors')
          .insert({
            id: userId,
            grade: userData.grade!,
            section: userData.section || null,
          });

        if (sponsorError) throw sponsorError;
      } else if (userData.role === 'admin') {
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            id: userId,
          });

        if (adminError) throw adminError;
      }

      // Step 4: Restore admin session after creating new user
      // signUp() automatically logs in the new user, so we need to restore the admin's session
      // We do this synchronously to prevent the auth state change from triggering
      if (currentSession?.session) {
        // Immediately restore the admin session without signing out first
        // This prevents the brief logout that triggers the redirect to login page
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: currentSession.session.access_token,
          refresh_token: currentSession.session.refresh_token,
        });

        if (sessionError) {
          console.error('Error restoring admin session:', sessionError);
          // Force a refresh of the session
          await supabase.auth.refreshSession();
        }
      }

      return { success: true, userId };
    } catch (error) {
      // Note: Can't easily rollback auth user creation without service role
      console.error('Error creating user profile/role:', error);
      throw error;
    }
  },

  // Get next available student ID
  async generateStudentId() {
    const { data, error } = await supabase
      .from('students')
      .select('student_id')
      .order('student_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'STU0001';
    }

    const lastId = data[0].student_id;
    const numPart = parseInt(lastId.replace('STU', ''));
    const nextId = numPart + 1;
    return `STU${nextId.toString().padStart(4, '0')}`;
  },

  // Delete user
  async deleteUser(userId: string) {
    // Delete from profiles (will cascade to other tables AND auth.users via trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Note: The database trigger 'on_profile_delete' automatically deletes the user from auth.users
    // This allows you to recreate a user with the same email after deletion
    // See AUTO_DELETE_AUTH_USERS.sql for the trigger implementation
  },

  // Get all users with their details
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        students (*),
        sponsors (*),
        admins (*)
      `);

    if (error) throw error;
    return data;
  },

  // Change user password (current user only)
  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // Reset user password
  // Note: This requires Supabase service role key which cannot be safely used in client-side code
  // For security reasons, password resets must be done through Supabase Dashboard
  async resetUserPassword(_userId: string): Promise<{ email: string; password: string; name: string; role: string }> {
    throw new Error(
      'Password reset requires service role access and cannot be done client-side for security reasons.\n\n' +
      'To reset a password:\n' +
      '1. Go to Supabase Dashboard (https://supabase.com)\n' +
      '2. Select your project\n' +
      '3. Click "Authentication" → "Users"\n' +
      '4. Find the user and click on them\n' +
      '5. Click "Reset Password" or "Send Password Reset Email"\n\n' +
      'Alternative: Delete the user and recreate them with a new password (note: this will delete their grades if they are a student).'
    );
  },

  // Generate temporary password for new users or password reset
  generateTemporaryPassword(): string {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `Temp${randomNum}!`;
  },

  // Get current maintenance mode status
  async getMaintenanceMode() {
    const { data, error } = await supabase
      .from('maintenance_mode')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If table doesn't exist or no record, return default
      return { is_enabled: false, message: 'Grades input is in progress. Please try again later.' };
    }
    return data;
  },

  // Toggle maintenance mode on/off
  async toggleMaintenanceMode(isEnabled: boolean, message?: string) {
    const { data: currentUser } = await supabase.auth.getUser();

    // Try to get existing record
    const { data: existingRecord } = await supabase
      .from('maintenance_mode')
      .select('id')
      .limit(1)
      .single();

    const updateData: any = {
      is_enabled: isEnabled,
      enabled_by: isEnabled ? currentUser?.user?.id : null,
      enabled_at: isEnabled ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (message) {
      updateData.message = message;
    }

    let result;
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from('maintenance_mode')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new record if none exists
      const { data, error } = await supabase
        .from('maintenance_mode')
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  },

  // Subscribe to maintenance mode changes
  subscribeToMaintenanceMode(callback: (payload: any) => void) {
    return supabase
      .channel('maintenance_mode_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maintenance_mode',
        },
        callback
      )
      .subscribe();
  },
};
