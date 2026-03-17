import * as admin from 'firebase-admin';

// Initialize firebase-admin.
// Ensure to set GOOGLE_APPLICATION_CREDENTIALS environment variable or provide the service account key.
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Executes a migration step for a specific collection in chunks (batches).
 * 
 * @param sourceCollection Name of the existing v1 collection
 * @param targetCollection Name of the new v2 collection (or same if modifying in place)
 * @param transformFn Function to transform v1 data to v2 data format
 * @param batchSize Number of documents per batch (Max 500 for Firestore)
 */
export async function runMigration<T1 = any, T2 = any>(
    sourceCollection: string,
    targetCollection: string,
    transformFn: (oldData: T1, id: string) => T2,
    batchSize: number = 400
) {
    console.log(`[Migration] Starting migration: ${sourceCollection} -> ${targetCollection}`);

    try {
        const snapshot = await db.collection(sourceCollection).get();
        const totalDocs = snapshot.docs.length;
        console.log(`[Migration] Found ${totalDocs} documents to process.`);

        let processedCount = 0;

        // Chunk documents into batches
        for (let i = 0; i < totalDocs; i += batchSize) {
            const chunk = snapshot.docs.slice(i, i + batchSize);
            const batch = db.batch();

            for (const doc of chunk) {
                const oldData = doc.data() as T1;

                // Idempotency check: Ignore already migrated documents
                if ((oldData as any).version === 2) {
                    continue;
                }

                const newData = transformFn(oldData, doc.id);

                // Add version flag and standard timestamps if not present
                const finalData = {
                    ...newData,
                    version: 2,
                    migratedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                const targetRef = db.collection(targetCollection).doc(doc.id);
                batch.set(targetRef, finalData, { merge: true });
            }

            await batch.commit();
            processedCount += chunk.length;
            console.log(`[Migration] Processed ${processedCount}/${totalDocs} documents...`);
        }

        console.log(`[Migration] Migration of ${sourceCollection} completed successfully.`);

    } catch (error) {
        console.error(`[Migration] Error during migration of ${sourceCollection}:`, error);
    }
}

// Example Execution (Will be filled with actual domains later)
const transformUserV1toV2 = (oldData: any, id: string) => {
    // Mapping logic will go here once the schemas are provided
    return {
        ...oldData,
        // Add logic to conform to Domain Interfaces
    };
};

// runMigration('users_v1', 'v2_users', transformUserV1toV2);
