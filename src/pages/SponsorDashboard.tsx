import { useState, useEffect } from 'react';
import Notification from '../components/Notification';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'sponsor';
}

interface Sponsor extends User {
  role: 'sponsor';
  grade: string;
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

const PERIODS = [
  { key: 'period1', label: '1st Period' },
  { key: 'period2', label: '2nd Period' },
  { key: 'period3', label: '3rd Period' },
  { key: 'exam1', label: 'Exam' },
  { key: 'sem1Av', label: 'Sem Avg' },
  { key: 'period4', label: '4th Period' },
  { key: 'period5', label: '5th Period' },
  { key: 'period6', label: '6th Period' },
  { key: 'exam2', label: 'Exam' },
  { key: 'sem2Av', label: 'Sem Avg' },
  { key: 'finalAverage', label: 'Final Av' },
];

export default function SponsorDashboard({ user, onLogout }: SponsorDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectGrades, setSubjectGrades] = useState<Record<string, SubjectGrade>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);

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

  const loadStudents = () => {
    const storedUsers = localStorage.getItem('users');
    let gradeStudents: any[] = [];

    if (storedUsers) {
      const allUsers = JSON.parse(storedUsers);
      gradeStudents = allUsers.filter(
        (u: any) => u.role === 'student' && u.grade === user.grade
      );
    }

    setStudents(gradeStudents);
    setIsLoading(false);
  };

  const loadGrades = () => {
    const storedGrades = localStorage.getItem('grades');
    if (storedGrades) {
      setGrades(JSON.parse(storedGrades));
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

  const updateSubjectGrade = (subject: string, field: keyof SubjectGrade, value: string) => {
    // Validate grade values (max 100)
    if (field !== 'comments' && field !== 'subject' && value) {
      const numValue = parseFloat(value);
      if (numValue > 100) {
        showNotification('Grade cannot exceed 100', 'error');
        return;
      }
      if (numValue < 0) {
        showNotification('Grade cannot be negative', 'error');
        return;
      }
    }

    setSubjectGrades(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [field]: value
      }
    }));
  };

  const hasAnyGradeData = (subjectGrade: SubjectGrade) => {
    return subjectGrade.period1 || subjectGrade.period2 || subjectGrade.period3 ||
           subjectGrade.exam1 || subjectGrade.period4 || subjectGrade.period5 ||
           subjectGrade.period6 || subjectGrade.exam2 || subjectGrade.comments;
  };

  const logChange = (action: string, details: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      user: user.name,
      userId: user.id,
      action,
      details,
    };

    const changeLog = JSON.parse(localStorage.getItem('changeLog') || '[]');
    changeLog.push(log);
    localStorage.setItem('changeLog', JSON.stringify(changeLog));
  };

  const handleSaveAllGrades = () => {
    if (!selectedStudent) return;

    const newGrades: Grade[] = [];
    const updatedGradeIds: string[] = [];

    // Remove existing grades for this student if in edit mode
    let filteredGrades = editMode
      ? grades.filter(g => g.studentId !== selectedStudent.id)
      : grades;

    // Process each subject that has data
    Object.values(subjectGrades).forEach(subjectGrade => {
      if (hasAnyGradeData(subjectGrade)) {
        const sem1Av = calculateSemesterAverage(
          subjectGrade.period1,
          subjectGrade.period2,
          subjectGrade.period3,
          subjectGrade.exam1
        );

        const sem2Av = calculateSemesterAverage(
          subjectGrade.period4,
          subjectGrade.period5,
          subjectGrade.period6,
          subjectGrade.exam2
        );

        const finalAverage = calculateFinalAverage(sem1Av, sem2Av);

        const grade: Grade = {
          id: `${Date.now()}-${Math.random()}-${subjectGrade.subject}`,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          subject: subjectGrade.subject,
          period1: subjectGrade.period1 ? parseFloat(subjectGrade.period1) : undefined,
          period2: subjectGrade.period2 ? parseFloat(subjectGrade.period2) : undefined,
          period3: subjectGrade.period3 ? parseFloat(subjectGrade.period3) : undefined,
          exam1: subjectGrade.exam1 ? parseFloat(subjectGrade.exam1) : undefined,
          sem1Av: sem1Av ? parseFloat(sem1Av) : undefined,
          period4: subjectGrade.period4 ? parseFloat(subjectGrade.period4) : undefined,
          period5: subjectGrade.period5 ? parseFloat(subjectGrade.period5) : undefined,
          period6: subjectGrade.period6 ? parseFloat(subjectGrade.period6) : undefined,
          exam2: subjectGrade.exam2 ? parseFloat(subjectGrade.exam2) : undefined,
          sem2Av: sem2Av ? parseFloat(sem2Av) : undefined,
          finalAverage: finalAverage ? parseFloat(finalAverage) : undefined,
          comments: subjectGrade.comments,
        };

        newGrades.push(grade);
      }
    });

    if (newGrades.length === 0) {
      showNotification('Please add grades for at least one subject before saving.', 'error');
      return;
    }

    const updatedGrades = [...filteredGrades, ...newGrades];
    setGrades(updatedGrades);
    localStorage.setItem('grades', JSON.stringify(updatedGrades));

    // Log the change
    logChange(
      editMode ? 'UPDATE_GRADES' : 'ADD_GRADES',
      {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        subjectCount: newGrades.length,
        subjects: newGrades.map(g => g.subject),
      }
    );

    showNotification(
      `Successfully ${editMode ? 'updated' : 'added'} grades for ${newGrades.length} subject(s)!`,
      'success'
    );
    setShowAddGrade(false);
    setSelectedStudent(null);
    setEditMode(false);
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.studentId === studentId);
  };

  const getClassGradesCount = () => {
    // Only count grades for students in this sponsor's class
    const classStudentIds = students.map(s => s.id);
    return grades.filter(g => classStudentIds.includes(g.studentId)).length;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Sponsor Dashboard</h1>
            <p className="text-sm text-green-100">
              {user.name} - Grade {user.grade} Sponsor
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Assigned Grade</p>
              <p className="text-2xl font-bold text-green-600">{user.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class Grade Entries</p>
              <p className="text-2xl font-bold text-gray-900">{getClassGradesCount()}</p>
            </div>
            <div>
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                {showStats ? 'Hide' : 'View'} Class Rankings
              </button>
            </div>
          </div>
        </div>

        {/* Class Statistics */}
        {showStats && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Class Rankings - {user.grade}
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

        {/* Students List */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students in {user.grade}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grades Entered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getStudentGrades(student.id).length} subjects
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowAddGrade(true);
                        }}
                        className="text-green-600 hover:text-green-800 font-semibold mr-4"
                      >
                        Add Grades
                      </button>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View Grades
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No students assigned to {user.grade} yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
          const currentSubject = subjects[activeSubjectIndex];
          const subjectData = subjectGrades[currentSubject];

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

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {editMode ? 'Edit' : 'Add'} Grades for {selectedStudent.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Subject {activeSubjectIndex + 1} of {subjects.length}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddGrade(false);
                      setActiveSubjectIndex(0);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Period Averages Display */}
                <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Student Period Averages (across all subjects)</p>
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
                </div>

                {/* Subject Tabs */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 overflow-x-auto">
                  <div className="flex gap-2">
                    {subjects.map((subject, index) => {
                      const hasData = subjectGrades[subject] && hasAnyGradeData(subjectGrades[subject]);
                      return (
                        <button
                          key={subject}
                          onClick={() => setActiveSubjectIndex(index)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                            index === activeSubjectIndex
                              ? 'bg-green-600 text-white'
                              : hasData
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {subject}
                          {hasData && index !== activeSubjectIndex && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grade Entry Form */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> All fields are optional. Grades cannot exceed 100. Blue dots indicate subjects with entered data.
                    </p>
                  </div>

                  {subjectData && (() => {
                    const sem1Avg = calculateSemesterAverage(
                      subjectData.period1,
                      subjectData.period2,
                      subjectData.period3,
                      subjectData.exam1
                    );
                    const sem2Avg = calculateSemesterAverage(
                      subjectData.period4,
                      subjectData.period5,
                      subjectData.period6,
                      subjectData.exam2
                    );
                    const finalAvg = calculateFinalAverage(sem1Avg, sem2Avg);

                    return (
                      <div className="space-y-6">
                        {/* Current Subject Header */}
                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                          <h4 className="text-2xl font-bold text-green-800">{currentSubject}</h4>
                        </div>

                        {/* Semester 1 */}
                        <div className="border border-gray-200 rounded-lg p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-blue-600 rounded"></div>
                              <h5 className="text-lg font-semibold text-gray-900">Semester 1</h5>
                            </div>
                            {sem1Avg && (
                              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                                <span className="text-sm font-medium text-blue-700">Semester Average: </span>
                                <span className="text-lg font-bold text-blue-900">{sem1Avg}</span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">1st Period</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.period1}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'period1', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">2nd Period</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.period2}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'period2', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">3rd Period</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.period3}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'period3', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.exam1}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'exam1', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Semester 2 */}
                        <div className="border border-gray-200 rounded-lg p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-purple-600 rounded"></div>
                              <h5 className="text-lg font-semibold text-gray-900">Semester 2</h5>
                            </div>
                            {sem2Avg && (
                              <div className="bg-purple-100 px-4 py-2 rounded-lg">
                                <span className="text-sm font-medium text-purple-700">Semester Average: </span>
                                <span className="text-lg font-bold text-purple-900">{sem2Avg}</span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">4th Period</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.period4}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'period4', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">5th Period</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.period5}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'period5', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">6th Period</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.period6}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'period6', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                              <input
                                type="number"
                                step="0.01"
                                value={subjectData.exam2}
                                onChange={(e) => updateSubjectGrade(currentSubject, 'exam2', e.target.value)}
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="0-100"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Final Average Display */}
                        {finalAvg && (
                          <div className="bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-400 rounded-lg p-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-green-700">Final Average for {currentSubject}</p>
                                  <p className="text-xs text-green-600">Calculated from both semester averages</p>
                                </div>
                              </div>
                              <div className="text-4xl font-bold text-green-800">{finalAvg}</div>
                            </div>
                          </div>
                        )}

                        {/* Comments */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                          <textarea
                            value={subjectData.comments}
                            onChange={(e) => updateSubjectGrade(currentSubject, 'comments', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Add any notes or comments about this subject..."
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddGrade(false);
                        setSelectedStudent(null);
                        setActiveSubjectIndex(0);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSubjectIndex(Math.max(0, activeSubjectIndex - 1))}
                      disabled={activeSubjectIndex === 0}
                      className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex-1"></div>

                    {activeSubjectIndex < subjects.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveSubjectIndex(Math.min(subjects.length - 1, activeSubjectIndex + 1))}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                      >
                        Next Subject
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveAllGrades}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editMode ? 'Update All Grades' : 'Save All Grades'}
                      </button>
                    )}
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
