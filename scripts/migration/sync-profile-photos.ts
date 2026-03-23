/**
 * ============================================================
 * Sync Profile Photos: V1 → V2
 * ============================================================
 * Compares the `imagen` field in V1 doctors with `profileImage`
 * in V2 doctors. Updates only the photo field (and updatedAt)
 * without touching any other V2 data.
 *
 * Usage:
 *   npx tsx scripts/migration/sync-profile-photos.ts --dry-run
 *   npx tsx scripts/migration/sync-profile-photos.ts
 * ============================================================
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// --------------- Config ---------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '..', '..', 'medicos-ar', '.env.local'), 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
}

const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}
const db = getFirestore();

const DRY_RUN = process.argv.includes('--dry-run');

// --------------- Main ---------------

async function main() {
  console.log('='.repeat(60));
  console.log('   Sync Profile Photos: V1 → V2');
  console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
  console.log('='.repeat(60));

  // Fetch V1 doctors (id + imagen + photoURL)
  const v1Snap = await db.collection('doctors').select('imagen', 'photoURL').get();
  console.log(`\n📄 ${v1Snap.size} doctores en V1`);

  // Build map: docId → best photo (photoURL takes priority over imagen)
  const v1Photos = new Map<string, string>();
  for (const doc of v1Snap.docs) {
    const data = doc.data();
    const bestPhoto = data.photoURL || data.imagen || '';
    if (bestPhoto) v1Photos.set(doc.id, bestPhoto);
  }

  // Fetch V2 doctors (only id + profileImage)
  const v2Snap = await db.collection('v2_doctors').select('profileImage').get();
  console.log(`📄 ${v2Snap.size} doctores en V2`);

  // Compare and find differences
  const updates: { id: string; oldImg: string; newImg: string }[] = [];
  for (const doc of v2Snap.docs) {
    const v2Img = doc.data().profileImage ?? '';
    const v1Img = v1Photos.get(doc.id);
    if (v1Img && v1Img !== v2Img) {
      updates.push({ id: doc.id, oldImg: v2Img, newImg: v1Img });
    }
  }

  console.log(`\n🔄 ${updates.length} doctores con foto de perfil diferente\n`);

  if (updates.length === 0) {
    console.log('✅ Nada que sincronizar.');
    process.exit(0);
  }

  // Show preview
  for (const u of updates) {
    const shortOld = u.oldImg.length > 50 ? u.oldImg.slice(0, 50) + '...' : (u.oldImg || '(vacío)');
    const shortNew = u.newImg.length > 50 ? u.newImg.slice(0, 50) + '...' : u.newImg;
    console.log(`   ${u.id}`);
    console.log(`     V2: ${shortOld}`);
    console.log(`     V1: ${shortNew}`);
  }

  if (DRY_RUN) {
    console.log(`\n🔍 [DRY RUN] ${updates.length} fotos se actualizarían.`);
    process.exit(0);
  }

  // Apply updates in batches
  const BATCH_SIZE = 500;
  let batch = db.batch();
  let count = 0;

  for (const u of updates) {
    const ref = db.collection('v2_doctors').doc(u.id);
    batch.update(ref, {
      profileImage: u.newImg,
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;

    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      console.log(`   ✅ Batch committed (${count}/${updates.length})`);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ ${updates.length} fotos de perfil sincronizadas.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
