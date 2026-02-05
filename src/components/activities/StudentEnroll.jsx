/**
 * StudentEnroll Component
 * 
 * Shows a student's enrolled activities and allows withdrawals
 * Integration note: Get studentId from authentication context when merging
 */

import { useState, useEffect } from 'react';
import { getStudentEnrollments, withdrawEnrollment } from '../../services/api';
import { useToast } from '../common/ToastContainer';
import ConfirmDialog from '../common/ConfirmDialog';

const StudentEnroll = ({ studentId = 1001 }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, data: null });
  const toast = useToast();

  useEffect(() => {
    fetchEnrollments();
  }, [studentId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudentEnrollments(studentId);
      setEnrollments(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (enrollmentId, activityName) => {
    setConfirmDialog({
      isOpen: true,
      data: { enrollmentId, activityName }
    });
  };

  const confirmWithdraw = async () => {
    const { enrollmentId, activityName } = confirmDialog.data;
    setConfirmDialog({ isOpen: false, data: null });

    try {
      setWithdrawing(enrollmentId);
      await withdrawEnrollment(enrollmentId);
      toast.success(`Successfully withdrawn from ${activityName}`);
      fetchEnrollments();
    } catch (err) {
      toast.error(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading your enrollments...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">Error: {error}</p>
          <button 
            onClick={fetchEnrollments}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Separate active and withdrawn enrollments
  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const withdrawnEnrollments = enrollments.filter((e) => e.status === 'withdrawn');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900">My Extra-Curricular Activities</h2>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">Student ID: {studentId}</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
              {activeEnrollments.length} Active Enrollment{activeEnrollments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {activeEnrollments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600 mb-2">You are not enrolled in any activities yet.</p>
          <p className="text-gray-500">Browse available activities to get started!</p>
        </div>
      ) : (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Active Enrollments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeEnrollments.map((enrollment) => (
              <div key={enrollment.enrollment_id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{enrollment.activity_name}</h4>
                      <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">{enrollment.category}</span>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Active</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {enrollment.coach_name && (
                      <p className="text-sm text-gray-700">
                        <strong className="font-semibold">Coach:</strong> {enrollment.coach_name}
                      </p>
                    )}
                    {enrollment.schedule && (
                      <p className="text-sm text-gray-700">
                        <strong className="font-semibold">Schedule:</strong> {enrollment.schedule}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <strong className="font-semibold">Enrolled on:</strong> {formatDate(enrollment.enrolled_at)}
                    </p>
                    {enrollment.notes && (
                      <p className="text-sm text-gray-600">
                        <strong className="font-semibold">Notes:</strong> {enrollment.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() =>
                        handleWithdraw(enrollment.enrollment_id, enrollment.activity_name)
                      }
                      disabled={withdrawing === enrollment.enrollment_id}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
                    >
                      {withdrawing === enrollment.enrollment_id
                        ? 'Withdrawing...'
                        : 'Withdraw'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {withdrawnEnrollments.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Past Enrollments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {withdrawnEnrollments.map((enrollment) => (
              <div key={enrollment.enrollment_id} className="bg-gray-50 rounded-lg shadow border border-gray-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-700 mb-2">{enrollment.activity_name}</h4>
                      <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">{enrollment.category}</span>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">Withdrawn</span>
                  </div>

                  <div className="space-y-2">
                    {enrollment.schedule && (
                      <p className="text-sm text-gray-600">
                        <strong className="font-semibold">Schedule:</strong> {enrollment.schedule}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <strong className="font-semibold">Enrolled on:</strong> {formatDate(enrollment.enrolled_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      title="Confirm Withdrawal"
      message={`Are you sure you want to withdraw from ${confirmDialog.data?.activityName}?`}
      onConfirm={confirmWithdraw}
      onCancel={() => setConfirmDialog({ isOpen: false, data: null })}
      confirmText="Withdraw"
      type="danger"
    />
  </div>
);
};

export default StudentEnroll;
