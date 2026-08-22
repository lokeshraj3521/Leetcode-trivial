import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Groups from './components/Groups';
import AIInsights from './components/AIInsights';
import NotificationFeed from './components/NotificationFeed';
import NewUserModal from './components/NewUserModal';
import { apiUsers, apiGroups, apiSync, apiNotifications } from './services/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadNotificationCount();
    }
  }, [selectedUserId]);

  const loadInitialData = async () => {
    try {
      const [usersData, groupsData] = await Promise.all([apiUsers.list(), apiGroups.list()]);
      setUsers(usersData);
      setGroups(groupsData);

      if (usersData.length > 0 && !selectedUserId) {
        setSelectedUserId(usersData[0].id);
      }
    } catch (err) {
      console.error('Error initializing application data:', err);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const feed = await apiNotifications.getUserFeed(selectedUserId);
      setNotificationCount(feed.length);
    } catch (err) {
      console.error('Failed to load notification count:', err);
    }
  };

  const handleSync = async () => {
    if (!selectedUserId) return;
    setIsSyncing(true);
    try {
      await apiSync.syncUser(selectedUserId);
      await loadInitialData();
      await loadNotificationCount();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUserCreated = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    setSelectedUserId(newUser.id);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      <Header
        users={users}
        groups={groups}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSync={handleSync}
        isSyncing={isSyncing}
        notificationCount={notificationCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenNewUserModal={() => setNewUserModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leaderboard' && (
          <Leaderboard selectedGroupId={selectedGroupId} selectedUserId={selectedUserId} />
        )}
        {activeTab === 'profile' && <Profile userId={selectedUserId} />}
        {activeTab === 'groups' && (
          <Groups groups={groups} selectedUserId={selectedUserId} onRefreshGroups={loadInitialData} />
        )}
        {activeTab === 'ai' && <AIInsights userId={selectedUserId} />}
      </main>

      {/* Drawer & Modal Popups */}
      <NotificationFeed
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        userId={selectedUserId}
      />

      <NewUserModal
        isOpen={newUserModalOpen}
        onClose={() => setNewUserModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
