// ============================================================
// File Storage Port — Hexagonal boundary for file uploads
// Infrastructure implementations: Firebase Storage, S3, etc.
// ============================================================

export interface UploadFileParams {
  path: string;                    // Storage path (e.g. "profiles/uid/photo.jpg")
  content: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StoredFile {
  path: string;
  downloadUrl: string;
  size: number;
  contentType: string;
}

export interface FileStorage {
  upload(params: UploadFileParams): Promise<StoredFile>;
  getDownloadUrl(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}
