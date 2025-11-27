import { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import { adminService } from '../services/admin.service';
import { auditService } from '../services/audit.service';
import { gradeService } from '../services/grade.service';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

interface AdminDashboardProps {
  user: Admin;
  onLogout: () => void;
}

interface NewUserForm {
  password: string;
  name: string;
  role: 'student' | 'sponsor';
  studentId?: string;
  grade?: string;
  section?: string; // Section field for 7th and 8th grade
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userType, setUserType] = useState<'student' | 'sponsor' | null>('student');
  const [formData, setFormData] = useState<NewUserForm>({
    password: '',
    name: '',
    role: 'student',
    studentId: '',
    grade: '',
    section: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [showPeriodRankings, setShowPeriodRankings] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'period1' | 'period2' | 'period3' | 'exam1' | 'period4' | 'period5' | 'period6' | 'exam2' | 'sem1Avg' | 'sem2Avg' | 'finalAvg'>('period1');
  const [selectedGradeForRanking, setSelectedGradeForRanking] = useState<string>('all');
  const [rankingView, setRankingView] = useState<'all' | 'honor'>('all');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userViewType, setUserViewType] = useState<'students' | 'sponsors'>('students');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [periodRankings, setPeriodRankings] = useState<any[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<{ is_enabled: boolean; message: string }>({ is_enabled: false, message: 'Grades input is in progress. Please try again later.' });
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{ userId: string; userName: string; userRole: string } | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; password: string; name: string; role: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Close all sections
  const closeAllSections = () => {
    setShowCreateUser(false);
    setShowPeriodRankings(false);
    setShowAllUsers(false);
    setShowChangePassword(false);
    setShowAuditTrail(false);
  };

  // Toggle section with accordion behavior
  const toggleSection = (section: 'createUser' | 'periodRankings' | 'allUsers' | 'changePassword' | 'auditTrail') => {
    closeAllSections();

    switch (section) {
      case 'createUser':
        setShowCreateUser(true);
        break;
      case 'periodRankings':
        setShowPeriodRankings(true);
        break;
      case 'allUsers':
        setShowAllUsers(true);
        break;
      case 'changePassword':
        setShowChangePassword(true);
        break;
      case 'auditTrail':
        setShowAuditTrail(true);
        break;
    }
  };

  // Load users from Supabase
  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users', 'error');
    }
  };

  const loadMaintenanceMode = async () => {
    try {
      const data = await adminService.getMaintenanceMode();
      setMaintenanceMode(data);
    } catch (error) {
      console.error('Error loading maintenance mode:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
    loadMaintenanceMode();
  }, []);

  useEffect(() => {
    if (showPeriodRankings && users.length > 0) {
      loadPeriodRankings();
    }
  }, [showPeriodRankings, selectedPeriod, selectedGradeForRanking, rankingView, users]);

  const loadPeriodRankings = async () => {
    const rankings = await calculatePeriodRankings();
    setPeriodRankings(rankings);
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await auditService.getAllLogs();
      // Map database columns to expected format
      const mappedLogs = logs.map(log => ({
        ...log,
        user: log.user_name, // Map user_name to user for display
      }));
      setAuditLogs(mappedLogs); // Already sorted by timestamp DESC
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAuditLogs([]);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const generateEmail = (name: string) => {
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '';
    const firstName = names[0];
    const lastName = names[names.length - 1];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@stpeter.com`;
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
    return { valid: true, message: '' };
  };

  const generateStudentId = async () => {
    try {
      return await adminService.generateStudentId();
    } catch (error) {
      console.error('Error generating student ID:', error);
      return 'STU0001';
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      showNotification(passwordValidation.message, 'error');
      return;
    }
    setPasswordError('');

    setIsCreatingUser(true);
    try {
      // Auto-generate email
      const autoEmail = generateEmail(formData.name);

      // Auto-generate student ID for students
      const studentId = userType === 'student' ? await generateStudentId() : undefined;

      // Create user in Supabase
      await adminService.createUser({
        email: autoEmail,
        password: formData.password,
        name: formData.name,
        role: userType!,
        studentId: studentId,
        grade: formData.grade,
        section: formData.section || undefined,
      });

      showNotification(
        `${userType === 'student' ? 'Student' : 'Sponsor'} account created successfully! Email: ${autoEmail}`,
        'success'
      );

      // Reset form
      setFormData({
        password: '',
        name: '',
        role: 'student',
        studentId: '',
        grade: '',
        section: '',
      });
      setUserType(null);
      setShowCreateUser(false);

      // Reload users
      await loadUsers();

      // Auto-open the user list to show the newly created user
      setUserViewType(userType === 'student' ? 'students' : 'sponsors');
      setShowAllUsers(true);
    } catch (error: any) {
      console.error('Error creating user:', error);
      showNotification(error.message || 'Failed to create user', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteConfirm({ userId, userName });
  };

  const handleResetPassword = (userId: string, userName: string, userRole: string) => {
    setResetPasswordModal({ userId, userName, userRole });
    setResetPasswordResult(null);
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordModal) return;

    setIsResettingPassword(true);
    try {
      const result = await adminService.resetUserPassword(resetPasswordModal.userId);
      setResetPasswordResult(result);

      // Log the password reset action
      await auditService.logAction({
        action: 'RESET_PASSWORD',
        details: {
          userId: resetPasswordModal.userId,
          userName: resetPasswordModal.userName,
          userEmail: result.email,
          userRole: result.role,
          warning: result.role === 'student' ? 'All grades were deleted during password reset' : 'User data preserved'
        }
      });

      showNotification(`Password reset successful for ${resetPasswordModal.userName}`, 'success');
      await loadUsers(); // Reload users list
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showNotification(error.message || 'Failed to reset password', 'error');
      setResetPasswordModal(null);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleToggleMaintenanceMode = async () => {
    setIsTogglingMaintenance(true);
    try {
      const newState = !maintenanceMode.is_enabled;
      const result = await adminService.toggleMaintenanceMode(newState, maintenanceMode.message);
      setMaintenanceMode(result);
      showNotification(
        newState
          ? 'Maintenance mode enabled - Students cannot log in'
          : 'Maintenance mode disabled - Students can now log in',
        'success'
      );
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      showNotification('Failed to toggle maintenance mode', 'error');
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await adminService.deleteUser(deleteConfirm.userId);
      showNotification('User deleted successfully!', 'success');
      setDeleteConfirm(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showNotification(error.message || 'Failed to delete user', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showNotification('Please fill in all password fields', 'error');
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.valid) {
      showNotification(passwordValidation.message, 'error');
      return;
    }

    // Check if new password matches confirm password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    try {
      // Update password in Supabase
      await adminService.changePassword(passwordForm.newPassword);

      // Log the change
      await auditService.logAction({
        action: 'CHANGE_OWN_PASSWORD',
        details: {
          message: 'Admin changed their own password',
        },
      });

      showNotification('Password changed successfully!', 'success');
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await loadAuditLogs();
    } catch (error: any) {
      console.error('Error changing password:', error);
      showNotification(error.message || 'Failed to change password', 'error');
    }
  };

  const getFilteredUsers = () => {
    return users.filter(u => {
      // Filter by user view type (students or sponsors)
      // Convert plural view type to singular role for comparison
      const roleToMatch = userViewType === 'students' ? 'student' : 'sponsor';
      const viewTypeMatch = u.role === roleToMatch;

      // Get grade from nested students or sponsors object (not array)
      let userGrade = null;
      if (u.role === 'student' && u.students) {
        userGrade = u.students.grade;
      } else if (u.role === 'sponsor' && u.sponsors) {
        userGrade = u.sponsors.grade;
      }

      const gradeMatch = filterGrade === 'all' || userGrade === filterGrade;
      return viewTypeMatch && gradeMatch;
    });
  };

  const getAvailableGrades = () => {
    const grades = new Set<string>();
    users.forEach(u => {
      // Get grade from nested students or sponsors object (not array)
      if (u.role === 'student' && u.students) {
        grades.add(u.students.grade);
      } else if (u.role === 'sponsor' && u.sponsors) {
        grades.add(u.sponsors.grade);
      }
    });
    return Array.from(grades).sort();
  };

  const calculateSemesterAverage = (p1: any, p2: any, p3: any, exam: any) => {
    const values = [p1, p2, p3, exam].filter(v => v !== undefined && !isNaN(v));
    if (values.length !== 4) return null;
    return values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length;
  };

  const calculateFinalAverage = (sem1: any, sem2: any) => {
    if (!sem1 || !sem2) return null;
    return (parseFloat(sem1) + parseFloat(sem2)) / 2;
  };

  const calculatePeriodRankings = async () => {
    try {
      const students = users.filter(u => u.role === 'student');
      if (students.length === 0) return [];

      const studentIds = students.map(s => s.id);
      const gradesData = await gradeService.getGradesForStudents(studentIds);

      // Convert to the format expected by the rest of the function
      const allGrades = gradesData.map((g: any) => ({
        studentId: g.student_id,
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
      }));

    // Filter by selected grade if not 'all'
    let filteredStudents: any[];
    if (selectedGradeForRanking === 'all') {
      filteredStudents = students;
    } else if (selectedGradeForRanking.includes(' - ')) {
      // Handle section-specific filtering (e.g., "7th Grade - A")
      const [grade, section] = selectedGradeForRanking.split(' - ');
      filteredStudents = students.filter(s => s.students && s.students.grade === grade && s.students.section === section);
    } else {
      filteredStudents = students.filter(s => s.students && s.students.grade === selectedGradeForRanking);
    }

    // Calculate average for selected period for each student
    const studentAverages = filteredStudents.map(student => {
      const studentGrades = allGrades.filter((g: any) => g.studentId === student.id);

      let average = 0;
      let values: number[] = [];

      if (selectedPeriod === 'sem1Avg') {
        // Calculate Semester 1 Average
        studentGrades.forEach((g: any) => {
          const sem1Avg = calculateSemesterAverage(g.period1, g.period2, g.period3, g.exam1);
          if (sem1Avg) values.push(sem1Avg);
        });
      } else if (selectedPeriod === 'sem2Avg') {
        // Calculate Semester 2 Average
        studentGrades.forEach((g: any) => {
          const sem2Avg = calculateSemesterAverage(g.period4, g.period5, g.period6, g.exam2);
          if (sem2Avg) values.push(sem2Avg);
        });
      } else if (selectedPeriod === 'finalAvg') {
        // Calculate Final Average
        studentGrades.forEach((g: any) => {
          const sem1Avg = calculateSemesterAverage(g.period1, g.period2, g.period3, g.exam1);
          const sem2Avg = calculateSemesterAverage(g.period4, g.period5, g.period6, g.exam2);
          const finalAvg = calculateFinalAverage(sem1Avg, sem2Avg);
          if (finalAvg) values.push(finalAvg);
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
        grade: student.students?.grade || '',
        section: student.students?.section || '',
        average: average,
        hasGrades: values.length > 0
      };
    });

    // Filter students with grades and sort by average
    const rankedStudents = studentAverages
      .filter(s => s.hasGrades)
      .sort((a, b) => b.average - a.average);

      // If honor roll view, filter to only honor students (80%+)
      if (rankingView === 'honor') {
        return rankedStudents.filter(s => s.average >= 80);
      }

      return rankedStudents;
    } catch (error) {
      console.error('Error calculating rankings:', error);
      return [];
    }
  };

  const calculateHonorRoll = async () => {
    try {
      const students = users.filter(u => u.role === 'student');
      if (students.length === 0) return { highHonor: [], honorRoll: [], honorRollMention: [] };

      const studentIds = students.map(s => s.id);
      const gradesData = await gradeService.getGradesForStudents(studentIds);

      // Convert to the format expected by the rest of the function
      const allGrades = gradesData.map((g: any) => ({
        studentId: g.student_id,
        subject: g.subject,
        period1: g.period1,
        period2: g.period2,
        period3: g.period3,
        exam1: g.exam1,
        period4: g.period4,
        period5: g.period5,
        period6: g.period6,
        exam2: g.exam2,
      }));
    const gradeClasses = ['7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];

    const honorStudentsByClass: Record<string, any[]> = {};

    gradeClasses.forEach(gradeClass => {
      const classStudents = students.filter(s => s.students && s.students.grade === gradeClass);

      const studentAverages = classStudents.map(student => {
        const studentGrades = allGrades.filter((g: any) => g.studentId === student.id);

        let average = 0;
        let values: number[] = [];

        if (selectedPeriod === 'sem1Avg') {
          // Calculate Semester 1 Average
          studentGrades.forEach((g: any) => {
            const sem1Avg = calculateSemesterAverage(g.period1, g.period2, g.period3, g.exam1);
            if (sem1Avg) values.push(sem1Avg);
          });
        } else if (selectedPeriod === 'sem2Avg') {
          // Calculate Semester 2 Average
          studentGrades.forEach((g: any) => {
            const sem2Avg = calculateSemesterAverage(g.period4, g.period5, g.period6, g.exam2);
            if (sem2Avg) values.push(sem2Avg);
          });
        } else if (selectedPeriod === 'finalAvg') {
          // Calculate Final Average
          studentGrades.forEach((g: any) => {
            const sem1Avg = calculateSemesterAverage(g.period1, g.period2, g.period3, g.exam1);
            const sem2Avg = calculateSemesterAverage(g.period4, g.period5, g.period6, g.exam2);
            const finalAvg = calculateFinalAverage(sem1Avg, sem2Avg);
            if (finalAvg) values.push(finalAvg);
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
          grade: student.students?.grade || '',
          section: student.students?.section || '',
          average: average,
          hasGrades: values.length > 0
        };
      }).filter(s => s.hasGrades && s.average >= 80); // Only students with 80%+

      honorStudentsByClass[gradeClass] = studentAverages.sort((a, b) => b.average - a.average);
    });

    // Categorize by honor level
    const highHonor: any[] = [];
    const honorRoll: any[] = [];
    const honorRollMention: any[] = [];

    Object.entries(honorStudentsByClass).forEach(([gradeClass, students]) => {
      students.forEach(student => {
        if (student.average >= 90) {
          highHonor.push({ ...student, class: gradeClass });
        } else if (student.average >= 85) {
          honorRoll.push({ ...student, class: gradeClass });
        } else if (student.average >= 80) {
          honorRollMention.push({ ...student, class: gradeClass });
        }
      });
    });

      return { highHonor, honorRoll, honorRollMention, byClass: honorStudentsByClass };
    } catch (error) {
      console.error('Error calculating honor roll:', error);
      return { highHonor: [], honorRoll: [], honorRollMention: [] };
    }
  };

  const printHonorRoll = async () => {
    const honorData = await calculateHonorRoll();
    const periodNames: Record<string, string> = {
      period1: '1st Period',
      period2: '2nd Period',
      period3: '3rd Period',
      exam1: 'Exam 1',
      period4: '4th Period',
      period5: '5th Period',
      period6: '6th Period',
      exam2: 'Exam 2',
      sem1Avg: 'Semester 1 Average',
      sem2Avg: 'Semester 2 Average',
      finalAvg: 'Final Average'
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Honor Roll - ${periodNames[selectedPeriod]}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #059669; margin-top: 30px; border-bottom: 2px solid #059669; padding-bottom: 5px; }
          h3 { color: #7c3aed; margin-top: 20px; }
          .school-name { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .period-name { text-align: center; font-size: 18px; color: #666; margin-bottom: 30px; }
          .honor-section { margin-bottom: 40px; page-break-inside: avoid; }
          .class-section { margin-left: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #d1d5db; }
          td { padding: 8px; border: 1px solid #e5e7eb; }
          .high-honor { background-color: #fef3c7; }
          .honor-roll { background-color: #dbeafe; }
          .honor-mention { background-color: #e9d5ff; }
          .no-data { text-align: center; color: #9ca3af; font-style: italic; padding: 20px; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
            .honor-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="school-name">St. Peter Claver Catholic High School</div>
        <h1>Honor Roll Report</h1>
        <div class="period-name">${periodNames[selectedPeriod]}</div>

        ${Object.entries(honorData.byClass || {}).map(([gradeClass, students]: [string, any]) => `
          <div class="honor-section">
            <h2>${gradeClass}</h2>
            ${students.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Average</th>
                    <th>Honor Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${students.map((student: any, index: number) => {
                    let honorLevel = '';
                    let rowClass = '';
                    if (student.average >= 90) {
                      honorLevel = 'High Honor';
                      rowClass = 'high-honor';
                    } else if (student.average >= 85) {
                      honorLevel = 'Honor Roll';
                      rowClass = 'honor-roll';
                    } else if (student.average >= 80) {
                      honorLevel = 'Honor Roll Mention';
                      rowClass = 'honor-mention';
                    }
                    return `
                      <tr class="${rowClass}">
                        <td>${index + 1}</td>
                        <td>${student.studentName}</td>
                        <td>${student.grade}${student.section ? ' - Section ' + student.section : ''}</td>
                        <td>${student.average.toFixed(2)}%</td>
                        <td><strong>${honorLevel}</strong></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">No students achieved honor roll status for this period</div>'}
          </div>
        `).join('')}

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-green-100 truncate">Welcome, {user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="ml-2 px-3 sm:px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-sm sm:text-base min-h-[44px] flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Navigation & Stats */}
          <aside className="lg:w-80 flex-shrink-0 space-y-4 sm:space-y-6">
            {/* Quick Actions Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <nav className="p-3 sm:p-4 space-y-2 grid grid-cols-2 lg:grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    toggleSection('createUser');
                    setUserType('student');
                  }}
                  className="w-full flex flex-col lg:flex-row items-center gap-2 lg:gap-3 px-3 sm:px-4 py-3 text-center lg:text-left text-gray-700 hover:bg-blue-50 rounded-lg transition group min-h-[48px]"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-medium text-xs sm:text-sm lg:text-base">Create Student</span>
                </button>

                <button
                  onClick={() => {
                    toggleSection('createUser');
                    setUserType('sponsor');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-green-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">Create Sponsor</span>
                </button>

                <button
                  onClick={() => toggleSection('periodRankings')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-purple-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-medium">View Rankings</span>
                </button>

                <button
                  onClick={() => {
                    toggleSection('periodRankings');
                    setRankingView('honor');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-yellow-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="font-medium">Honor Roll</span>
                </button>

                <button
                  onClick={() => {
                    setUserViewType('students');
                    toggleSection('allUsers');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-medium">View All Students</span>
                </button>

                <button
                  onClick={() => {
                    setUserViewType('sponsors');
                    toggleSection('allUsers');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-teal-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">View All Sponsors</span>
                </button>
              </nav>
            </div>

            {/* Security & Settings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Security & Settings</h2>
              </div>
              <nav className="p-4 space-y-2">
                {/* Maintenance Mode Toggle */}
                <button
                  onClick={handleToggleMaintenanceMode}
                  disabled={isTogglingMaintenance}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left rounded-lg transition group ${
                    maintenanceMode.is_enabled
                      ? 'bg-red-50 hover:bg-red-100 border-2 border-red-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition ${
                      maintenanceMode.is_enabled
                        ? 'bg-red-200'
                        : 'bg-gray-200'
                    }`}>
                      <svg className={`w-5 h-5 ${maintenanceMode.is_enabled ? 'text-red-700' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {maintenanceMode.is_enabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium block ${maintenanceMode.is_enabled ? 'text-red-800' : 'text-gray-700'}`}>
                        {maintenanceMode.is_enabled ? 'Maintenance Mode: ON' : 'Maintenance Mode: OFF'}
                      </span>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        {maintenanceMode.is_enabled ? 'Students cannot log in' : 'Click to block student access'}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    maintenanceMode.is_enabled
                      ? 'bg-red-200 text-red-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {maintenanceMode.is_enabled ? 'ACTIVE' : 'Inactive'}
                  </div>
                </button>

                <button
                  onClick={() => toggleSection('changePassword')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-orange-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <span className="font-medium">Change Password</span>
                </button>

                <button
                  onClick={() => {
                    toggleSection('auditTrail');
                    loadAuditLogs();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-red-50 rounded-lg transition group"
                >
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">View Audit Trail</span>
                </button>
              </nav>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {users.filter(u => u.role === 'student').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Sponsors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'sponsor').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Students Per Class Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Students Per Class</h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {/* 7th Grade with sections */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">7th Grade</span>
                      <span className="text-xl font-bold text-blue-600">
                        {users.filter(u => u.role === 'student' && u.students && u.students.grade === '7th Grade').length}
                      </span>
                    </div>
                    <div className="pl-4 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Section A:</span>
                        <span className="font-semibold text-blue-700">
                          {users.filter(u => u.role === 'student' && u.students && u.students.grade === '7th Grade' && u.students.section === 'A').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Section B:</span>
                        <span className="font-semibold text-blue-700">
                          {users.filter(u => u.role === 'student' && u.students && u.students.grade === '7th Grade' && u.students.section === 'B').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 8th Grade with sections */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">8th Grade</span>
                      <span className="text-xl font-bold text-blue-600">
                        {users.filter(u => u.role === 'student' && u.students && u.students.grade === '8th Grade').length}
                      </span>
                    </div>
                    <div className="pl-4 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Section A:</span>
                        <span className="font-semibold text-blue-700">
                          {users.filter(u => u.role === 'student' && u.students && u.students.grade === '8th Grade' && u.students.section === 'A').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Section B:</span>
                        <span className="font-semibold text-blue-700">
                          {users.filter(u => u.role === 'student' && u.students && u.students.grade === '8th Grade' && u.students.section === 'B').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Other grades without sections */}
                  {['9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(gradeClass => {
                    const studentCount = users.filter(u => u.role === 'student' && u.students && u.students.grade === gradeClass).length;
                    return (
                      <div key={gradeClass} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                        <span className="text-sm font-medium text-gray-700">{gradeClass}</span>
                        <span className="text-xl font-bold text-blue-600">{studentCount}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                    <span className="text-sm font-semibold text-gray-700">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {users.filter(u => u.role === 'student').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div className="flex-1 space-y-8">

        {/* Create User Section */}
        {showCreateUser && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowCreateUser(!showCreateUser)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Close
            </button>
          </div>

          {showCreateUser && (
            <div className="p-6 bg-gray-50">
              {!userType ? (
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => setUserType('student')}
                    className="bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Create Student
                  </button>
                  <button
                    onClick={() => setUserType('sponsor')}
                    className="bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Create Sponsor
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="max-w-2xl mx-auto space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Create {userType === 'student' ? 'Student' : 'Sponsor'} Account
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Enter full name"
                    />
                    {formData.name && (
                      <p className="mt-1 text-sm text-gray-500">
                        Auto-generated email: <span className="font-semibold">{generateEmail(formData.name)}</span>
                      </p>
                    )}
                  </div>

                  {userType === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => {
                          setFormData({ ...formData, grade: e.target.value, section: '' });
                        }}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select grade</option>
                        <option value="7th Grade">7th Grade</option>
                        <option value="8th Grade">8th Grade</option>
                        <option value="9th Grade">9th Grade</option>
                        <option value="10th Grade">10th Grade</option>
                        <option value="11th Grade">11th Grade</option>
                        <option value="12th Grade">12th Grade</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">Student ID will be auto-generated</p>
                    </div>
                  )}

                  {userType === 'student' && (formData.grade === '7th Grade' || formData.grade === '8th Grade') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    </div>
                  )}

                  {userType === 'sponsor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Grade Level</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => {
                          setFormData({ ...formData, grade: e.target.value, section: '' });
                        }}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select grade to sponsor</option>
                        <option value="7th Grade">7th Grade</option>
                        <option value="8th Grade">8th Grade</option>
                        <option value="9th Grade">9th Grade</option>
                        <option value="10th Grade">10th Grade</option>
                        <option value="11th Grade">11th Grade</option>
                        <option value="12th Grade">12th Grade</option>
                      </select>
                    </div>
                  )}

                  {userType === 'sponsor' && (formData.grade === '7th Grade' || formData.grade === '8th Grade') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className={`w-full px-4 py-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pr-10`}
                        placeholder="Create password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Must be 8+ characters with uppercase, lowercase, and number
                    </p>
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUserType(null);
                        setFormData({
                          password: '',
                          name: '',
                          role: 'student',
                          studentId: '',
                          grade: '',
                          section: '',
                        });
                      }}
                      disabled={isCreatingUser}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingUser ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
        )}

        {/* Period Rankings Section */}
        {showPeriodRankings && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Student Rankings & Honor Roll</h2>
            <button
              onClick={() => setShowPeriodRankings(!showPeriodRankings)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              {showPeriodRankings ? 'Hide' : 'View'} Rankings
            </button>
          </div>

          {showPeriodRankings && (
            <div className="p-6">
              {/* View Toggle Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setRankingView('all')}
                  className={`px-4 py-2 font-semibold transition ${
                    rankingView === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Rankings
                </button>
                <button
                  onClick={() => setRankingView('honor')}
                  className={`px-4 py-2 font-semibold transition ${
                    rankingView === 'honor'
                      ? 'text-yellow-600 border-b-2 border-yellow-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Honor Roll Only (80%+)
                </button>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    <optgroup label="Overall">
                      <option value="finalAvg">Final Average</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Grade</label>
                  <select
                    value={selectedGradeForRanking}
                    onChange={(e) => setSelectedGradeForRanking(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">All Grades</option>
                    {getAvailableGrades().map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                    <option value="7th Grade - A">7th Grade - Section A</option>
                    <option value="7th Grade - B">7th Grade - Section B</option>
                    <option value="8th Grade - A">8th Grade - Section A</option>
                    <option value="8th Grade - B">8th Grade - Section B</option>
                  </select>
                </div>

                {rankingView === 'honor' && (
                  <div className="flex items-end">
                    <button
                      onClick={printHonorRoll}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Honor Roll
                    </button>
                  </div>
                )}
              </div>

              {/* Honor Roll Summary (only in honor view) */}
              {rankingView === 'honor' && (() => {
                const highHonor = periodRankings.filter(s => s.average >= 90);
                const honorRoll = periodRankings.filter(s => s.average >= 85 && s.average < 90);
                const honorMention = periodRankings.filter(s => s.average >= 80 && s.average < 85);

                return periodRankings.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-yellow-900 mb-1">High Honor</h3>
                      <p className="text-2xl font-bold text-yellow-700">{highHonor.length}</p>
                      <p className="text-xs text-yellow-600">90% and above</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Honor Roll</h3>
                      <p className="text-2xl font-bold text-blue-700">{honorRoll.length}</p>
                      <p className="text-xs text-blue-600">85% - 89.9%</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-purple-900 mb-1">Honor Roll Mention</h3>
                      <p className="text-2xl font-bold text-purple-700">{honorMention.length}</p>
                      <p className="text-xs text-purple-600">80% - 84.9%</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Rankings Table */}
              {(() => {
                const periodNames: Record<string, string> = {
                  period1: '1st Period',
                  period2: '2nd Period',
                  period3: '3rd Period',
                  exam1: 'Exam 1',
                  period4: '4th Period',
                  period5: '5th Period',
                  period6: '6th Period',
                  exam2: 'Exam 2',
                  sem1Avg: 'Semester 1 Average',
                  sem2Avg: 'Semester 2 Average',
                  finalAvg: 'Final Average'
                };

                return periodRankings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {periodNames[selectedPeriod]} Rankings
                        {selectedGradeForRanking !== 'all' && ` - ${selectedGradeForRanking}`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Showing {periodRankings.length} student{periodRankings.length !== 1 ? 's' : ''} with grades
                      </p>
                    </div>
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                          {rankingView === 'honor' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Honor Level</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {periodRankings.map((student, index) => {
                          let honorLevel = '';
                          let badgeClass = '';
                          let rowClass = '';
                          if (rankingView === 'honor') {
                            if (student.average >= 90) {
                              honorLevel = 'High Honor';
                              badgeClass = 'bg-yellow-100 text-yellow-800';
                              rowClass = 'bg-yellow-50';
                            } else if (student.average >= 85) {
                              honorLevel = 'Honor Roll';
                              badgeClass = 'bg-blue-100 text-blue-800';
                              rowClass = 'bg-blue-50';
                            } else if (student.average >= 80) {
                              honorLevel = 'Honor Roll Mention';
                              badgeClass = 'bg-purple-100 text-purple-800';
                              rowClass = 'bg-purple-50';
                            }
                          } else {
                            rowClass = index < 3 ? 'bg-yellow-50' : '';
                          }

                          return (
                            <tr key={student.studentId} className={rowClass}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {index === 0 && (
                                    <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                  {index === 1 && (
                                    <svg className="w-6 h-6 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                  {index === 2 && (
                                    <svg className="w-6 h-6 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                  <span className={`text-lg font-semibold ${index < 3 ? 'text-gray-900' : 'text-gray-600'}`}>
                                    #{index + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {student.grade}{student.section ? ` - Section ${student.section}` : ''}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-green-600">{student.average.toFixed(2)}%</div>
                              </td>
                              {rankingView === 'honor' && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                                    {honorLevel}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No grades available for {periodNames[selectedPeriod]}
                    {selectedGradeForRanking !== 'all' && ` in ${selectedGradeForRanking}`}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        )}

        {/* Users List */}
        {showAllUsers && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {userViewType === 'students' ? 'All Students' : 'All Sponsors'}
            </h2>
            <button
              onClick={() => setShowAllUsers(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Close
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Grade:</label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="all">All Grades</option>
                    {getAvailableGrades().map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                {filterGrade !== 'all' && (
                  <button
                    onClick={() => {
                      setFilterGrade('all');
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Filter Summary */}
            {filterGrade !== 'all' && (
              <div className="mt-3 text-sm text-gray-600">
                Showing <span className="font-semibold text-green-600">{getFilteredUsers().length}</span> of {users.filter(u => u.role === (userViewType === 'students' ? 'student' : 'sponsor')).length} {userViewType}
              </div>
            )}
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Role</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Details</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredUsers().map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {user.role === 'student' && user.students
                        ? `${user.students.student_id} - ${user.students.grade}${user.students.section ? ` (${user.students.section})` : ''}`
                        : user.role === 'sponsor' && user.sponsors
                        ? `${user.sponsors.grade}${user.sponsors.section ? ` (${user.sponsors.section})` : ''}`
                        : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm space-x-2 sm:space-x-3">
                      <button
                        onClick={() => handleResetPassword(user.id, user.name, user.role)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {getFilteredUsers().length === 0 && users.length > 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users match the current filters. Try adjusting your filter criteria.
                    </td>
                  </tr>
                )}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users created yet. Create your first user above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
        )}

          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Are you sure you want to delete <span className="font-semibold break-words">{deleteConfirm.userName}</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-sm sm:text-base min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm sm:text-base min-h-[48px]"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md mx-4">
            {!resetPasswordResult ? (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reset Password</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      For: <span className="font-semibold break-words">{resetPasswordModal.userName}</span> ({resetPasswordModal.userRole})
                    </p>
                    {resetPasswordModal.userRole === 'student' ? (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-800">
                          <strong>⚠️ WARNING:</strong> Resetting a student's password will <strong>DELETE ALL THEIR GRADES</strong>! This action cannot be undone. Only proceed if you're sure.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <strong>ℹ️ Note:</strong> This will delete and recreate the {resetPasswordModal.userRole} account with a new temporary password. All data will be preserved.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    onClick={() => setResetPasswordModal(null)}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-sm sm:text-base min-h-[48px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResetPassword}
                    disabled={isResettingPassword}
                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-white rounded-lg transition font-semibold text-sm sm:text-base min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      resetPasswordModal.userRole === 'student' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isResettingPassword ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      resetPasswordModal.userRole === 'student' ? 'Reset & Delete Grades' : 'Reset Password'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Password Reset Successful!</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    New temporary password for <strong>{resetPasswordResult.name}</strong>
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-mono font-semibold text-gray-900 break-all">{resetPasswordResult.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Temporary Password:</span>
                      <p className="font-mono font-bold text-lg text-blue-600 bg-white px-3 py-2 rounded border border-blue-200 break-all">
                        {resetPasswordResult.password}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <p className="font-semibold text-gray-900 capitalize">{resetPasswordResult.role}</p>
                    </div>
                  </div>
                </div>

                {resetPasswordResult.role === 'student' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-800">
                      <strong>⚠️ Important:</strong> All grades for this student have been deleted. They will need to have their grades re-entered.
                    </p>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <strong>📋 Copy this password now!</strong> You won't be able to see it again. Share it securely with the user.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setResetPasswordModal(null);
                    setResetPasswordResult(null);
                  }}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold min-h-[48px]"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Audit Trail - Grade Changes & System Actions</h3>
              <button
                onClick={() => setShowAuditTrail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            log.action === 'ADD_GRADES' || log.action === 'CREATE_USER' ? 'bg-green-100 text-green-800' :
                            log.action === 'UPDATE_GRADES' || log.action === 'RESET_PASSWORD' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'DELETE_USER' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{log.user}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {log.action === 'ADD_GRADES' || log.action === 'UPDATE_GRADES' ? (
                          <div className="space-y-2">
                            <p><strong>Student:</strong> {log.details.studentName}</p>
                            <p><strong>Class:</strong> {log.details.studentGrade}{log.details.studentSection ? ` Section ${log.details.studentSection}` : ''}</p>
                            <p><strong>Subjects Updated:</strong> {log.details.subjectCount}</p>
                            <p><strong>Subjects:</strong> {log.details.subjects?.join(', ')}</p>

                            {log.details.gradeChanges && log.details.gradeChanges.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 p-3 rounded">
                                <p className="font-semibold text-red-800 mb-2">⚠️ Grade Modifications Detected:</p>
                                {log.details.gradeChanges.map((change: any, idx: number) => (
                                  <div key={idx} className="mb-3 bg-white p-2 rounded border border-red-200">
                                    <p className="font-medium text-gray-900">{change.subject}:</p>
                                    {Object.entries(change.changes).map(([field, values]: [string, any]) => (
                                      <div key={field} className="ml-4 text-xs">
                                        <span className="text-gray-600">{field}:</span>
                                        <span className="text-red-600 line-through ml-1">{values.old}</span>
                                        <span className="mx-1">→</span>
                                        <span className="text-green-600 font-semibold">{values.new}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : log.action === 'CREATE_USER' ? (
                          <div>
                            <p><strong>New User:</strong> {log.details.newUserName} ({log.details.newUserRole})</p>
                            <p><strong>Email:</strong> {log.details.newUserEmail}</p>
                          </div>
                        ) : log.action === 'DELETE_USER' ? (
                          <div>
                            <p><strong>Deleted User:</strong> {log.details.deletedUserName}</p>
                          </div>
                        ) : log.action === 'RESET_PASSWORD' ? (
                          <div>
                            <p><strong>Password Reset For:</strong> {log.details.targetUserName}</p>
                          </div>
                        ) : (
                          <p>{JSON.stringify(log.details)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No audit logs available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
