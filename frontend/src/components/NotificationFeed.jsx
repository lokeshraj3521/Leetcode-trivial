import React, { useState, useEffect } from 'react';
import { Bell, X, Shield, Send, CheckCircle } from 'lucide-react';
import { apiNotifications } from '../services/api';

export default function NotificationFeed({ isOpen, onClose, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState('default');

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
      if ('Notification' in window) {
        setPushStatus(Notification.permission);
      }
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiNotifications.getUserFeed(userId);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notification feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPushStatus(perm);
      if (perm === 'granted') {
        // Register mock token for demo
        const mockToken = `fcm_web_token_${userId}_${Date.now()}`;
        await apiNotifications.registerToken({
          user_id: userId,
          fcm_token: mockToken,
          platform: 'web',
        });
        alert('Push notifications enabled successfully!');
      }
    } catch (err) {
      console.error('Push registration error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#111827] h-full border-l border-[#1F2937] flex flex-col justify-between shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-base">Friend Activity Feed</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-[#0B0F19] border border-[#1F2937]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Web Push Banner */}
        <div className="p-4 bg-[#0B0F19] border-b border-[#1F2937]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>Web Push Notifications</span>
            </div>
            {pushStatus === 'granted' ? (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Enabled
              </span>
            ) : (
              <button
                onClick={requestPushPermission}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1 rounded-lg transition-all"
              >
                Enable Push
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-center text-xs text-gray-400 py-8">Loading notification logs...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-12">
              No recent notifications logged for this user.
            </div>
          ) : (
            notifications.map((log) => (
              <div key={log.id} className="p-3.5 bg-[#0B0F19] border border-[#1F2937] rounded-xl space-y-1">
                <div className="font-bold text-xs text-white">{log.title}</div>
                <div className="text-xs text-gray-300">{log.body}</div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {new Date(log.sent_at).toLocaleTimeString()} • {new Date(log.sent_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F2937] text-center text-xs text-gray-500">
          Powered by Firebase Cloud Messaging (FCM)
        </div>
      </div>
    </div>
  );
}
