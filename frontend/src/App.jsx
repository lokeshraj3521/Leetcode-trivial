import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Groups from './components/Groups';
import AIInsights from './components/AIInsights';
import NotificationFeed from './components/NotificationFeed';
import LoginModal from './components/LoginModal';
import { apiUsers, apiGroups, apiSync, apiNotifications } from './services/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('leetcode_tracker_user_id') || null;
  });
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('leetcode_tracker_user_id', currentUserId);
      loadNotificationCount();
    } else if (users.length > 0) {
      setLoginModalOpen(true);
    }
  }, [currentUserId, users]);

  const loadInitialData = async () => {
    try {
      const [usersData, groupsData] = await Promise.all([apiUsers.list(), apiGroups.list()]);
      setUsers(usersData);
      setGroups(groupsData);

      if (!currentUserId && usersData.length > 0) {
        setLoginModalOpen(true);
      }
    } catch (err) {
      console.error('Error initializing application data:', err);
    }
  };

  const loadNotificationCount = async () => {
    if (!currentUserId) return;
    try {
      const feed = await apiNotifications.getUserFeed(currentUserId);
      setNotificationCount(feed.length);
    } catch (err) {
      console.error('Failed to load notification count:', err);
    }
  };

  const handleSync = async () => {
    if (!currentUserId) return;
    setIsSyncing(true);
    try {
      await apiSync.syncUser(currentUserId);
      await loadInitialData();
      await loadNotificationCount();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoginSuccess = (user) => {
    if (!users.some((u) => u.id === user.id)) {
      setUsers((prev) => [user, ...prev]);
    }
    setCurrentUserId(user.id);
    setLoginModalOpen(false);
  };

  const handleSwitchAccount = () => {
    setLoginModalOpen(true);
  };

  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        groups={groups}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSync={handleSync}
        isSyncing={isSyncing}
        notificationCount={notificationCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onSwitchAccount={handleSwitchAccount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leaderboard' && (
          <Leaderboard selectedGroupId={selectedGroupId} currentUserId={currentUserId} />
        )}
        {activeTab === 'profile' && <Profile userId={currentUserId} />}
        {activeTab === 'groups' && (
          <Groups groups={groups} currentUserId={currentUserId} onRefreshGroups={loadInitialData} />
        )}
        {activeTab === 'ai' && <AIInsights userId={currentUserId} />}
      </main>

      {/* Login & Notification Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />

      <NotificationFeed
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        userId={currentUserId}
      />
    </div>
  );
}
