import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Briefcase, Users, Info } from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Poll notifications every 30 seconds
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const notifications = notifData?.data || [];
  const unreadCount = notifData?.meta?.unreadCount || 0;

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item) => {
    if (!item.readAt) {
      markReadMutation.mutate(item._id);
    }
    setDropdownOpen(false);

    if (item.application) {
      const appId = item.application._id || item.application;
      if (user?.role === 'applicant') {
        navigate(`/me/applications/${appId}`);
      } else if (user?.role === 'recruiter') {
        navigate('/recruiter/jobs');
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'STAGE_CHANGE':
        return <Briefcase className="w-4 h-4 text-brand-dark" aria-hidden="true" />;
      case 'NEW_APPLICATION':
        return <Users className="w-4 h-4 text-mint-text" aria-hidden="true" />;
      default:
        return <Info className="w-4 h-4 text-accent" aria-hidden="true" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Notifications"
        className="p-2 text-text hover:bg-surface rounded-md border border-border transition-all relative focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-[10px] font-extrabold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border-2 border-border rounded-md shadow-flat z-50 overflow-hidden text-left">
          {/* Header */}
          <div className="px-4 py-3 border-b border-divider flex items-center justify-between bg-sand">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-error-bg text-error border border-error">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-bold text-brand-dark hover:underline flex items-center cursor-pointer disabled:text-text-muted"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-divider">
            {notifications.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-text-muted mx-auto" aria-hidden="true" />
                <p className="text-sm font-medium text-text-muted">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`px-4 py-3 flex items-start space-x-3 cursor-pointer transition-colors ${
                      isUnread
                        ? 'bg-sand hover:bg-sand/80'
                        : 'bg-surface hover:bg-page'
                    }`}
                  >
                    <div className="p-2 rounded-sm bg-surface border border-border shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${
                        isUnread
                          ? 'font-bold text-text'
                          : 'font-medium text-text-muted'
                      }`}>
                        {item.message}
                      </p>
                      <p className="text-xs text-text-muted mt-1 font-mono">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5" aria-hidden="true" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
