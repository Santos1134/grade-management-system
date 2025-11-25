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
};
