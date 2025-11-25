import { supabase } from '../lib/supabase';

export interface AuditLogData {
  action: string;
  details?: any;
}

export const auditService = {
  // Create audit log entry
  async logAction(logData: AuditLogData) {
    const { data: currentUser } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', currentUser?.user?.id)
      .single();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: currentUser?.user?.id,
        user_name: profile?.name || 'Unknown',
        action: logData.action,
        details: logData.details,
      });

    if (error) throw error;
  },

  // Get all audit logs (admin only)
  async getAllLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get logs for a specific user
  async getUserLogs(userId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false});

    if (error) throw error;
    return data;
  },

  // Get logs by action type
  async getLogsByAction(action: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', action)
      .order('timestamp', { ascending: false});

    if (error) throw error;
    return data;
  },

  // Update last checked timestamp for user notifications
  async updateLastChecked(userId: string) {
    const { error } = await supabase
      .from('user_notifications')
      .upsert({
        user_id: userId,
        last_checked: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // Get last checked timestamp
  async getLastChecked(userId: string) {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('last_checked')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data?.last_checked || new Date(0).toISOString();
  },

  // Get grade update notifications for a student
  async getGradeNotifications(userId: string) {
    try {
      const lastChecked = await this.getLastChecked(userId);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['ADD_GRADES', 'UPDATE_GRADES'])
        .contains('details', { studentId: userId })
        .gt('timestamp', lastChecked)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting grade notifications:', error);
      return [];
    }
  },
};
