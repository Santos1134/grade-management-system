import { useState, useEffect, useCallback } from 'react';
import Notification from '../components/Notification';
import { gradeService } from '../services/grade.service';
import { userService } from '../services/user.service';
import { notificationService } from '../services/notification.service';

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

interface GradeNotification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface RankingRecord {
  id: string;
  class_rank?: number;
  final_rank?: number;
  average?: number;
}

interface StudentRecord {
  id: string;
  student_id: string;
  grade: string;
  section?: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface GradeRecord {
  id: string;
  student_id: string;
  subject: string;
  period1?: number;
  period2?: number;
  period3?: number;
  exam1?: number;
  sem1_av?: number;
  period4?: number;
  period5?: number;
  period6?: number;
  exam2?: number;
  sem2_av?: number;
  final_average?: number;
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
  const [finalRanking, setFinalRanking] = useState<{position: number, total: number} | null>(null);
  const [periodRankings, setPeriodRankings] = useState<{[key: string]: {position: number, total: number}}>({});
  const [sponsorName, setSponsorName] = useState<string>('Not Assigned');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [gradeNotifications, setGradeNotifications] = useState<GradeNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Session timeout effect - auto logout after 20 minutes of inactivity
  useEffect(() => {
    const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds

    const resetTimer = () => {
      setLastActivity(Date.now());
    };

    // Track user activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Check for inactivity every minute
    const checkInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity >= TIMEOUT_DURATION) {
        console.log('[Session Timeout] Logging out student due to 20 minutes of inactivity');
        onLogout();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(checkInterval);
    };
  }, [lastActivity, onLogout]);

  // Helper function to get grade color class based on value
  const getGradeColorClass = (grade: number | undefined) => {
    if (!grade) return 'text-gray-600';
    if (grade >= 70) return 'text-blue-600 font-semibold';
    if (grade >= 50) return 'text-red-600 font-semibold';
    return 'text-gray-600';
  };

