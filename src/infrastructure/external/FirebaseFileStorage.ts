import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/src/infrastructure/config/firebase';
import type {
  FileStorage,
  UploadFileParams,
  StoredFile,
} from '@/src/shared/domain/ports/FileStorage';

// ============================================================
// Firebase Storage — Infrastructure implementation
// Uses Firebase client SDK (for client-side uploads)
// ============================================================

const storage = getStorage(app);

export class FirebaseFileStorage implements FileStorage {
  async upload(params: UploadFileParams): Promise<StoredFile> {
    const storageRef = ref(storage, params.path);
    const metadata = {
      contentType: params.contentType,
      customMetadata: params.metadata,
    };

    const snapshot = await uploadBytes(storageRef, params.content, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      path: params.path,
      downloadUrl,
      size: snapshot.metadata.size ?? params.content.length,
      contentType: params.contentType,
    };
  }

  async getDownloadUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  }

  async delete(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
}
