import { useEffect } from 'react';
import RequestFCMToken from '../component/RequestFCMToken';
import { UserProvider } from '../src/UserContext';
import Head from 'next/head';
import { getFirebaseMessaging } from '../firebaseConfig'; // Make sure path is correct

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        // You can now call getToken, onMessage here or inside RequestFCMToken
        console.log('Firebase messaging is ready');
      }
    }
  }, []);

  return (
    <UserProvider>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
        <meta name="description" content="description of your project" />
        <meta name="theme-color" content="#000" />
        <title>NT App</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>

      <RequestFCMToken />
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;
