import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
}

interface Teacher extends User {
  role: 'teacher';
  subject: string;
}

interface Grade {
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

interface TeacherDashboardProps {
  user: Teacher;
  onLogout: () => void;
}

export default function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGrade, setNewGrade] = useState({
    studentName: '',
    subject: user.subject,
    score: '',
    maxScore: '100',
    term: 'Q1',
    comments: '',
  });

  useEffect(() => {
    // Fetch grades from API (mock data for now)
    const fetchGrades = async () => {
      setIsLoading(true);

      // Mock data - replace with actual API call later
      const mockGrades: Grade[] = [
        {
          id: '1',
          studentId: 's1',
          studentName: 'John Doe',
          subject: user.subject,
          score: 85,
          maxScore: 100,
          term: 'Q1',
          date: '2024-01-15',
          teacherId: user.id,
          teacherName: user.name,
          comments: 'Good performance',
        },
        {
          id: '2',
          studentId: 's2',
          studentName: 'Jane Smith',
          subject: user.subject,
          score: 92,
          maxScore: 100,
          term: 'Q1',
          date: '2024-01-16',
          teacherId: user.id,
          teacherName: user.name,
          comments: 'Excellent work',
        },
        {
          id: '3',
          studentId: 's3',
          studentName: 'Mike Johnson',
          subject: user.subject,
          score: 78,
          maxScore: 100,
          term: 'Q1',
          date: '2024-01-17',
          teacherId: user.id,
          teacherName: user.name,
        },
      ];

      setTimeout(() => {
        setGrades(mockGrades);
        setIsLoading(false);
      }, 500);
    };

    fetchGrades();
  }, [user.id, user.name, user.subject]);

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();

    const grade: Grade = {
      id: Date.now().toString(),
      studentId: 's' + Date.now(),
      studentName: newGrade.studentName,
      subject: newGrade.subject,
      score: parseFloat(newGrade.score),
      maxScore: parseFloat(newGrade.maxScore),
      term: newGrade.term,
      date: new Date().toISOString().split('T')[0],
      teacherId: user.id,
      teacherName: user.name,
      comments: newGrade.comments,
    };

    setGrades([grade, ...grades]);
    setShowAddModal(false);
    setNewGrade({
      studentName: '',
      subject: user.subject,
      score: '',
      maxScore: '100',
      term: 'Q1',
      comments: '',
    });
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name} - {user.subject}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Subject</p>
              <p className="text-2xl font-bold text-gray-900">{user.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Class Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {grades.length > 0
                  ? (
                      grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
                      grades.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Grades Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Student Grades</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add Grade
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-600">Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No grades added yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Term
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => {
                    const percentage = (grade.score / grade.maxScore) * 100;
                    return (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {grade.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grade.score}/{grade.maxScore}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGradeColor(percentage)}`}>
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {grade.term}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(grade.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {grade.comments || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Grade</h3>
            <form onSubmit={handleAddGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={newGrade.studentName}
                  onChange={(e) => setNewGrade({ ...newGrade, studentName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter student name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newGrade.subject}
                  onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                  <input
                    type="number"
                    value={newGrade.score}
                    onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={newGrade.maxScore}
                    onChange={(e) => setNewGrade({ ...newGrade, maxScore: e.target.value })}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select
                  value={newGrade.term}
                  onChange={(e) => setNewGrade({ ...newGrade, term: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Q1">Quarter 1</option>
                  <option value="Q2">Quarter 2</option>
                  <option value="Q3">Quarter 3</option>
                  <option value="Q4">Quarter 4</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  value={newGrade.comments}
                  onChange={(e) => setNewGrade({ ...newGrade, comments: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
