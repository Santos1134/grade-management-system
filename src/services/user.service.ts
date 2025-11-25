import { supabase } from '../lib/supabase';

export interface CreateStudentData {
  email: string;
  password: string;
  name: string;
  studentId: string;
  grade: string;
  section?: string;
}

export interface CreateSponsorData {
  email: string;
  password: string;
  name: string;
  grade: string;
  section?: string;
}

export const userService = {
  // Get all students (admin/sponsor access)
  async getStudents(grade?: string, section?: string) {
    let query = supabase
      .from('students')
      .select('*, profiles(*)');

    if (grade) {
      query = query.eq('grade', grade);
    }
    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get all sponsors (admin access)
  async getSponsors(grade?: string, section?: string) {
    let query = supabase
      .from('sponsors')
      .select('*, profiles(*)');

    if (grade) {
      query = query.eq('grade', grade);
    }
    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get student by ID
  async getStudentById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get sponsor by ID
  async getSponsorById(id: string) {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: { name?: string; email?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete user (admin only)
  async deleteUser(userId: string) {
    // First delete from profiles (will cascade to students/sponsors/admins)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Get all users (admin only)
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, students(*), sponsors(*), admins(*)');

    if (error) throw error;
    return data;
  },
};
