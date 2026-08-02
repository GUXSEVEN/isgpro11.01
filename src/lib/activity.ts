/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ActivityLog {
  userId: string;
  action: 'login' | 'license_purchase' | 'profile_update';
  timestamp: string;
  details: Record<string, any>;
}

/**
 * Logs critical operations to the Firestore 'activity_logs' collection.
 */
export async function logActivity(
  userId: string,
  action: 'login' | 'license_purchase' | 'profile_update',
  details: Record<string, any>
): Promise<void> {
  if (!db) {
    console.warn(`[Activity Log Fallback] DB not initialized. Logged action '${action}' for user '${userId}':`, details);
    return;
  }

  const logData: ActivityLog = {
    userId: userId.toLowerCase().trim(),
    action,
    timestamp: new Date().toISOString(),
    details,
  };

  const path = 'activity_logs';
  try {
    const logRef = doc(collection(db, path));
    await setDoc(logRef, logData);
    console.log(`[Activity Log] Logged '${action}' for user '${userId}' in Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
