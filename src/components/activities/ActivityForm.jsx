/**
 * ActivityForm Component
 * 
 * Form for creating and editing extra-curricular activities (Admin)
 */

import { useState, useEffect } from 'react';
import { createActivity, updateActivity, getAllUsers } from '../../services/api';
import { useToast } from '../common/ToastContainer';

const ActivityForm = ({ onActivityCreated, editActivity = null, onCancel = null, activity = null }) => {
  const toast = useToast();
  const [coaches, setCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [coachSearch, setCoachSearch] = useState('');
  const [showCoachSuggestions, setShowCoachSuggestions] = useState(false);
  const [selectedCoachName, setSelectedCoachName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    coach_id: '',
    venue: '',
    schedule: '',
    description: '',
    max_students: 30,
  });

  // Load coaches on mount
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        console.log('🔄 Fetching coaches...');
        setLoadingCoaches(true);
        const response = await getAllUsers({ role: 'teacher', status: 'active' });
        console.log('✅ coaches response:', response);
        
        // Handle different response formats
        const coachData = response.data || response || [];
        console.log('📋 Coaches data:', coachData);
        setCoaches(coachData);
        console.log('✅ Coaches set:', coachData?.length || 0, 'coaches');
      } catch (err) {
        console.error('❌ Failed to load coaches:', err);
        toast.error('Failed to load coaches');
      } finally {
        setLoadingCoaches(false);
      }
    };
    fetchCoaches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCoachSuggestions && !event.target.closest('.coach-autocomplete')) {
        setShowCoachSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCoachSuggestions]);

  // Load edit data when activity or editActivity prop changes
  useEffect(() => {
    const activityData = activity || editActivity;
    if (activityData) {
      setFormData({
        name: activityData.name || '',
        category: activityData.category || '',
        coach_id: activityData.coach_id || '',
        venue: activityData.venue || '',
        schedule: activityData.schedule || '',
        description: activityData.description || '',
        max_students: activityData.max_students || 30,
      });
      // Set the coach name for display
      if (activityData.coach_name) {
        setSelectedCoachName(activityData.coach_name);
        setCoachSearch(activityData.coach_name);
      } else if (activityData.coach_id) {
        const coach = coaches.find(c => c.id === activityData.coach_id);
        if (coach) {
          const name = `${coach.first_name} ${coach.last_name}`;
          setSelectedCoachName(name);
          setCoachSearch(name);
        }
      }
    }
  }, [activity, editActivity, coaches]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = ['sports', 'music', 'dance', 'art', 'drama', 'technology', 'other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear messages on input change
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.category) {
      setError('Name and category are required');
      return;
    }

    if (!formData.venue) {
      setError('Venue is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const activityData = activity || editActivity;
      let response;
      if (activityData) {
        // Update existing activity
        response = await updateActivity(activityData.id, formData);
        toast.success('Activity updated successfully!');
      } else {
        // Create new activity
        response = await createActivity(formData);
        toast.success('Activity created successfully!');
      }
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        coach_id: '',
        venue: '',
        schedule: '',
        description: '',
        max_students: 30,
      });

      // Notify parent component
      if (onActivityCreated) {
        onActivityCreated(response.data);
      }
      
      // Close modal/form
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      const activityData = activity || editActivity;
      setError(err.message || `Failed to ${activityData ? 'update' : 'create'} activity`);
      toast.error(err.message || `Failed to ${activityData ? 'update' : 'create'} activity`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      category: '',
      coach_id: '',
      venue: '',
      schedule: '',
      description: '',
      max_students: 30,
    });
    setCoachSearch('');
    setSelectedCoachName('');
    setShowCoachSuggestions(false);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  const handleReset = () => {
    const activityData = activity || editActivity;
    if (activityData) {
      // In edit mode, reset to original values
      setFormData({
        name: activityData.name || '',
        category: activityData.category || '',
        coach_id: activityData.coach_id || '',
        venue: activityData.venue || '',
        schedule: activityData.schedule || '',
        description: activityData.description || '',
        max_students: activityData.max_students || 30,
      });
      if (activityData.coach_name) {
        setCoachSearch(activityData.coach_name);
        setSelectedCoachName(activityData.coach_name);
      }
    } else {
      // In create mode, clear all fields
      setFormData({
        name: '',
        category: '',
        coach_id: '',
        venue: '',
        schedule: '',
        description: '',
        max_students: 30,
      });
      setCoachSearch('');
      setSelectedCoachName('');
    }
    setShowCoachSuggestions(false);
    setError(null);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {(activity || editActivity) ? 'Edit Activity' : 'Create New Activity'}
        </h2>
        <p className="text-gray-600">
          {(activity || editActivity) ? 'Update activity details' : 'Add a new extra-curricular activity for students'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <strong className="text-red-800">Error:</strong> <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Football Training"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="relative coach-autocomplete">
            <label htmlFor="coach_search" className="block text-sm font-medium text-gray-700 mb-2">
              Assign Coach/Teacher <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="coach_search"
              value={coachSearch}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Input changed:', value, 'Coaches:', coaches.length);
                setCoachSearch(value);
                setShowCoachSuggestions(true);
                if (value.length === 0) {
                  setFormData(prev => ({ ...prev, coach_id: '' }));
                  setSelectedCoachName('');
                }
              }}
              onFocus={() => {
                console.log('Input focused, coaches:', coaches.length);
                setShowCoachSuggestions(true);
              }}
              placeholder="Type teacher name (e.g., John, Sarah)..."
              required
              disabled={loadingCoaches}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              autoComplete="off"
            />
            {loadingCoaches && (
              <div className="absolute right-3 top-11 text-gray-400 text-sm">Loading...</div>
            )}
            
            {/* Debug info */}
            {console.log('Render - showCoachSuggestions:', showCoachSuggestions, 'loadingCoaches:', loadingCoaches, 'coaches.length:', coaches.length)}
            
            {/* Suggestions dropdown */}
            {showCoachSuggestions && !loadingCoaches && coaches.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {coaches
                  .filter(coach => {
                    if (!coachSearch || coachSearch.trim() === '') return true; // Show all if no search
                    const searchLower = coachSearch.toLowerCase().trim();
                    const fullName = `${coach.first_name} ${coach.last_name}`.toLowerCase();
                    const firstName = coach.first_name.toLowerCase();
                    const lastName = coach.last_name.toLowerCase();
                    const matches = fullName.includes(searchLower) || 
                           firstName.startsWith(searchLower) || 
                           lastName.startsWith(searchLower);
                    console.log('Filtering:', coach.first_name, coach.last_name, 'matches:', matches);
                    return matches;
                  })
                  .map((coach) => (
                    <div
                      key={coach.id}
                      onClick={() => {
                        const name = `${coach.first_name} ${coach.last_name}`;
                        console.log('Selected coach:', name, coach.id);
                        setCoachSearch(name);
                        setSelectedCoachName(name);
                        setFormData(prev => ({ ...prev, coach_id: coach.id }));
                        setShowCoachSuggestions(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {coach.first_name} {coach.last_name}
                      </div>
                      {coach.specialization && (
                        <div className="text-xs text-gray-500">{coach.specialization}</div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
              Venue <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., Sports Ground, Music Room"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="schedule"
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              placeholder="e.g., Mon/Wed 4-5 PM"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="max_students" className="block text-sm font-medium text-gray-700 mb-2">
              Max Participants <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="max_students"
              name="max_students"
              value={formData.max_students}
              onChange={handleChange}
              min="1"
              max="200"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the activity, benefits, and requirements..."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3">
          {(activity || editActivity) && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading || loadingCoaches}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {loading ? ((activity || editActivity) ? 'Updating...' : 'Creating...') : ((activity || editActivity) ? 'Update Activity' : 'Create Activity')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityForm;
