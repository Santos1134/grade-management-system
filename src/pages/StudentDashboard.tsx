import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'sponsor';
}

interface Student extends User {
  role: 'student';
  studentId: string;
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

interface StudentDashboardProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ranking, setRanking] = useState<{position: number, total: number} | null>(null);
  const [periodRankings, setPeriodRankings] = useState<{[key: string]: {position: number, total: number}}>({});
  const [sponsorName, setSponsorName] = useState<string>('Not Assigned');

  useEffect(() => {
    loadGrades();
    calculateRanking();
    calculatePeriodRankings();
    getSponsorName();
  }, [user.id]);

  const getSponsorName = () => {
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    const users = JSON.parse(storedUsers);
    const sponsor = users.find((u: any) =>
      u.role === 'sponsor' && u.grade === user.grade
    );
    setSponsorName(sponsor ? sponsor.name : 'Not Assigned');
  };

  const loadGrades = () => {
    const storedGrades = localStorage.getItem('grades');
    if (storedGrades) {
      const allGrades: Grade[] = JSON.parse(storedGrades);
      const studentGrades = allGrades.filter(g => g.studentId === user.id);
      setGrades(studentGrades);
    }
    setIsLoading(false);
  };

  const calculateRanking = () => {
    const storedGrades = localStorage.getItem('grades');
    const storedUsers = localStorage.getItem('users');

    if (!storedGrades || !storedUsers) return;

    const allGrades: Grade[] = JSON.parse(storedGrades);
    const allUsers = JSON.parse(storedUsers);
    const studentsInGrade = allUsers.filter((u: any) => u.role === 'student' && u.grade === user.grade);

    // Calculate average for each student
    const studentAverages = studentsInGrade.map((student: any) => {
      const studentGrades = allGrades.filter(g => g.studentId === student.id);
      const validAverages = studentGrades
        .map(g => g.finalAverage)
        .filter((avg): avg is number => avg !== undefined);

      const average = validAverages.length > 0
        ? validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length
        : 0;

      return {
        studentId: student.id,
        average: average
      };
    });

    // Sort by average (descending)
    studentAverages.sort((a, b) => b.average - a.average);

    // Find current student's position
    const position = studentAverages.findIndex(s => s.studentId === user.id) + 1;

    setRanking({
      position: position || studentsInGrade.length,
      total: studentsInGrade.length
    });
  };

  const calculatePeriodRankings = () => {
    const storedGrades = localStorage.getItem('grades');
    const storedUsers = localStorage.getItem('users');

    if (!storedGrades || !storedUsers) return;

    const allGrades: Grade[] = JSON.parse(storedGrades);
    const allUsers = JSON.parse(storedUsers);
    const studentsInGrade = allUsers.filter((u: any) => u.role === 'student' && u.grade === user.grade);

    const periods = ['period1', 'period2', 'period3', 'exam1', 'period4', 'period5', 'period6', 'exam2'] as const;
    const rankings: {[key: string]: {position: number, total: number}} = {};

    periods.forEach(period => {
      // Calculate period average for each student
      const studentPeriodAverages = studentsInGrade.map((student: any) => {
        const studentGrades = allGrades.filter(g => g.studentId === student.id);
        const values = studentGrades
          .map(g => g[period])
          .filter((val): val is number => val !== undefined && !isNaN(val));

        const average = values.length > 0
          ? values.reduce((sum, val) => sum + val, 0) / values.length
          : 0;

        return {
          studentId: student.id,
          average: average
        };
      });

      // Filter out students with no grades for this period
      const studentsWithGrades = studentPeriodAverages.filter(s => s.average > 0);

      if (studentsWithGrades.length > 0) {
        // Sort by average (descending)
        studentsWithGrades.sort((a, b) => b.average - a.average);

        // Find current student's position
        const position = studentsWithGrades.findIndex(s => s.studentId === user.id) + 1;

        if (position > 0) {
          rankings[period] = {
            position: position,
            total: studentsWithGrades.length
          };
        }
      }
    });

    setPeriodRankings(rankings);
  };

  const calculateOverallAverage = () => {
    const validAverages = grades
      .map(g => g.finalAverage)
      .filter((avg): avg is number => avg !== undefined);

    if (validAverages.length === 0) return '0.00';
    const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
    return (sum / validAverages.length).toFixed(2);
  };

  const calculatePeriodAverage = (period: 'period1' | 'period2' | 'period3' | 'exam1' | 'period4' | 'period5' | 'period6' | 'exam2') => {
    const values = grades
      .map(grade => grade[period])
      .filter((val): val is number => val !== undefined && !isNaN(val));

    if (values.length === 0) return null;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(2);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${user.name.replace(/\s+/g, '_')}_Grade_Report`;
    window.print();
    document.title = originalTitle;
  };

  const getSubjectsForGrade = () => {
    const isJunior = user.grade.includes('7th') || user.grade.includes('8th') || user.grade.includes('9th');
    return isJunior
      ? ['Doctrine', 'English', 'Literature', 'Geography', 'Civics', 'Mathematics', 'Science', 'LAB', 'P.E/R.O.T.C']
      : ['Doctrine', 'English', 'Literature', 'Geography', 'History', 'Economics', 'Geometry', 'Algebra', 'Trigonometry', 'Chemistry', 'Physics', 'Biology', 'LAB', 'P.E/R.O.T.C'];
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg print:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white print:text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-green-100 print:text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Grade Sheet
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-6 text-center">
          <h1 className="text-2xl font-bold text-green-800">St. Peter Claver Catholic High School</h1>
          <p className="text-gray-600 italic">Joyfully striving for a better tomorrow</p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="text-2xl font-bold text-gray-900">{user.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student Name</p>
              <p className="text-2xl font-bold text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Grade Level</p>
              <p className="text-2xl font-bold text-gray-900">{user.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class Sponsor</p>
              <p className="text-2xl font-bold text-gray-900">{sponsorName}</p>
            </div>
            {ranking && ranking.position > 0 && calculateOverallAverage() !== '0.00' && (
              <div>
                <p className="text-sm text-gray-600">Class Ranking</p>
                <p className="text-2xl font-bold text-green-600">
                  {ranking.position} / {ranking.total}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Overall Average</p>
              <p className="text-3xl font-bold text-green-600">{calculateOverallAverage()}</p>
            </div>
          </div>
        </div>

        {/* Period Averages Section */}
        {grades.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Averages & Rankings (Across All Subjects)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Semester 1 Periods */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 mb-1">1st Period</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculatePeriodAverage('period1') || '-'}
                </p>
                {periodRankings['period1'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['period1'].position}/{periodRankings['period1'].total}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 mb-1">2nd Period</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculatePeriodAverage('period2') || '-'}
                </p>
                {periodRankings['period2'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['period2'].position}/{periodRankings['period2'].total}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 mb-1">3rd Period</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculatePeriodAverage('period3') || '-'}
                </p>
                {periodRankings['period3'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['period3'].position}/{periodRankings['period3'].total}
                  </p>
                )}
              </div>
              <div className="bg-blue-100 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800 mb-1">Exam 1</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculatePeriodAverage('exam1') || '-'}
                </p>
                {periodRankings['exam1'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['exam1'].position}/{periodRankings['exam1'].total}
                  </p>
                )}
              </div>

              {/* Semester 2 Periods */}
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">4th Period</p>
                <p className="text-2xl font-bold text-purple-900">
                  {calculatePeriodAverage('period4') || '-'}
                </p>
                {periodRankings['period4'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['period4'].position}/{periodRankings['period4'].total}
                  </p>
                )}
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">5th Period</p>
                <p className="text-2xl font-bold text-purple-900">
                  {calculatePeriodAverage('period5') || '-'}
                </p>
                {periodRankings['period5'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['period5'].position}/{periodRankings['period5'].total}
                  </p>
                )}
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">6th Period</p>
                <p className="text-2xl font-bold text-purple-900">
                  {calculatePeriodAverage('period6') || '-'}
                </p>
                {periodRankings['period6'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['period6'].position}/{periodRankings['period6'].total}
                  </p>
                )}
              </div>
              <div className="bg-purple-100 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-800 mb-1">Exam 2</p>
                <p className="text-2xl font-bold text-purple-900">
                  {calculatePeriodAverage('exam2') || '-'}
                </p>
                {periodRankings['exam2'] && (
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Rank: {periodRankings['exam2'].position}/{periodRankings['exam2'].total}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grades Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Grade Report</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-600">Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No grades available yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1st</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2nd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3rd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem Avg</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">4th</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">5th</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">6th</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem Avg</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSubjectsForGrade().map((subject) => {
                    const grade = grades.find(g => g.subject === subject);
                    return (
                      <tr key={subject} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{subject}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.period1 || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.period2 || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.period3 || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.exam1 || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{grade?.sem1Av?.toFixed(2) || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.period4 || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.period5 || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.period6 || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{grade?.exam2 || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{grade?.sem2Av?.toFixed(2) || '-'}</td>
                        <td className="px-4 py-3 font-bold text-green-600">{grade?.finalAverage?.toFixed(2) || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:bg-white {
            background-color: white !important;
            color: #1f2937 !important;
          }
          .print\\:text-gray-900 {
            color: #1f2937 !important;
          }
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
        }
      `}</style>
    </div>
  );
}
