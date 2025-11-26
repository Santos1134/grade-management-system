import { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import { userService } from '../services/user.service';
import { gradeService } from '../services/grade.service';
import { auditService } from '../services/audit.service';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'sponsor';
}

interface Sponsor extends User {
  role: 'sponsor';
  grade: string;
  section?: string;
}

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  period1?: number;
  period2?: number;
  period3?: number;
  exam1?: number;
  sem1Av?: number;
  period4?: number;
  period5?: number;
  period6?: number;
  exam2?: number;
  sem2Av?: number;
  finalAverage?: number;
  comments?: string;
}

interface SubjectGrade {
  subject: string;
  period1: string;
  period2: string;
  period3: string;
  exam1: string;
  period4: string;
  period5: string;
  period6: string;
  exam2: string;
  comments: string;
}

interface SponsorDashboardProps {
  user: Sponsor;
  onLogout: () => void;
}

// const PERIODS = [
//   { key: 'period1', label: '1st Period' },
//   { key: 'period2', label: '2nd Period' },
//   { key: 'period3', label: '3rd Period' },
//   { key: 'exam1', label: 'Exam' },
//   { key: 'sem1Av', label: 'Sem Avg' },
//   { key: 'period4', label: '4th Period' },
//   { key: 'period5', label: '5th Period' },
//   { key: 'period6', label: '6th Period' },
//   { key: 'exam2', label: 'Exam' },
//   { key: 'sem2Av', label: 'Sem Avg' },
//   { key: 'finalAverage', label: 'Final Av' },
// ];

