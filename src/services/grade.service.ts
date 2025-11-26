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
      }, {
        onConflict: 'student_id,subject',
        ignoreDuplicates: false
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

  // Get final rankings based on final_average
  async getFinalRankings(grade?: string, section?: string) {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        name,
        grade,
        section,
        grades (
          final_average
        )
      `)
      .eq('role', 'student');

    if (grade) {
      query = query.eq('grade', grade);
    }
    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate average of final_average for each student
    const studentsWithFinalAverage = data
      .map((student: any) => {
        const finalAverages = student.grades
          .map((g: any) => g.final_average)
          .filter((avg: number) => avg !== null && avg !== undefined);

        const avgFinal = finalAverages.length > 0
          ? finalAverages.reduce((sum: number, avg: number) => sum + avg, 0) / finalAverages.length
          : null;

        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          section: student.section,
          final_average: avgFinal
        };
      })
      .filter((s: any) => s.final_average !== null)
      .sort((a: any, b: any) => b.final_average - a.final_average)
      .map((student: any, index: number) => ({
        ...student,
        final_rank: index + 1
      }));

    return studentsWithFinalAverage;
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
