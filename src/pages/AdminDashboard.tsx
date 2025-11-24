import { useState } from 'react';
import Notification from '../components/Notification';

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
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userType, setUserType] = useState<'student' | 'sponsor' | null>(null);
  const [formData, setFormData] = useState<NewUserForm>({
    password: '',
    name: '',
    role: 'student',
    studentId: '',
    grade: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);

  // Load users from localStorage
  const loadUsers = () => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  };

  useState(() => {
    loadUsers();
  });

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

  const generateStudentId = () => {
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const students = users.filter((u: any) => u.role === 'student');

    // Find the highest student ID number
    let maxId = 0;
    students.forEach((student: any) => {
      if (student.studentId) {
        const numPart = parseInt(student.studentId.replace('STU', ''));
        if (!isNaN(numPart) && numPart > maxId) {
          maxId = numPart;
        }
      }
    });

    // Generate next ID
    const nextId = maxId + 1;
    return `STU${nextId.toString().padStart(4, '0')}`;
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      showNotification(passwordValidation.message, 'error');
      return;
    }
    setPasswordError('');

    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    // Auto-generate email
    const autoEmail = generateEmail(formData.name);

    // Check if email already exists
    if (users.find((u: any) => u.email === autoEmail)) {
      showNotification('Email already exists!', 'error');
      return;
    }

    // Check for duplicate sponsor assignment
    if (userType === 'sponsor') {
      const existingSponsor = users.find((u: any) =>
        u.role === 'sponsor' && u.grade === formData.grade
      );
      if (existingSponsor) {
        showNotification(`A sponsor is already assigned to ${formData.grade}: ${existingSponsor.name}`, 'error');
        return;
      }
    }

    // Auto-generate student ID for students
    const studentId = userType === 'student' ? generateStudentId() : undefined;

    const newUser = {
      id: Date.now().toString(),
      email: autoEmail,
      password: formData.password,
      name: formData.name,
      role: userType,
      ...(userType === 'student' ? {
        studentId: studentId,
        grade: formData.grade,
      } : {
        grade: formData.grade,
      }),
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Log the change
    const changeLog = JSON.parse(localStorage.getItem('changeLog') || '[]');
    changeLog.push({
      timestamp: new Date().toISOString(),
      user: user.name,
      userId: user.id,
      action: 'CREATE_USER',
      details: {
        newUserId: newUser.id,
        newUserName: newUser.name,
        newUserRole: newUser.role,
        newUserEmail: newUser.email,
      },
    });
    localStorage.setItem('changeLog', JSON.stringify(changeLog));

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
    });
    setUserType(null);
    setShowCreateUser(false);
    loadUsers();
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteConfirm({ userId, userName });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;

    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const filteredUsers = users.filter((u: any) => u.id !== deleteConfirm.userId);
    localStorage.setItem('users', JSON.stringify(filteredUsers));

    // Log the change
    const changeLog = JSON.parse(localStorage.getItem('changeLog') || '[]');
    changeLog.push({
      timestamp: new Date().toISOString(),
      user: user.name,
      userId: user.id,
      action: 'DELETE_USER',
      details: {
        deletedUserId: deleteConfirm.userId,
        deletedUserName: deleteConfirm.userName,
      },
    });
    localStorage.setItem('changeLog', JSON.stringify(changeLog));

    showNotification('User deleted successfully!', 'success');
    setDeleteConfirm(null);
    loadUsers();
  };

  const handleResetPassword = (userId: string, userName: string) => {
    const newPassword = prompt(`Enter new password for ${userName}:`);
    if (!newPassword) return;

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      showNotification(passwordValidation.message, 'error');
      return;
    }

    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const updatedUsers = users.map((u: any) =>
      u.id === userId ? { ...u, password: newPassword } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Log the change
    const changeLog = JSON.parse(localStorage.getItem('changeLog') || '[]');
    changeLog.push({
      timestamp: new Date().toISOString(),
      user: user.name,
      userId: user.id,
      action: 'RESET_PASSWORD',
      details: {
        targetUserId: userId,
        targetUserName: userName,
      },
    });
    localStorage.setItem('changeLog', JSON.stringify(changeLog));

    showNotification(`Password reset successfully for ${userName}!`, 'success');
    loadUsers();
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
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-green-100">Welcome, {user.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
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

        {/* Create User Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowCreateUser(!showCreateUser)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              {showCreateUser ? 'Cancel' : '+ Create New User'}
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
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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

                  {userType === 'sponsor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Grade Level</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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
                          email: '',
                          password: '',
                          name: '',
                          role: 'student',
                          studentId: '',
                          grade: '',
                          assignedGrade: '',
                        });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.role === 'student' ? `${user.studentId} - ${user.grade}` : user.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleResetPassword(user.id, user.name)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Reset Password
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
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete <span className="font-semibold">{deleteConfirm.userName}</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
