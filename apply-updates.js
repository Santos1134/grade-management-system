// Run this script in your browser console while on http://localhost:5178
// This will migrate the data structure from assignedGrade to grade for sponsors

console.log('Starting data migration...');

// 1. Migrate users data
const users = JSON.parse(localStorage.getItem('users') || '[]');
const updatedUsers = users.map(u => {
  if (u.role === 'sponsor') {
    // If using old assignedGrade field, migrate to grade
    if (u.assignedGrade && !u.grade) {
      const { assignedGrade, ...rest } = u;
      return { ...rest, grade: assignedGrade };
    }
  }
  return u;
});
localStorage.setItem('users', JSON.stringify(updatedUsers));
console.log('✓ Users migrated:', updatedUsers.filter(u => u.role === 'sponsor'));

// 2. Initialize change log if not exists
if (!localStorage.getItem('changeLog')) {
  localStorage.setItem('changeLog', JSON.stringify([]));
  console.log('✓ Change log initialized');
}

// 3. Add academic year if not exists
if (!localStorage.getItem('academicYear')) {
  localStorage.setItem('academicYear', '2024-2025');
  console.log('✓ Academic year set to 2024-2025');
}

console.log('Migration complete! Refresh the page.');
console.log('\nNext steps:');
console.log('1. The files have been updated with all requested features');
console.log('2. Refresh your browser to see the changes');
console.log('3. Test login with existing sponsor accounts');
