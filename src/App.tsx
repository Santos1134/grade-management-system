import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { authService } from './services/auth.service';
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
  section?: string;
}

interface Sponsor extends User {
  role: 'sponsor';
  grade: string;
  section?: string;
}

interface Admin extends User {
  role: 'admin';
}

interface LoginCredentials {
  email: string;
  password: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserProfile();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const session = await authService.getSession();
      if (session) {
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result && result.profile) {
        const profile = result.profile;

        // Determine user type based on profile data
        if (profile.role === 'admin') {
          const admin: Admin = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: 'admin',
          };
          setCurrentUser(admin);
        } else if (profile.role === 'sponsor' && profile.sponsors && profile.sponsors.length > 0) {
          const sponsorData = profile.sponsors[0];
          const sponsor: Sponsor = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: 'sponsor',
            grade: sponsorData.grade,
            section: sponsorData.section,
          };
          setCurrentUser(sponsor);
        } else if (profile.role === 'student' && profile.students && profile.students.length > 0) {
          const studentData = profile.students[0];
          const student: Student = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: 'student',
            studentId: studentData.student_id,
            grade: studentData.grade,
            section: studentData.section,
          };
          setCurrentUser(student);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const { user, profile } = await authService.signIn(credentials);

      // Load user profile after successful login
      await loadUserProfile();
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed! Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on current user state
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
