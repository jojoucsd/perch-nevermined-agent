import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Initialize Firebase Admin SDK
// Looks for service account key in order:
// 1. FIREBASE_SERVICE_ACCOUNT env var (JSON string)
// 2. ./firebase-service-account.json file
// 3. GOOGLE_APPLICATION_CREDENTIALS env var

let app: admin.app.App

if (!admin.apps.length) {
  const serviceAccountPath = resolve(process.cwd(), 'firebase-service-account.json')

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Railway converts \n in env vars to literal newlines, breaking JSON.parse.
    // Strategy: try parsing as-is, then fix newlines if it fails.
    let serviceAccount: any
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    } catch {
      // Replace literal newlines with \\n so JSON.parse can handle them,
      // but only inside quoted string values (between quotes)
      const fixed = process.env.FIREBASE_SERVICE_ACCOUNT
        .replace(/\r?\n/g, '\\n')
      serviceAccount = JSON.parse(fixed)
    }
    // Ensure private_key has actual newlines (not escaped) for crypto
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://perch-hackathon-default-rtdb.firebaseio.com',
    })
  } else if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://perch-hackathon-default-rtdb.firebaseio.com',
    })
  } else {
    app = admin.initializeApp({
      databaseURL: 'https://perch-hackathon-default-rtdb.firebaseio.com',
    })
  }
} else {
  app = admin.apps[0]!
}

export const db = admin.firestore(app)
export const rtdb = admin.database(app)
export { admin }
