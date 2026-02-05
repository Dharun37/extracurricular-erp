/**
 * Activity List Page
 * 
 * Browse and enroll in available activities
 */

import { useState, useEffect } from 'react';
import { getAllActivities, enrollStudent } from '../../services/api';
import { useToast } from '../common/ToastContainer';
import ConfirmDialog from '../common/ConfirmDialog';

const ActivityListPage = ({ studentId }) => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, data: null });
  const toast = useToast();

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllActivities();
      setActivities(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch activities');
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query) ||
        activity.coach_name?.toLowerCase().includes(query)
      );
    }

    setFilteredActivities(filtered);
  };

  const handleEnroll = (activityId, activityName) => {
    setConfirmDialog({
      isOpen: true,
      data: { activityId, activityName }
    });
  };

  const confirmEnroll = async () => {
    const { activityId, activityName } = confirmDialog.data;
    setConfirmDialog({ isOpen: false, data: null });

    try {
      setEnrolling(activityId);
      await enrollStudent(studentId, activityId);
      toast.success(`Successfully enrolled in ${activityName}!`);
      fetchActivities();
    } catch (err) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(null);
    }
  };

  const categories = ['all', ...new Set(activities.map(a => a.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">Error: {error}</p>
        <button
          onClick={fetchActivities}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Activities:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, coach, or description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No activities found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map(activity => {
            const isFull = parseInt(activity.enrolled_count) >= parseInt(activity.max_students);
            
            return (
              <div
                key={activity.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border ${
                  isFull ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{activity.name}</h3>
                    <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                      {activity.category}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {activity.coach_name && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Coach:</span> {activity.coach_name}
                      </p>
                    )}
                    {activity.venue && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Venue:</span> {activity.venue}
                      </p>
                    )}
                    {activity.schedule && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Schedule:</span> {activity.schedule}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-3">{activity.description}</p>
                    )}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">Enrollment:</span>
                        <span className="text-gray-600">
                          {activity.enrolled_count || 0} / {activity.max_students}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isFull ? 'bg-red-500' : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              ((activity.enrolled_count || 0) / activity.max_students) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                      {isFull && (
                        <p className="text-xs text-red-600 font-semibold mt-1">Activity is full</p>
                      )}
                    </div>
                  </div>

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
                    {enrolling === activity.id ? 'Enrolling...' : isFull ? 'Full' : 'Enroll Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Enrollment"
        message={`Do you want to enroll in ${confirmDialog.data?.activityName}?`}
        onConfirm={confirmEnroll}
        onCancel={() => setConfirmDialog({ isOpen: false, data: null })}
        confirmText="Enroll"
        type="default"
      />
    </div>
  );
};

export default ActivityListPage;
