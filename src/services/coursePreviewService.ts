import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { coursesService } from './firebaseService';
import { Course } from '../types/database';

export interface CoursePreviewPayload {
  previewEnabled: boolean;
  previewType: 'youtube' | 'vimeo' | 'upload' | null;
  previewVideoUrl: string | null;
  previewStoragePath: string | null;
  previewThumbnailUrl?: string | null;
}

export const coursePreviewService = {
  /**
   * Uploads an authentic video file (MP4, WebM, MOV) to Firebase Storage
   * under `course-previews/{courseId}/{timestamp}_{filename}`.
   */
  async uploadPreviewVideo(
    courseId: string,
    file: File,
    onProgress?: (progressPercent: number) => void
  ): Promise<{ url: string; storagePath: string }> {
    // 1. Validate file format
    const validMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const validExtensions = ['.mp4', '.webm', '.mov'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    
    if (!validMimeTypes.includes(file.type) && !hasValidExt) {
      throw new Error('Fòma fichye a pa sipòte. Tanpri chwazi yon videyo MP4, WebM, oswa MOV (Nou rekòmande MP4).');
    }

    // 2. Validate file size (Max 250 MB)
    const MAX_SIZE_BYTES = 250 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Fichye videyo a twò lou (Limit maksimòm: 250 MB). Eseye konprese videyo a anvan ou telechaje li.');
    }

    // 3. Generate sanitized path
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `course-previews/${courseId}/${Date.now()}_${sanitizedFilename}`;
    const storageRef = ref(storage, storagePath);

    // 4. Upload with progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'video/mp4',
      customMetadata: {
        courseId,
        uploadedAt: new Date().toISOString(),
        mediaType: 'course-preview',
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(pct);
          }
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          reject(new Error(`Echèk telechajman videyo a: ${error.message || 'Eseye ankò.'}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadUrl,
              storagePath,
            });
          } catch (err: any) {
            console.error('Failed to get download URL after upload:', err);
            reject(new Error('Nou pa t kapab jwenn lyen videyo ki telechaje a.'));
          }
        }
      );
    });
  },

  /**
   * Safely deletes an uploaded preview video from Firebase Storage.
   */
  async deleteStorageFile(storagePath?: string | null): Promise<void> {
    if (!storagePath || typeof storagePath !== 'string') return;
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (err: any) {
      // If the object doesn't exist, ignore 404
      if (err?.code !== 'storage/object-not-found') {
        console.warn('Could not delete storage preview file:', err?.message || err);
      }
    }
  },

  /**
   * Updates preview video configuration in Firestore for a given course.
   */
  async savePreviewSettings(courseId: string, payload: CoursePreviewPayload): Promise<void> {
    const timestamp = new Date().toISOString();
    await coursesService.update(courseId, {
      previewEnabled: payload.previewEnabled,
      previewType: payload.previewType,
      previewVideoUrl: payload.previewVideoUrl,
      previewStoragePath: payload.previewStoragePath,
      previewThumbnailUrl: payload.previewThumbnailUrl || null,
      updated_at: timestamp,
      updatedAt: timestamp,
    } as Partial<Course>);
  },

  /**
   * Completely removes preview video from a course, deleting any uploaded file from storage.
   */
  async removePreviewVideo(courseId: string, existingStoragePath?: string | null): Promise<void> {
    if (existingStoragePath) {
      await this.deleteStorageFile(existingStoragePath);
    }
    await this.savePreviewSettings(courseId, {
      previewEnabled: false,
      previewType: null,
      previewVideoUrl: null,
      previewStoragePath: null,
      previewThumbnailUrl: null,
    });
  },
};
