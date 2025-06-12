// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyARJI0DZgGwH9j2Hz318ddonBd55IieUBs",
  authDomain: "monthlymeetingapp.firebaseapp.com",
  projectId: "monthlymeetingapp",
  storageBucket: "monthlymeetingapp.appspot.com",
  messagingSenderId: "139941390700",
  appId: "1:139941390700:web:ab6aa16fcd8ca71bb52b49"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192x192.png'
  });
});
