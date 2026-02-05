/**
 * ActivityList Component
 * 
 * Displays all available extra-curricular activities
 * Allows filtering by category
 * Admin/Teacher: Can edit and delete activities
 * Student: Can enroll in activities
 */

import { useState, useEffect } from 'react';
import { getAllActivities, enrollStudent, deleteActivity } from '../../services/api';
import { useToast } from '../common/ToastContainer';
import ConfirmDialog from '../common/ConfirmDialog';

const ActivityList = ({ studentId = 1001, userRole = 'student', onEnroll, onEdit }) => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', data: null });
  const toast = useToast();

  // Check if user is admin or teacher
  const isAdminOrTeacher = userRole === 'admin' || userRole === 'teacher';

  // Fetch activities on component mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Filter activities when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter((activity) => activity.category === selectedCategory)
      );
    }
  }, [selectedCategory, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllActivities();
      setActivities(response.data || []);
      setFilteredActivities(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (activityId, activityName) => {
    setConfirmDialog({
      isOpen: true,
      type: 'enroll',
      data: { activityId, activityName }
    });
  };

  const handleDelete = async (activityId, activityName) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      data: { activityId, activityName }
    });
  };

  const confirmEnroll = async () => {
    const { activityId, activityName } = confirmDialog.data;
    setConfirmDialog({ isOpen: false, type: '', data: null });

    try {
      setEnrolling(activityId);
      await enrollStudent(studentId, activityId);
      toast.success(`Successfully enrolled in ${activityName}!`);
      
      // Refresh activities to update enrolled count
      fetchActivities();
      
      // Notify parent component if callback provided
      if (onEnroll) {
        onEnroll(activityId);
      }
    } catch (err) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(null);
    }
  };

  const confirmDelete = async () => {
    const { activityId, activityName } = confirmDialog.data;
    setConfirmDialog({ isOpen: false, type: '', data: null });

    try {
      setDeleting(activityId);
      await deleteActivity(activityId);
      toast.success(`Successfully deleted ${activityName}`);
      
      // Refresh activities list
      fetchActivities();
    } catch (err) {
      toast.error(err.message || 'Failed to delete activity');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (activity) => {
    if (onEdit) {
      onEdit(activity);
    }
  };

  // Get unique categories from activities
  const categories = ['all', ...new Set(activities.map((a) => a.category))];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading activities...</div>
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
            onClick={fetchActivities}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Available Extra-Curricular Activities</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No activities found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const isFull = parseInt(activity.enrolled_count) >= parseInt(activity.max_students);
            
            return (
              <div 
                key={activity.id} 
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isFull ? 'border-red-200' : 'border-gray-200'}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{activity.name}</h3>
                    <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                      {activity.category}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {activity.coach_name && (
                      <p className="text-sm text-gray-700">
                        <strong className="font-semibold">Coach:</strong> {activity.coach_name}
                      </p>
                    )}
                    {activity.venue && (
                      <p className="text-sm text-gray-700">
                        <strong className="font-semibold">Venue:</strong> {activity.venue}
                      </p>
                    )}
                    {activity.schedule && (
                      <p className="text-sm text-gray-700">
                        <strong className="font-semibold">Schedule:</strong> {activity.schedule}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">{activity.description}</p>
                    )}
                    <p className="text-sm text-gray-700">
                      <strong className="font-semibold">Enrolled:</strong> {activity.enrolled_count || 0} / {activity.max_students}
                      {isFull && <span className="ml-2 text-red-600 font-semibold">(FULL)</span>}
                    </p>
                  </div>

                  <div className="mt-4">
                    {isAdminOrTeacher ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(activity)}
                          className="flex-1 py-2.5 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id, activity.name)}
                          disabled={deleting === activity.id}
                          className="flex-1 py-2.5 px-4 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:bg-red-400 disabled:cursor-wait"
                        >
                          {deleting === activity.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnroll(activity.id, activity.name)}
                        disabled={enrolling === activity.id || isFull}
                        className={`w-full py-2.5 px-4 rounded-lg font-semibold transition ${
                          isFull
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : enrolling === activity.id
                            ? 'bg-blue-400 text-white cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {enrolling === activity.id
                          ? 'Enrolling...'
                          : isFull
                          ? 'Full'
                          : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'enroll' ? 'Confirm Enrollment' : 'Confirm Deletion'}
        message={
          confirmDialog.type === 'enroll'
            ? `Do you want to enroll in ${confirmDialog.data?.activityName}?`
            : `Are you sure you want to delete "${confirmDialog.data?.activityName}"? This cannot be undone.`
        }
        onConfirm={confirmDialog.type === 'enroll' ? confirmEnroll : confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, type: '', data: null })}
        confirmText={confirmDialog.type === 'enroll' ? 'Enroll' : 'Delete'}
        type={confirmDialog.type === 'delete' ? 'danger' : 'default'}
      />
    </div>
  );
};

export default ActivityList;
