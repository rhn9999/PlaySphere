/**
 * Optional Web Firebase Cloud Messaging (FCM) Integration
 * If VITE_FIREBASE_API_KEY is missing, this module safely no-ops.
 */

let messagingInstance = null;

export const requestFcmToken = async () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    // Graceful no-op when Firebase credentials are not provided
    return null;
  }

  try {
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    });

    messagingInstance = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messagingInstance, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return currentToken;
    }
    return null;
  } catch (err) {
    console.info('ℹ️ Firebase Web Push disabled/skipped:', err.message);
    return null;
  }
};
