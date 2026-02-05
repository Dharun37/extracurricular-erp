/**
 * My Activities Page
 * 
 * View enrolled activities, status, and performance
 */

import { useState, useEffect } from 'react';
import { getStudentEnrollments, withdrawEnrollment } from '../../services/api';
import { useToast } from '../common/ToastContainer';
import ConfirmDialog from '../common/ConfirmDialog';

const MyActivitiesPage = ({ studentId }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, data: null });
  const [filterStatus, setFilterStatus] = useState('all');
  const toast = useToast();

  useEffect(() => {
    fetchEnrollments();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudentEnrollments(studentId);
      setEnrollments(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch enrollments');
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = (enrollmentId, activityName) => {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', text: 'Withdrawn' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Completed' }
    };
    return badges[status] || badges.active;
  };

  const filteredEnrollments = filterStatus === 'all'
    ? enrollments
    : enrollments.filter(e => e.status === filterStatus);

  const activeCount = enrollments.filter(e => ['active', 'approved'].includes(e.status)).length;
  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const withdrawnCount = enrollments.filter(e => e.status === 'withdrawn').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">Error: {error}</p>
        <button
          onClick={fetchEnrollments}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="text-3xl font-bold text-blue-700">{enrollments.length}</div>
          <div className="text-sm text-blue-600 font-medium mt-1">Total Enrollments</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="text-3xl font-bold text-green-700">{activeCount}</div>
          <div className="text-sm text-green-600 font-medium mt-1">Active Activities</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="text-3xl font-bold text-purple-700">{completedCount}</div>
          <div className="text-sm text-purple-600 font-medium mt-1">Completed</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-gray-700">{withdrawnCount}</div>
          <div className="text-sm text-gray-600 font-medium mt-1">Withdrawn</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-2 flex flex-wrap gap-2 mb-6">
        {['all', 'active', 'approved', 'rejected', 'withdrawn', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Enrollments List */}
      {filteredEnrollments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">No activities found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEnrollments.map(enrollment => {
            const statusBadge = getStatusBadge(enrollment.status);
            const canWithdraw = ['active', 'approved'].includes(enrollment.status);

            return (
              <div
                key={enrollment.enrollment_id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {enrollment.activity_name}
                      </h4>
                      <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                        {enrollment.category}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {enrollment.coach_name && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Coach:</span> {enrollment.coach_name}
                      </p>
                    )}
                    {enrollment.schedule && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Schedule:</span> {enrollment.schedule}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">Enrolled:</span>{' '}
                      {formatDate(enrollment.enrolled_at)}
                    </p>
                    {enrollment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Your Notes:</p>
                        <p className="text-sm text-gray-600">{enrollment.notes}</p>
                      </div>
                    )}
                    {enrollment.performance_remarks && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          Coach's Feedback
                        </p>
                        <p className="text-sm text-blue-800">{enrollment.performance_remarks}</p>
                      </div>
                    )}
                  </div>

                  {canWithdraw && (
                    <button
                      onClick={() => handleWithdraw(enrollment.enrollment_id, enrollment.activity_name)}
                      disabled={withdrawing === enrollment.enrollment_id}
                      className="w-full py-2.5 px-4 rounded-lg font-semibold transition bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400"
                    >
                      {withdrawing === enrollment.enrollment_id ? 'Withdrawing...' : 'Withdraw from Activity'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

export default MyActivitiesPage;
