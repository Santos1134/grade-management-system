import { useState, useEffect } from 'react';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import AdminDashboard from './pages/AdminDashboard';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'sponsor' | 'admin';
}

interface Student extends User {
  role: 'student';
  studentId: string;
  grade: string;
}

interface Sponsor extends User {
  role: 'sponsor';
  grade: string;
}

interface Admin extends User {
  role: 'admin';
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'sponsor';
  studentId?: string;
  grade?: string;
  assignedGrade?: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize demo data on first load
  useEffect(() => {
    const hasInitialized = localStorage.getItem('demoDataInitialized');

    if (!hasInitialized) {
      // Demo Users
      const demoUsers = [
        // 10th Grade Students
        {
          id: 'demo-s1',
          email: 'john.doe@school.com',
          password: 'password123',
          name: 'John Doe',
          role: 'student',
          studentId: 'STU0001',
          grade: '10th Grade',
        },
        {
          id: 'demo-s2',
          email: 'jane.smith@school.com',
          password: 'password123',
          name: 'Jane Smith',
          role: 'student',
          studentId: 'STU0002',
          grade: '10th Grade',
        },
        {
          id: 'demo-s3',
          email: 'michael.brown@school.com',
          password: 'password123',
          name: 'Michael Brown',
          role: 'student',
          studentId: 'STU0003',
          grade: '10th Grade',
        },
        {
          id: 'demo-s4',
          email: 'sarah.johnson@school.com',
          password: 'password123',
          name: 'Sarah Johnson',
          role: 'student',
          studentId: 'STU0004',
          grade: '10th Grade',
        },
        {
          id: 'demo-s5',
          email: 'david.williams@school.com',
          password: 'password123',
          name: 'David Williams',
          role: 'student',
          studentId: 'STU0005',
          grade: '10th Grade',
        },
        // 9th Grade Students
        {
          id: 'demo-s6',
          email: 'emily.davis@school.com',
          password: 'password123',
          name: 'Emily Davis',
          role: 'student',
          studentId: 'STU0006',
          grade: '9th Grade',
        },
        {
          id: 'demo-s7',
          email: 'james.wilson@school.com',
          password: 'password123',
          name: 'James Wilson',
          role: 'student',
          studentId: 'STU0007',
          grade: '9th Grade',
        },
        // Sponsors
        {
          id: 'demo-sp1',
          email: 'sponsor10@school.com',
          password: 'password123',
          name: 'Mrs. Johnson',
          role: 'sponsor',
          grade: '10th Grade',
        },
        {
          id: 'demo-sp2',
          email: 'sponsor9@school.com',
          password: 'password123',
          name: 'Mr. Anderson',
          role: 'sponsor',
          grade: '9th Grade',
        },
      ];

      // Demo Grades for 10th Grade Students
      const demoGrades = [
        // John Doe - Mathematics
        {
          id: 'grade1',
          studentId: 'demo-s1',
          studentName: 'John Doe',
          subject: 'Geometry',
          period1: 85,
          period2: 88,
          period3: 90,
          exam1: 87,
          sem1Av: 87.5,
          period4: 89,
          period5: 91,
          period6: 93,
          exam2: 90,
          sem2Av: 90.75,
          finalAverage: 89.13,
        },
        {
          id: 'grade2',
          studentId: 'demo-s1',
          studentName: 'John Doe',
          subject: 'English',
          period1: 78,
          period2: 82,
          period3: 85,
          exam1: 80,
          sem1Av: 81.25,
          period4: 83,
          period5: 86,
          period6: 88,
          exam2: 85,
          sem2Av: 85.5,
          finalAverage: 83.38,
        },
        {
          id: 'grade3',
          studentId: 'demo-s1',
          studentName: 'John Doe',
          subject: 'History',
          period1: 90,
          period2: 92,
          period3: 88,
          exam1: 91,
          sem1Av: 90.25,
          period4: 89,
          period5: 93,
          period6: 91,
          exam2: 92,
          sem2Av: 91.25,
          finalAverage: 90.75,
        },
        // Jane Smith - Top Student
        {
          id: 'grade4',
          studentId: 'demo-s2',
          studentName: 'Jane Smith',
          subject: 'Geometry',
          period1: 95,
          period2: 96,
          period3: 97,
          exam1: 96,
          sem1Av: 96,
          period4: 96,
          period5: 97,
          period6: 98,
          exam2: 97,
          sem2Av: 97,
          finalAverage: 96.5,
        },
        {
          id: 'grade5',
          studentId: 'demo-s2',
          studentName: 'Jane Smith',
          subject: 'English',
          period1: 92,
          period2: 94,
          period3: 95,
          exam1: 93,
          sem1Av: 93.5,
          period4: 94,
          period5: 96,
          period6: 97,
          exam2: 95,
          sem2Av: 95.5,
          finalAverage: 94.5,
        },
        {
          id: 'grade6',
          studentId: 'demo-s2',
          studentName: 'Jane Smith',
          subject: 'History',
          period1: 94,
          period2: 95,
          period3: 96,
          exam1: 95,
          sem1Av: 95,
          period4: 96,
          period5: 97,
          period6: 98,
          exam2: 97,
          sem2Av: 97,
          finalAverage: 96,
        },
        // Michael Brown
        {
          id: 'grade7',
          studentId: 'demo-s3',
          studentName: 'Michael Brown',
          subject: 'Geometry',
          period1: 75,
          period2: 78,
          period3: 80,
          exam1: 77,
          sem1Av: 77.5,
          period4: 79,
          period5: 82,
          period6: 84,
          exam2: 81,
          sem2Av: 81.5,
          finalAverage: 79.5,
        },
        {
          id: 'grade8',
          studentId: 'demo-s3',
          studentName: 'Michael Brown',
          subject: 'English',
          period1: 80,
          period2: 82,
          period3: 84,
          exam1: 81,
          sem1Av: 81.75,
          period4: 83,
          period5: 85,
          period6: 87,
          exam2: 84,
          sem2Av: 84.75,
          finalAverage: 83.25,
        },
        // Emily Davis - 9th Grade
        {
          id: 'grade9',
          studentId: 'demo-s6',
          studentName: 'Emily Davis',
          subject: 'Mathematics',
          period1: 88,
          period2: 90,
          period3: 92,
          exam1: 89,
          sem1Av: 89.75,
          period4: 91,
          period5: 93,
          period6: 94,
          exam2: 92,
          sem2Av: 92.5,
          finalAverage: 91.13,
        },
        {
          id: 'grade10',
          studentId: 'demo-s6',
          studentName: 'Emily Davis',
          subject: 'English',
          period1: 85,
          period2: 87,
          period3: 89,
          exam1: 86,
          sem1Av: 86.75,
          period4: 88,
          period5: 90,
          period6: 91,
          exam2: 89,
          sem2Av: 89.5,
          finalAverage: 88.13,
        },
      ];

      localStorage.setItem('users', JSON.stringify(demoUsers));
      localStorage.setItem('grades', JSON.stringify(demoGrades));
      localStorage.setItem('demoDataInitialized', 'true');

      console.log('Demo data initialized!');
      console.log('Demo Students:', demoUsers.filter(u => u.role === 'student'));
      console.log('Demo Sponsors:', demoUsers.filter(u => u.role === 'sponsor'));
      console.log('Demo Grades:', demoGrades.length);
    }
  }, []);

