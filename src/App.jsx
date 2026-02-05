/**
 * Extra-Curricular Activity Module - Main App
 * 
 * Development Mode: Easy role switching for testing
 */

import { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import StudentDashboard from './components/student/StudentDashboard';
import CoachDashboard from './components/coach/CoachDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ProfilePage from './components/common/ProfilePage';
import CalendarView from './components/common/CalendarView';

function App() {
  // Available coaches in the system
  const availableCoaches = [
    { id: 2, name: 'John Smith', email: 'john.smith@school.edu' },
    { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@school.edu' },
    { id: 4, name: 'Mike Davis', email: 'mike.davis@school.edu' },
    { id: 5, name: 'Emily Brown', email: 'emily.brown@school.edu' }
  ];

  // Available students in the system
  const availableStudents = [
    { id: 1001, name: 'Alice Wilson', email: 'alice.wilson@school.edu' },
    { id: 1002, name: 'Bob Johnson', email: 'bob.johnson@school.edu' },
    { id: 1003, name: 'Charlie Brown', email: 'charlie.brown@school.edu' },
    { id: 1004, name: 'Diana Miller', email: 'diana.miller@school.edu' },
    { id: 1005, name: 'Evan Taylor', email: 'evan.taylor@school.edu' }
  ];

  // Initialize user from localStorage or use default
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    return {
      id: 1001,
      name: 'Test Student',
      email: 'student@school.edu',
      role: 'student'
    };
  });

  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('currentView') || 'dashboard';
  });

  // Load saved role and coach on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('devRole');
    const savedCoachId = localStorage.getItem('selectedCoachId');
    const storedUser = localStorage.getItem('user');
    
    // Only apply role change if there's no stored user data or if explicitly needed
    if (savedRole && !storedUser) {
      handleRoleChange(savedRole, savedCoachId);
    }
  }, []);

  const handleRoleChange = (newRole, coachId = null, studentId = null) => {
    let roleData;
    
    if (newRole === 'teacher') {
      const coach = coachId 
        ? availableCoaches.find(c => c.id === parseInt(coachId)) || availableCoaches[0]
        : availableCoaches[0];
      roleData = { ...coach };
    } else if (newRole === 'student') {
      const student = studentId
        ? availableStudents.find(s => s.id === parseInt(studentId)) || availableStudents[0]
        : availableStudents[0];
      roleData = { ...student };
    } else {
      const defaultRoles = {
        admin: { id: 1, name: 'Admin User', email: 'admin@school.edu' }
      };
      roleData = defaultRoles[newRole];
    }
    
    const newUser = {
      ...roleData,
      role: newRole
    };
    
    setUser(newUser);
    
    setCurrentView('dashboard');
    localStorage.setItem('currentView', 'dashboard');
    localStorage.setItem('devRole', newRole);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleCoachChange = (coachId) => {
    const coach = availableCoaches.find(c => c.id === parseInt(coachId));
    if (coach) {
      const newUser = {
        ...coach,
        role: 'teacher'
      };
      setUser(newUser);
      localStorage.setItem('selectedCoachId', coachId);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const handleStudentChange = (studentId) => {
    const student = availableStudents.find(s => s.id === parseInt(studentId));
    if (student) {
      const newUser = {
        ...student,
        role: 'student'
      };
      setUser(newUser);
      localStorage.setItem('selectedStudentId', studentId);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    localStorage.setItem('currentView', view);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    // Update localStorage if user data is stored there
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Render content based on current view
  const renderContent = () => {
    if (currentView === 'profile') {
      return <ProfilePage user={user} onUpdateUser={handleUpdateUser} />;
    }
    if (currentView === 'calendar') {
      return <CalendarView />;
    }

    // Default: render dashboard based on role
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <CoachDashboard coachName={user.name} />;
      case 'student':
        return <StudentDashboard studentId={user.id} studentName={user.name} />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unknown Role</h2>
            <p className="text-gray-600">Please select a valid role</p>
          </div>
        );
    }
  };

  return (
    <Layout 
      user={user} 
      onRoleChange={handleRoleChange}
      onCoachChange={handleCoachChange}
      availableCoaches={availableCoaches}
      onStudentChange={handleStudentChange}
      availableStudents={availableStudents}
      onNavigate={handleNavigate}
      currentView={currentView}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