export default function SponsorDashboard({ user, onLogout }: SponsorDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [, setIsLoading] = useState(true);
  const [subjectGrades, setSubjectGrades] = useState<Record<string, SubjectGrade>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [, setActiveSubjectIndex] = useState(0);
  const [showPeriodRankings, setShowPeriodRankings] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'period1' | 'period2' | 'period3' | 'exam1' | 'period4' | 'period5' | 'period6' | 'exam2' | 'sem1Avg' | 'sem2Avg'>('period1');

  const getSubjectsForGrade = () => {
    const isJunior = user.grade.includes('7th') || user.grade.includes('8th') || user.grade.includes('9th');
    const is12thGrade = user.grade.includes('12th');

    if (isJunior) {
      return ['Doctrine', 'English', 'Literature', 'Geography', 'Civics', 'Mathematics', 'Science', 'LAB', 'P.E/R.O.T.C'];
    } else if (is12thGrade) {
      return ['Doctrine', 'English', 'Literature', 'Geography', 'History', 'Economics', 'Geometry', 'Algebra', 'Trigonometry', 'Chemistry', 'Physics', 'Biology', 'LAB'];
    } else {
      return ['Doctrine', 'English', 'Literature', 'Geography', 'History', 'Economics', 'Geometry', 'Algebra', 'Trigonometry', 'Chemistry', 'Physics', 'Biology', 'LAB', 'P.E/R.O.T.C'];
    }
  };

  useEffect(() => {
    loadStudents();
    loadGrades();
  }, [user.grade]);

  useEffect(() => {
    // Initialize subject grades when student is selected
    if (selectedStudent && showAddGrade) {
      const subjects = getSubjectsForGrade();
      const initialGrades: Record<string, SubjectGrade> = {};

      // Load existing grades for this student
      const existingGrades = grades.filter(g => g.studentId === selectedStudent.id);

      subjects.forEach(subject => {
        const existingGrade = existingGrades.find(g => g.subject === subject);

        if (existingGrade) {
          // Populate with existing data
          initialGrades[subject] = {
            subject,
            period1: existingGrade.period1?.toString() || '',
            period2: existingGrade.period2?.toString() || '',
            period3: existingGrade.period3?.toString() || '',
            exam1: existingGrade.exam1?.toString() || '',
            period4: existingGrade.period4?.toString() || '',
            period5: existingGrade.period5?.toString() || '',
            period6: existingGrade.period6?.toString() || '',
            exam2: existingGrade.exam2?.toString() || '',
            comments: existingGrade.comments || '',
          };
        } else {
          // Empty form for new subject
          initialGrades[subject] = {
            subject,
            period1: '',
            period2: '',
            period3: '',
            exam1: '',
            period4: '',
            period5: '',
            period6: '',
            exam2: '',
            comments: '',
          };
        }
      });
      setSubjectGrades(initialGrades);
      setEditMode(existingGrades.length > 0);
    }
  }, [selectedStudent, showAddGrade, grades]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const loadStudents = async () => {
    try {
      const data = await userService.getStudents(user.grade, user.section);
      const students = data.map((s: any) => ({
        id: s.id,
        name: s.profiles.name,
        email: s.profiles.email,
        studentId: s.student_id,
        grade: s.grade,
        section: s.section,
        role: 'student'
      }));
      setStudents(students);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading students:', error);
      setIsLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const studentIds = students.map(s => s.id);
      if (studentIds.length > 0) {
        const data = await gradeService.getGradesForStudents(studentIds);
        const formattedGrades = data.map((g: any) => ({
          id: g.id,
          studentId: g.student_id,
          studentName: g.students?.profiles?.name || '',
          subject: g.subject,
          period1: g.period1,
          period2: g.period2,
          period3: g.period3,
          exam1: g.exam1,
          sem1Av: g.sem1_av,
          period4: g.period4,
          period5: g.period5,
          period6: g.period6,
          exam2: g.exam2,
          sem2Av: g.sem2_av,
          finalAverage: g.final_average,
          comments: g.comments
        }));
        setGrades(formattedGrades);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const calculateSemesterAverage = (p1: string, p2: string, p3: string, exam: string) => {
    // Only calculate if ALL 4 values are present
    if (!p1 || !p2 || !p3 || !exam) return '';
    const values = [p1, p2, p3, exam];
    if (values.some(v => isNaN(parseFloat(v)))) return '';
    const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
    return (sum / values.length).toFixed(2);
  };

  const calculateFinalAverage = (sem1: string, sem2: string) => {
    // Only calculate if BOTH semester averages are present
    if (!sem1 || !sem2) return '';
    if (isNaN(parseFloat(sem1)) || isNaN(parseFloat(sem2))) return '';
    const sum = parseFloat(sem1) + parseFloat(sem2);
    return (sum / 2).toFixed(2);
  };

  const getGradeColorClass = (grade: string | number | undefined) => {
    if (!grade) return '';
    const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
    if (isNaN(numGrade)) return '';
    if (numGrade >= 70) return 'text-blue-600 font-semibold';
    if (numGrade >= 50) return 'text-red-600 font-semibold';
    return '';
  };

  const calculatePeriodRankings = () => {
    // Use grades from state (loaded from Supabase)
    const classStudentIds = students.map(s => s.id);
    const allGrades = grades.filter(g => classStudentIds.includes(g.studentId));

    // Calculate average for selected period for each student
    const studentAverages = students.map(student => {
      const studentGrades = allGrades.filter((g: any) => g.studentId === student.id);

      let average = 0;
      let values: number[] = [];

      if (selectedPeriod === 'sem1Avg') {
        // Calculate Semester 1 Average
        studentGrades.forEach((g: any) => {
          const sem1Avg = calculateSemesterAverage(g.period1, g.period2, g.period3, g.exam1);
          if (sem1Avg) values.push(parseFloat(sem1Avg));
        });
      } else if (selectedPeriod === 'sem2Avg') {
        // Calculate Semester 2 Average
        studentGrades.forEach((g: any) => {
          const sem2Avg = calculateSemesterAverage(g.period4, g.period5, g.period6, g.exam2);
          if (sem2Avg) values.push(parseFloat(sem2Avg));
        });
      } else {
        // Calculate for specific period
        values = studentGrades
          .map((g: any) => g[selectedPeriod])
          .filter((val: any) => val !== undefined && !isNaN(val))
          .map((val: any) => parseFloat(val));
      }

      average = values.length > 0
        ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length
        : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        grade: student.grade,
        average: average,
        hasGrades: values.length > 0
      };
    });

    // Filter students with grades and sort by average
    const rankedStudents = studentAverages
      .filter(s => s.hasGrades)
      .sort((a, b) => b.average - a.average);

    return rankedStudents;
  };

  const updateSubjectGrade = (subject: string, field: keyof SubjectGrade, value: string) => {
    // Allow free typing - update state immediately without validation
    setSubjectGrades(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [field]: value
      }
    }));
  };

  const validateGradeOnBlur = (subject: string, field: keyof SubjectGrade, value: string) => {
    // Validate only when user finishes typing (on blur)
    if (field !== 'comments' && field !== 'subject' && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (numValue > 100) {
          showNotification('Grade cannot exceed 100', 'error');
          // Reset to empty
          setSubjectGrades(prev => ({
            ...prev,
            [subject]: {
              ...prev[subject],
              [field]: ''
            }
          }));
          return;
        }
        if (numValue < 50) {
          showNotification('Grade cannot be less than 50', 'error');
          // Reset to empty
          setSubjectGrades(prev => ({
            ...prev,
            [subject]: {
              ...prev[subject],
              [field]: ''
            }
          }));
          return;
        }
      }
    }
  };

  const hasAnyGradeData = (subjectGrade: SubjectGrade) => {
    return subjectGrade.period1 || subjectGrade.period2 || subjectGrade.period3 ||
           subjectGrade.exam1 || subjectGrade.period4 || subjectGrade.period5 ||
           subjectGrade.period6 || subjectGrade.exam2 || subjectGrade.comments;
  };

  const logChange = async (action: string, details: any) => {
    try {
      await auditService.logAction({
        action,
        details
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleSaveAllGrades = async () => {
    if (!selectedStudent) return;

    const gradesToSave: any[] = [];

    // Process each subject that has data
    Object.values(subjectGrades).forEach(subjectGrade => {
      if (hasAnyGradeData(subjectGrade)) {
        const gradeData = {
          student_id: selectedStudent.id,
          subject: subjectGrade.subject,
          period1: subjectGrade.period1 ? parseFloat(subjectGrade.period1) : undefined,
          period2: subjectGrade.period2 ? parseFloat(subjectGrade.period2) : undefined,
          period3: subjectGrade.period3 ? parseFloat(subjectGrade.period3) : undefined,
          exam1: subjectGrade.exam1 ? parseFloat(subjectGrade.exam1) : undefined,
          period4: subjectGrade.period4 ? parseFloat(subjectGrade.period4) : undefined,
          period5: subjectGrade.period5 ? parseFloat(subjectGrade.period5) : undefined,
          period6: subjectGrade.period6 ? parseFloat(subjectGrade.period6) : undefined,
          exam2: subjectGrade.exam2 ? parseFloat(subjectGrade.exam2) : undefined,
          comments: subjectGrade.comments,
        };

        gradesToSave.push(gradeData);
      }
    });

    if (gradesToSave.length === 0) {
      showNotification('Please add grades for at least one subject before saving.', 'error');
      return;
    }

    try {
      // Save all grades to Supabase
      for (const gradeData of gradesToSave) {
        await gradeService.upsertGrade(gradeData);
      }

      // Log the change
      await logChange(
        editMode ? 'UPDATE_GRADES' : 'ADD_GRADES',
        {
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          subjectCount: gradesToSave.length,
          subjects: gradesToSave.map(g => g.subject),
        }
      );

      showNotification(
        `Successfully ${editMode ? 'updated' : 'added'} grades for ${gradesToSave.length} subject(s)!`,
        'success'
      );

      // Reload grades from Supabase
      await loadGrades();

      setShowAddGrade(false);
      setSelectedStudent(null);
      setEditMode(false);
    } catch (error: any) {
      console.error('Error saving grades:', error);
      showNotification(error.message || 'Failed to save grades', 'error');
    }
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.studentId === studentId);
  };

  const getClassGradesCount = () => {
    // Count the number of students who have at least one grade entry
    const classStudentIds = students.map(s => s.id);
    const studentsWithGrades = new Set(
      grades
        .filter(g => classStudentIds.includes(g.studentId))
        .map(g => g.studentId)
    );
    return studentsWithGrades.size;
  };

  const calculateClassStatistics = () => {
    const classStudentIds = students.map(s => s.id);
    const classGrades = grades.filter(g => classStudentIds.includes(g.studentId));

    const studentAverages: { studentId: string; name: string; average: number }[] = [];

    students.forEach(student => {
      const studentGrades = classGrades.filter(g => g.studentId === student.id);
      if (studentGrades.length > 0) {
        const finalAverages = studentGrades
          .map(g => g.finalAverage)
          .filter((avg): avg is number => avg !== undefined);

        if (finalAverages.length > 0) {
          const sum = finalAverages.reduce((acc, avg) => acc + avg, 0);
          const average = sum / finalAverages.length;
          studentAverages.push({
            studentId: student.id,
            name: student.name,
            average,
          });
        }
      }
    });

    // Sort by average (highest first)
    studentAverages.sort((a, b) => b.average - a.average);

    return studentAverages;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Sponsor Dashboard</h1>
              <p className="text-xs sm:text-sm text-green-100 truncate">
                {user.name} - {user.grade}{user.section ? ` Section ${user.section}` : ''} Sponsor
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 sm:px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-sm sm:text-base min-h-[44px] flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Assigned Class</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 truncate">
                {user.grade}{user.section ? ` (${user.section})` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Grade Entry</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{getClassGradesCount()}</p>
            </div>
            <div>
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm sm:text-base min-h-[48px]"
              >
                {showStats ? 'Hide' : 'View'} Rankings
              </button>
            </div>
          </div>
        </div>

        {/* Class Statistics */}
        {showStats && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Class Rankings - {user.grade}{user.section ? ` Section ${user.section}` : ''}
              </h2>
            </div>
            <div className="p-6">
              {calculateClassStatistics().length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculateClassStatistics().map((student, index) => (
                      <tr key={student.studentId} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {student.average.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No final averages available yet. Students need complete grades to be ranked.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Period Rankings Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Period & Exam Rankings
              </h2>
              <button
                onClick={() => setShowPeriodRankings(!showPeriodRankings)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                {showPeriodRankings ? 'Hide' : 'Show'} Rankings
              </button>
            </div>
          </div>

          {showPeriodRankings && (
            <div className="p-6">
              <div className="mb-6 flex gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">Select Period:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <optgroup label="Semester 1">
                    <option value="period1">1st Period</option>
                    <option value="period2">2nd Period</option>
                    <option value="period3">3rd Period</option>
                    <option value="exam1">Exam 1</option>
                    <option value="sem1Avg">Semester 1 Average</option>
                  </optgroup>
                  <optgroup label="Semester 2">
                    <option value="period4">4th Period</option>
                    <option value="period5">5th Period</option>
                    <option value="period6">6th Period</option>
                    <option value="exam2">Exam 2</option>
                    <option value="sem2Avg">Semester 2 Average</option>
                  </optgroup>
                </select>
              </div>

              {calculatePeriodRankings().length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {calculatePeriodRankings().length} students with grades for selected period
                  </p>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calculatePeriodRankings().map((student, index) => (
                        <tr key={student.studentId} className={index < 3 ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {index < 3 && (
                              <span className="mr-2">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                              </span>
                            )}
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.studentName}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGradeColorClass(student.average)}`}>
                            {student.average.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No grades available yet for the selected period. Enter grades to see rankings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students in {user.grade}{user.section ? ` Section ${user.section}` : ''}
            </h2>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Student ID</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Grades</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {getStudentGrades(student.id).length}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowAddGrade(true);
                        }}
                        className="text-green-600 hover:text-green-800 font-semibold"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No students assigned to {user.grade}{user.section ? ` Section ${user.section}` : ''} yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

        {/* Student Grades View */}
        {selectedStudent && !showAddGrade && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Grades for {selectedStudent.name}
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1st</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2nd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3rd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem 1</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">4th</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">5th</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">6th</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem 2</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getStudentGrades(selectedStudent.id).map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{grade.subject}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.period1 || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.period2 || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.period3 || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.exam1 || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{grade.sem1Av || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.period4 || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.period5 || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.period6 || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{grade.exam2 || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{grade.sem2Av || '-'}</td>
                      <td className="px-4 py-3 font-bold text-green-600">{grade.finalAverage || '-'}</td>
                    </tr>
                  ))}
                  {getStudentGrades(selectedStudent.id).length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                        No grades entered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Grades Modal */}
        {showAddGrade && selectedStudent && (() => {
          const subjects = getSubjectsForGrade();

          // Calculate period averages across all subjects
          const calculatePeriodAverage = (period: 'period1' | 'period2' | 'period3' | 'exam1' | 'period4' | 'period5' | 'period6' | 'exam2') => {
            const values = subjects
              .map(subject => {
                const grade = subjectGrades[subject]?.[period];
                return grade ? parseFloat(grade) : null;
              })
              .filter((val): val is number => val !== null && !isNaN(val));

            if (values.length === 0) return null;
            const sum = values.reduce((acc, val) => acc + val, 0);
            return (sum / values.length).toFixed(2);
          };

          // Calculate semester 1 average across all subjects
          const calculateSemester1Average = () => {
            const semester1Averages = subjects
              .map(subject => {
                const data = subjectGrades[subject];
                if (!data) return null;
                const sem1Avg = calculateSemesterAverage(data.period1, data.period2, data.period3, data.exam1);
                return sem1Avg ? parseFloat(sem1Avg) : null;
              })
              .filter((val): val is number => val !== null && !isNaN(val));

            if (semester1Averages.length === 0) return null;
            const sum = semester1Averages.reduce((acc, val) => acc + val, 0);
            return (sum / semester1Averages.length).toFixed(2);
          };

          // Calculate semester 2 average across all subjects
          const calculateSemester2Average = () => {
            const semester2Averages = subjects
              .map(subject => {
                const data = subjectGrades[subject];
                if (!data) return null;
                const sem2Avg = calculateSemesterAverage(data.period4, data.period5, data.period6, data.exam2);
                return sem2Avg ? parseFloat(sem2Avg) : null;
              })
              .filter((val): val is number => val !== null && !isNaN(val));

            if (semester2Averages.length === 0) return null;
            const sum = semester2Averages.reduce((acc, val) => acc + val, 0);
            return (sum / semester2Averages.length).toFixed(2);
          };

          // Calculate final average across all subjects
          const calculateFinalAverageAcrossSubjects = () => {
            const finalAverages = subjects
              .map(subject => {
                const data = subjectGrades[subject];
                if (!data) return null;
                const sem1Avg = calculateSemesterAverage(data.period1, data.period2, data.period3, data.exam1);
                const sem2Avg = calculateSemesterAverage(data.period4, data.period5, data.period6, data.exam2);
                const finalAvg = calculateFinalAverage(sem1Avg, sem2Avg);
                return finalAvg ? parseFloat(finalAvg) : null;
              })
              .filter((val): val is number => val !== null && !isNaN(val));

            if (finalAverages.length === 0) return null;
            const sum = finalAverages.reduce((acc, val) => acc + val, 0);
            return (sum / finalAverages.length).toFixed(2);
          };

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {editMode ? 'Edit' : 'Add'} Grades for {selectedStudent.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Grade:</span>
                          <span className="px-2 py-1 bg-gray-100 rounded">{selectedStudent.grade}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Student ID:</span>
                          <span className="px-2 py-1 bg-gray-100 rounded">{selectedStudent.studentId}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                          <span className="text-xs">Grade Range: 50-100</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">70-100 = Blue</span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">50-69 = Red</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddGrade(false);
                        setActiveSubjectIndex(0);
                      }}
                      className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Period Averages Display */}
                <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
                  <p className="text-xs font-medium text-gray-600 mb-2">Period Averages & Rankings (Across All Subjects)</p>
                  <div className="grid grid-cols-4 gap-3">
                    {/* Semester 1 Periods */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-700">1st Period:</span>
                      <span className="text-sm font-bold text-blue-900">
                        {calculatePeriodAverage('period1') || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-700">2nd Period:</span>
                      <span className="text-sm font-bold text-blue-900">
                        {calculatePeriodAverage('period2') || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-700">3rd Period:</span>
                      <span className="text-sm font-bold text-blue-900">
                        {calculatePeriodAverage('period3') || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-700">Exam 1:</span>
                      <span className="text-sm font-bold text-blue-900">
                        {calculatePeriodAverage('exam1') || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {/* Semester 2 Periods */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700">4th Period:</span>
                      <span className="text-sm font-bold text-purple-900">
                        {calculatePeriodAverage('period4') || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700">5th Period:</span>
                      <span className="text-sm font-bold text-purple-900">
                        {calculatePeriodAverage('period5') || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700">6th Period:</span>
                      <span className="text-sm font-bold text-purple-900">
                        {calculatePeriodAverage('period6') || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700">Exam 2:</span>
                      <span className="text-sm font-bold text-purple-900">
                        {calculatePeriodAverage('exam2') || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-300">
                    {/* Semester and Final Averages */}
                    <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                      <span className="text-xs font-medium text-blue-800">Semester 1 Average:</span>
                      <span className={`text-base font-bold ${getGradeColorClass(calculateSemester1Average() ?? undefined) || 'text-blue-900'}`}>
                        {calculateSemester1Average() || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-lg">
                      <span className="text-xs font-medium text-purple-800">Semester 2 Average:</span>
                      <span className={`text-base font-bold ${getGradeColorClass(calculateSemester2Average() ?? undefined) || 'text-purple-900'}`}>
                        {calculateSemester2Average() || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                      <span className="text-xs font-medium text-green-800">Final Average:</span>
                      <span className={`text-base font-bold ${getGradeColorClass(calculateFinalAverageAcrossSubjects() ?? undefined) || 'text-green-900'}`}>
                        {calculateFinalAverageAcrossSubjects() || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grade Entry Table */}
                <div className="flex-1 overflow-auto px-6 py-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 min-w-[180px]">Subject</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-blue-700" colSpan={4}>Semester 1</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-blue-700">Sem1 Avg</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-purple-700" colSpan={4}>Semester 2</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-purple-700">Sem2 Avg</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-green-700">Final</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600 text-sm sticky left-0 bg-gray-50 z-10"></th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">1st</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">2nd</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">3rd</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">Exam</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm"></th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">4th</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">5th</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">6th</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm">Exam</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm"></th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 text-sm"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => {
                        const data = subjectGrades[subject] || {};
                        const sem1Avg = calculateSemesterAverage(data.period1, data.period2, data.period3, data.exam1);
                        const sem2Avg = calculateSemesterAverage(data.period4, data.period5, data.period6, data.exam2);
                        const finalAvg = calculateFinalAverage(sem1Avg, sem2Avg);

                        return (
                          <tr key={subject} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white">{subject}</td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.period1 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'period1', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'period1', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.period1)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.period2 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'period2', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'period2', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.period2)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.period3 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'period3', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'period3', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.period3)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.exam1 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'exam1', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'exam1', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.exam1)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center bg-blue-50">
                              <span className={getGradeColorClass(sem1Avg) || 'font-semibold text-gray-600'}>
                                {sem1Avg || '-'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.period4 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'period4', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'period4', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.period4)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.period5 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'period5', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'period5', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.period5)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.period6 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'period6', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'period6', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.period6)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="100"
                                value={data.exam2 || ''}
                                onChange={(e) => updateSubjectGrade(subject, 'exam2', e.target.value)}
                                onBlur={(e) => validateGradeOnBlur(subject, 'exam2', e.target.value)}
                                className={`w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm ${getGradeColorClass(data.exam2)}`}
                                placeholder="-"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center bg-purple-50">
                              <span className={getGradeColorClass(sem2Avg) || 'font-semibold text-gray-600'}>
                                {sem2Avg || '-'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center bg-green-50">
                              <span className={getGradeColorClass(finalAvg) || 'font-bold text-gray-600'}>
                                {finalAvg || '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>

                  {/* General Comments Section */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">General Comments (Optional)</label>
                    <textarea
                      value={subjectGrades[subjects[0]]?.comments || ''}
                      onChange={(e) => updateSubjectGrade(subjects[0], 'comments', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Add any general notes or comments..."
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">

                  <div className="flex gap-3 justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddGrade(false);
                        setSelectedStudent(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAllGrades}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editMode ? 'Update All Grades' : 'Save All Grades'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
