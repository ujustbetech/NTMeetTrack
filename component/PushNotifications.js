import { useEffect } from 'react';
import { messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export default function PushNotification() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').then(() => {
        getToken(messaging, {
          vapidKey: 'PAzNvDcyx04ddfowp0G8TrcD2bFk09Z3XBzaXgYaKoY'
        }).then(currentToken => {
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Save the token to your backend if needed
          }
        });

        onMessage(messaging, (payload) => {
          alert(payload.notification.title + ': ' + payload.notification.body);
        });
      });
    }
  }, []);

  return null;
}
