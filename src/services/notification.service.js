import { EventEmitter } from 'events';
import fs from 'fs';
import admin from 'firebase-admin';
import { Player } from '../models/index.js';

let firebaseInitialized = false;
let firebaseApp = null;

/**
 * Lazy and optional Firebase Admin SDK initialization.
 * If credentials are missing or invalid, the app continues without crashing
 * and gracefully skips push notifications.
 */
const getFirebaseMessaging = () => {
  if (firebaseInitialized) {
    return firebaseApp ? admin.messaging() : null;
  }

  firebaseInitialized = true;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const fileData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(fileData)
      });
      console.log('🔥 Firebase Admin initialized via service account file');
      return admin.messaging();
    } else if (projectId && clientEmail && privateKey) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      console.log('🔥 Firebase Admin initialized via environment credentials');
      return admin.messaging();
    } else {
      console.log('ℹ️ Firebase credentials missing. Push notifications will be skipped gracefully.');
      return null;
    }
  } catch (err) {
    console.warn(`⚠️ Firebase Admin initialization skipped/failed: ${err.message}`);
    return null;
  }
};

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.broadcastLogs = [];
  }

  /**
   * Send FCM push notifications in batches of 500 using sendEachForMulticast.
   * Cleans up any tokens returned as unregistered.
   */
  async sendPushMulticast({ tokens, title, body, data = {} }) {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    // Filter valid unique string tokens
    const validTokens = [...new Set(tokens.filter((t) => typeof t === 'string' && t.trim().length > 0))];
    if (validTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      // Firebase not configured, gracefully skip
      return { successCount: 0, failureCount: 0, skipped: true };
    }

    // Firebase multicast allows up to 500 tokens per batch
    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const staleTokens = [];

    // Ensure all data values are strings for FCM payload compatibility
    const stringifiedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
    );

    for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
      const batch = validTokens.slice(i, i + BATCH_SIZE);
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          notification: {
            title,
            body
          },
          data: stringifiedData
        });

        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token'
            ) {
              staleTokens.push(batch[idx]);
            }
          }
        });
      } catch (batchError) {
        console.error('❌ Failed to send FCM multicast batch:', batchError.message);
      }
    }

    // Clean up stale or unregistered tokens from the database
    if (staleTokens.length > 0) {
      try {
        await Player.updateMany(
          { fcmToken: { $in: staleTokens } },
          { $set: { fcmToken: null } }
        );
        console.log(`🧹 Cleaned up ${staleTokens.length} unregistered FCM token(s)`);
      } catch (cleanupError) {
        console.warn('⚠️ Error cleaning up stale FCM tokens:', cleanupError.message);
      }
    }

    return { successCount: totalSuccess, failureCount: totalFailure };
  }

  /**
   * Broadcast open match creation pings to eligible players interested in the sport
   */
  broadcastOpenMatchPing(openMatch, eligiblePlayersCount = 0) {
    const payload = {
      type: 'OPEN_MATCH_BROADCAST',
      matchId: openMatch._id,
      sport: openMatch.sport,
      targetHeadcount: openMatch.targetHeadcount,
      minReliability: openMatch.minReliability,
      notifiedPlayersCount: eligiblePlayersCount,
      timestamp: new Date().toISOString()
    };

    this.broadcastLogs.push(payload);
    this.emit('broadcast:match', payload);

    console.log(
      `📢 [Broadcast Ping] OpenMatch for sport '${openMatch.sport}' pinged to ${eligiblePlayersCount} players`
    );

    return payload;
  }

  /**
   * Broadcast to nearby players with FCM push and in-app event
   */
  async notifyNearbyPlayersForMatch({ openMatch, nearbyPlayers, isPing = false }) {
    const count = nearbyPlayers?.length || 0;
    const title = isPing
      ? `Spot Open: ${openMatch.sport} Match!`
      : `New ${openMatch.sport} Match Nearby!`;
    const body = `${openMatch.title || openMatch.sport + ' Match'} has open spots near your location. Tap to join!`;

    const tokens = nearbyPlayers
      ?.map((p) => p.fcmToken)
      ?.filter((t) => Boolean(t)) || [];

    // Send FCM push if tokens and firebase are available
    if (tokens.length > 0) {
      await this.sendPushMulticast({
        tokens,
        title,
        body,
        data: {
          matchId: openMatch._id.toString(),
          sport: openMatch.sport,
          type: isPing ? 'MATCH_PING' : 'NEW_MATCH'
        }
      });
    }

    const payload = {
      type: isPing ? 'MATCH_PING_BROADCAST' : 'MATCH_LOCATION_BROADCAST',
      matchId: openMatch._id,
      sport: openMatch.sport,
      notifiedPlayersCount: count,
      timestamp: new Date().toISOString()
    };

    this.broadcastLogs.push(payload);
    this.emit('broadcast:nearby_players', payload);

    console.log(
      `📢 [Match Proximity ${isPing ? 'Ping' : 'Broadcast'}] Notified ${count} nearby player(s) for ${openMatch.sport}`
    );

    return payload;
  }

  /**
   * Send direct notification to a user (e.g. Booking confirmation, Join request decision)
   */
  sendDirectNotification(userId, title, message, data = {}) {
    const payload = {
      type: 'DIRECT_NOTIFICATION',
      recipient: userId,
      title,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    this.emit('notification:direct', payload);
    return payload;
  }
}

export const notificationService = new NotificationService();