  // Get users from localStorage
  const getStoredUsers = (): StoredUser[] => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    console.log('Login attempt:', credentials);

    // Check for admin login
    if (credentials.email === 'admin@school.com' && credentials.password === 'admin123') {
      const admin: Admin = {
        id: 'admin1',
        email: credentials.email,
        name: 'School Administrator',
        role: 'admin',
      };
      setCurrentUser(admin);
      return;
    }

    const users = getStoredUsers();

    // Check stored users first
    const storedUser = users.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (storedUser) {
      if (storedUser.role === 'student') {
        const student: Student = {
          id: storedUser.id,
          email: storedUser.email,
          name: storedUser.name,
          role: 'student',
          studentId: storedUser.studentId!,
          grade: storedUser.grade!,
        };
        setCurrentUser(student);
      } else {
        const sponsor: Sponsor = {
          id: storedUser.id,
          email: storedUser.email,
          name: storedUser.name,
          role: 'sponsor',
          grade: storedUser.grade || storedUser.assignedGrade!,
        };
        setCurrentUser(sponsor);
      }
      return;
    }

    // Fallback to demo accounts
    if (credentials.email === 'student@school.com' && credentials.password === 'password123') {
      const student: Student = {
        id: 's1',
        email: credentials.email,
        name: 'John Doe',
        role: 'student',
        studentId: 'STU001',
        grade: '10th Grade',
      };
      setCurrentUser(student);
    } else if (credentials.email === 'sponsor@school.com' && credentials.password === 'password123') {
      const sponsor: Sponsor = {
        id: 'sp1',
        email: credentials.email,
        name: 'Mrs. Johnson',
        role: 'sponsor',
        grade: '10th Grade',
      };
      setCurrentUser(sponsor);
    } else {
      alert('Invalid credentials! Please check your email and password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Render based on current state
  if (currentUser) {
    if (currentUser.role === 'student') {
      return <StudentDashboard user={currentUser as Student} onLogout={handleLogout} />;
    }
    if (currentUser.role === 'sponsor') {
      return <SponsorDashboard user={currentUser as Sponsor} onLogout={handleLogout} />;
    }
    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser as Admin} onLogout={handleLogout} />;
    }
  }

  return <Login onLogin={handleLogin} />;
}

export default App;
