import { useEffect, useState } from 'react';
import { getFirebaseMessaging } from '../firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';

export default function RequestFCMToken() {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const messaging = getFirebaseMessaging();
        if (!messaging) {
          console.log('Firebase messaging not initialized');
          return;
        }

        const currentToken = await getToken(messaging, {
          vapidKey: 'BKCodYhC12oDCxtRpv8x26WjTWLnKoJVa8T7TTY_R1o1v4Uk3x4Q3kOchzLADk63hE2akUPpiQTLaWxpKzhqiuE', // Replace with your VAPID key from Firebase Console
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);
          setFcmToken(currentToken);
          // TODO: send this token to your backend or save it for later
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    }

    // Request permission first if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          fetchToken();
        } else {
          console.log('Notification permission denied');
        }
      });
    } else if (Notification.permission === 'granted') {
      fetchToken();
    } else {
      console.log('Notification permission denied');
    }

    // Optionally handle incoming messages while app is in foreground
    const messaging = getFirebaseMessaging();
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Show notification or update UI here
      });
    }
  }, []);

  return (
    <div>
      {/* {fcmToken ? (
        <p>Your FCM Token: <small>{fcmToken}</small></p>
      ) : (
        <p>Requesting permission to get FCM token...</p>
      )} */}
    </div>
  );
}
