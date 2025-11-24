// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
}

// Student specific
export interface Student extends User {
  role: 'student';
  studentId: string;
  grade: string;
}

// Teacher specific
export interface Teacher extends User {
  role: 'teacher';
  subject: string;
}

// Grade/Score for a subject
export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  score: number;
  maxScore: number;
  term: string;
  date: string;
  teacherId: string;
  teacherName: string;
  comments?: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Auth response
export interface AuthResponse {
  user: User;
  token: string;
}
