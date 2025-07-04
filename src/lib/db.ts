import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// IMPORTANT: Service account key should be stored as a single-line JSON string
// in your environment variables (e.g., in .env.local).
// Example: FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type": "service_account", ...}
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (!serviceAccountKey) {
    // In a production environment, you'd want to handle this more gracefully.
    // For this app, we'll throw an error if the key is missing.
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. The application cannot connect to the database.');
}

try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

    // Initialize Firebase Admin SDK if not already initialized
    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    }
} catch (error) {
     throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Make sure it is a valid JSON string.');
}


const db = getFirestore();

/**
 * Helper to convert Firestore Timestamps and other non-serializable
 * server-side data types into a format safe to pass to Client Components.
 * @param data The data to convert. Can be a document, array, or primitive.
 * @returns The sanitized, serializable data.
 */
export const convertFirestoreData = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate().toISOString();
    }
    if (data === undefined) {
        return null;
    }
    if (Array.isArray(data)) {
        return data.map(convertFirestoreData);
    }
    if (data !== null && typeof data === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = convertFirestoreData(data[key]);
        }
        return newObj;
    }
    return data;
};


export { db, Timestamp };
