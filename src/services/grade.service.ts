import { supabase } from '../lib/supabase';

export interface GradeData {
  student_id: string;
  subject: string;
  period1?: number;
  period2?: number;
  period3?: number;
  exam1?: number;
  period4?: number;
  period5?: number;
  period6?: number;
  exam2?: number;
  comments?: string;
}

export const gradeService = {
  // Get grades for a student
  async getStudentGrades(studentId: string) {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;
    return data;
  },

  // Get grades for multiple students
  async getGradesForStudents(studentIds: string[]) {
    const { data, error } = await supabase
      .from('grades')
      .select('*, students(*, profiles(*))')
      .in('student_id', studentIds);

    if (error) throw error;
    return data;
  },

  // Create or update grade
  async upsertGrade(gradeData: GradeData) {
    const { data: currentUser } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('grades')
      .upsert({
        ...gradeData,
        updated_by: currentUser?.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete grade
  async deleteGrade(gradeId: string) {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', gradeId);

    if (error) throw error;
  },

  // Get class rankings
  async getClassRankings(grade?: string, section?: string) {
    let query = supabase.from('class_rankings_view').select('*');

    if (grade) {
      query = query.eq('grade', grade);
    }
    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query.order('class_rank');

    if (error) throw error;
    return data;
  },

  // Get student's ranking
  async getStudentRanking(studentId: string) {
    const { data, error } = await supabase
      .from('class_rankings_view')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to grade changes for a student
  subscribeToStudentGrades(studentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`grades:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `student_id=eq.${studentId}`,
        },
        callback
      )
      .subscribe();
  },
};
