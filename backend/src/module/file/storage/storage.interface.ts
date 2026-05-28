export interface IStorageService {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
