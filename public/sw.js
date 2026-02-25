self.addEventListener('push', function (event) {
    if (event.data) {
        let data = {};
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Notification', body: event.data.text() };
        }

        const options = {
            body: data.body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now()
            },
            requireInteraction: true
        };

        event.waitUntil(self.registration.showNotification(data.title || "AutoLog Update", options));
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