  const checkForNewGrades = useCallback(async () => {
    try {
      // Check notifications table for unread notifications
      const notifications = await notificationService.getNotifications(user.id);
      const unreadNotifications = notifications.filter((n: GradeNotification) => !n.read);

      if (unreadNotifications.length > 0) {
        setGradeNotifications(unreadNotifications);
        setNotification({
          message: `You have ${unreadNotifications.length} new grade notification(s)! Click the bell icon to view.`,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error checking for new grades:', error);
    }
  }, [user.id]);

  const markNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id);
      setGradeNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getSponsorName = useCallback(async () => {
    try {
      // Get all sponsors for this grade and section
      const sponsors = await userService.getSponsors(user.grade, user.section);
      if (sponsors && sponsors.length > 0) {
        setSponsorName(sponsors[0].profiles.name);
      } else {
        setSponsorName('Not Assigned');
      }
    } catch (error) {
      console.error('Error loading sponsor:', error);
      setSponsorName('Not Assigned');
    }
  }, [user.grade, user.section]);

  const loadGrades = useCallback(async () => {
    try {
      const data = await gradeService.getStudentGrades(user.id);
      const formattedGrades = data.map((g: GradeRecord) => ({
        id: g.id,
        studentId: g.student_id,
        studentName: user.name,
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
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.name]);

  const calculateRanking = useCallback(async () => {
    try {
      const rankings = await gradeService.getClassRankings(user.grade, user.section);
      const total = rankings.length;
      const studentRanking = rankings.find((r: RankingRecord) => r.id === user.id);

      if (studentRanking) {
        setRanking({
          position: studentRanking.class_rank,
          total: total
        });
      } else {
        setRanking({
          position: total,
          total: total
        });
      }
    } catch (error) {
      console.error('Error calculating ranking:', error);
    }
  }, [user.grade, user.section, user.id]);

  const calculateFinalRanking = useCallback(async () => {
    try {
      const rankings = await gradeService.getFinalRankings(user.grade, user.section);
      const total = rankings.length;
      const studentRanking = rankings.find((r: RankingRecord) => r.id === user.id);

      if (studentRanking) {
        setFinalRanking({
          position: studentRanking.final_rank,
          total: total
        });
      } else {
        setFinalRanking({
          position: total,
          total: total
        });
      }
    } catch (error) {
      console.error('Error calculating final ranking:', error);
    }
  }, [user.grade, user.section, user.id]);

  const calculatePeriodRankings = useCallback(async () => {
    try {
      // Get all students in this grade/section
      const students = await userService.getStudents(user.grade, user.section);
      const studentIds = students.map((s: StudentRecord) => s.id);

      // Get all grades for these students
      const allGrades = await gradeService.getGradesForStudents(studentIds);

      const periods = ['period1', 'period2', 'period3', 'exam1', 'period4', 'period5', 'period6', 'exam2'] as const;
      const rankings: {[key: string]: {position: number, total: number}} = {};

      periods.forEach(period => {
        // Calculate period average for each student
        const studentPeriodAverages = students.map((student: StudentRecord) => {
          const studentGrades = allGrades.filter((g: GradeRecord) => g.student_id === student.id);
          const values = studentGrades
            .map((g: GradeRecord) => g[period])
            .filter((val): val is number => val !== undefined && !isNaN(val) && val !== null);

          const average = values.length > 0
            ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length
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
    } catch (error) {
      console.error('Error calculating period rankings:', error);
    }
  }, [user.grade, user.section, user.id]);

  useEffect(() => {
    loadGrades();
    calculateRanking();
    calculateFinalRanking();
    calculatePeriodRankings();
    getSponsorName();
    checkForNewGrades();
  }, [loadGrades, calculateRanking, calculateFinalRanking, calculatePeriodRankings, getSponsorName, checkForNewGrades]);

  const calculateOverallAverage = () => {
    const validAverages = grades
      .map(g => g.finalAverage)
      .filter((avg): avg is number => avg !== undefined);

    if (validAverages.length === 0) return null;
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

  const calculateSemesterAverage = (semester: 1 | 2) => {
    const values = grades
      .map(grade => semester === 1 ? grade.sem1Av : grade.sem2Av)
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg print:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white print:text-gray-900 truncate">Student Dashboard</h1>
              <p className="text-xs sm:text-sm text-green-100 print:text-gray-600 truncate">Welcome, {user.name}</p>
            </div>
            <div className="flex gap-1 sm:gap-2 print:hidden flex-shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                // Dismiss the top notification banner when opening modal
                if (!showNotifications) {
                  setNotification(null);
                }
              }}
              className="relative p-2 sm:px-3 sm:py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold flex items-center gap-1 sm:gap-2 min-h-[44px] min-w-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="hidden sm:inline text-sm">Alerts</span>
              {gradeNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {gradeNotifications.length}
                </span>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold flex items-center gap-1 sm:gap-2 min-h-[44px] min-w-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden md:inline text-sm">Print</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 sm:px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-sm sm:text-base min-h-[44px]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-6 text-center">
          <h1 className="text-2xl font-bold text-green-800">St. Peter Claver Catholic High School</h1>
          <p className="text-gray-600 italic">Joyfully striving for a better tomorrow</p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Student ID</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{user.studentId}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs sm:text-sm text-gray-600">Student Name</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{user.name}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Grade Level</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">
                {user.grade}{user.section ? ` (${user.section})` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Class Sponsor</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">{sponsorName}</p>
            </div>
            {ranking && ranking.position > 0 && calculateOverallAverage() && (
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Class Ranking</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-green-600">
                  {ranking.position} / {ranking.total}
                </p>
              </div>
            )}
            {finalRanking && finalRanking.position > 0 && calculateOverallAverage() && (
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Final Ranking</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-purple-600">
                  {finalRanking.position} / {finalRanking.total}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Overall Average</p>
              <p className="text-3xl font-bold text-green-600">{calculateOverallAverage() || '-'}</p>
            </div>
          </div>
        </div>

        {/* Period Averages Section */}
        {grades.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Period Averages & Rankings</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
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
              <div className="bg-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-900 mb-1">Sem 1 Avg</p>
                <p className="text-2xl font-bold text-blue-900">
                  {calculateSemesterAverage(1) || '-'}
                </p>
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
              <div className="bg-purple-200 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-900 mb-1">Sem 2 Avg</p>
                <p className="text-2xl font-bold text-purple-900">
                  {calculateSemesterAverage(2) || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grades Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Grade Report</h2>
          </div>

          {isLoading ? (
            <div className="p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">No grades available yet</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">Subject</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">1st</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">2nd</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">3rd</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Exam</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Sem Avg</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">4th</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">5th</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">6th</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Exam</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Sem Avg</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Final</th>
                      </tr>
                    </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSubjectsForGrade().map((subject) => {
                    const grade = grades.find(g => g.subject === subject);
                    return (
                      <tr key={subject} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-gray-900 sticky left-0 bg-white whitespace-nowrap">{subject}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.period1)}`}>{grade?.period1 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.period2)}`}>{grade?.period2 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.period3)}`}>{grade?.period3 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.exam1)}`}>{grade?.exam1 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.sem1Av)}`}>{grade?.sem1Av?.toFixed(2) || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.period4)}`}>{grade?.period4 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.period5)}`}>{grade?.period5 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.period6)}`}>{grade?.period6 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.exam2)}`}>{grade?.exam2 || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${getGradeColorClass(grade?.sem2Av)}`}>{grade?.sem2Av?.toFixed(2) || '-'}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 font-bold whitespace-nowrap ${getGradeColorClass(grade?.finalAverage)}`}>{grade?.finalAverage?.toFixed(2) || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
            </div>
          )}
        </div>
      </main>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Grade Update Notifications</h3>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  // Mark notifications as read when closing the modal
                  if (gradeNotifications.length > 0) {
                    markNotificationsAsRead();
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {gradeNotifications.length > 0 ? (
                <div className="space-y-3">
                  {gradeNotifications.map((notification: GradeNotification) => (
                    <div key={notification.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500">No new notifications</p>
                  <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
