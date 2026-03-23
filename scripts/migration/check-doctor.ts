import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

const slug = process.argv[2] || 'nicols-andrs-amores';

async function main() {
  const v1Snap = await db.collection('doctors').where('slug', '>=', slug).where('slug', '<=', slug + '\uf8ff').get();
  console.log('=== V1 doctors matching ===');
  for (const d of v1Snap.docs) {
    const data = d.data();
    console.log('ID:', d.id);
    console.log('nombre:', data.nombre);
    console.log('imagen:', data.imagen);
    console.log('photoURL:', data.photoURL);
    console.log('slug:', data.slug);
  }

  const v2Snap = await db.collection('v2_doctors').where('slug', '>=', slug).where('slug', '<=', slug + '\uf8ff').get();
  console.log('\n=== V2 doctors matching ===');
  for (const d of v2Snap.docs) {
    const data = d.data();
    console.log('ID:', d.id);
    console.log('name:', data.name);
    console.log('profileImage:', data.profileImage);
    console.log('slug:', data.slug);
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
