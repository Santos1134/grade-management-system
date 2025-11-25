import { supabase } from '../lib/supabase';

export const notificationService = {
  // Get notifications for current user (student)
  async getNotifications(studentId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get unread notifications count
  async getUnreadCount(studentId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark all notifications as read
  async markAllAsRead(studentId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('student_id', studentId)
      .eq('read', false);

    if (error) throw error;
  },

  // Subscribe to new notifications
  subscribeToNotifications(studentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `student_id=eq.${studentId}`,
        },
        callback
      )
      .subscribe();
  },
};
