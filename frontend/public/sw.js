// Service Worker for LeetCode Friends Tracker Web Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New solve activity!',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/' }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'LeetCode Friends Tracker', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
