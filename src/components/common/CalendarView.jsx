/**
 * Calendar View Component
 * Displays activities in a calendar format
 */

import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiClock, FiMapPin } from 'react-icons/fi';
import { getAllActivities } from '../../services/api';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await getAllActivities();
      setActivities(response.data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Parse schedule to get day of week
  const getActivityDays = (schedule) => {
    if (!schedule) return [];
    const dayMap = {
      'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
    };
    const days = [];
    const scheduleLower = schedule.toLowerCase();
    
    Object.keys(dayMap).forEach(day => {
      if (scheduleLower.includes(day)) {
        days.push(dayMap[day]);
      }
    });
    
    return days;
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date) => {
    const dayOfWeek = date.getDay();
    return activities.filter(activity => {
      const activityDays = getActivityDays(activity.schedule);
      return activityDays.includes(dayOfWeek);
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      sports: 'bg-blue-100 text-blue-800 border-blue-200',
      music: 'bg-purple-100 text-purple-800 border-purple-200',
      dance: 'bg-pink-100 text-pink-800 border-pink-200',
      art: 'bg-orange-100 text-orange-800 border-orange-200',
      drama: 'bg-red-100 text-red-800 border-red-200',
      technology: 'bg-green-100 text-green-800 border-green-200',
      academics: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateClick = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const selectedDateActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Activity Calendar</h2>
        <p className="text-gray-600 mt-1">View scheduled activities by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">{getMonthName(currentDate)}</h3>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: startingDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-24 p-1"></div>
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateForDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayActivities = getActivitiesForDate(dateForDay);
                
                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-24 p-1 border rounded-lg cursor-pointer transition-colors ${
                      isSelected(day)
                        ? 'border-blue-500 bg-blue-50'
                        : isToday(day)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(day) ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayActivities.slice(0, 2).map(activity => (
                        <div
                          key={activity.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${getCategoryColor(activity.category)}`}
                        >
                          {activity.name}
                        </div>
                      ))}
                      {dayActivities.length > 2 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayActivities.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'Select a Date'}
            </h3>
          </div>
          <div className="p-4">
            {!selectedDate ? (
              <p className="text-gray-500 text-center py-8">
                Click on a date to view scheduled activities
              </p>
            ) : selectedDateActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No activities scheduled for this day
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{activity.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getCategoryColor(activity.category)}`}>
                        {activity.category}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        <span>{activity.schedule}</span>
                      </div>
                      {activity.venue && (
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4" />
                          <span>{activity.venue}</span>
                        </div>
                      )}
                      <p className="text-gray-500 mt-2">{activity.coach_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
        <div className="flex flex-wrap gap-3">
          {['Sports', 'Music', 'Dance', 'Art', 'Drama', 'Technology', 'Academics'].map(category => (
            <span
              key={category}
              className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(category.toLowerCase())}`}
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
