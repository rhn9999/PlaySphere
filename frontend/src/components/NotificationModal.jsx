import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { Badge } from './Badge.jsx';
import { Button } from './Button.jsx';
import { notificationsApi } from '../api/notifications.api.js';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkOne = async (id) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity & Notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            Recent updates, broadcasts & join requests
          </span>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1 text-slate-500" />
            Mark all read
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No notifications right now.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-1">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleMarkOne(n._id)}
                className={`py-3 px-2 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                  n.read ? 'hover:bg-slate-50' : 'bg-primary-50/40 hover:bg-primary-50/70'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {n.title}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
