import { supabase } from '../lib/supabase';
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
  async uploadPreviewVideo(
    courseId: string,
    file: File,
    onProgress?: (progressPercent: number) => void
  ): Promise<{ url: string; storagePath: string }> {
    const validMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const validExtensions = ['.mp4', '.webm', '.mov'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!validMimeTypes.includes(file.type) && !hasValidExt) {
      throw new Error('Fòma fichye a pa sipòte. Tanpri chwazi yon videyo MP4, WebM, oswa MOV (Nou rekòmande MP4).');
    }

    const MAX_SIZE_BYTES = 250 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Fichye videyo a twò lou (Limit maksimòm: 250 MB). Eseye konprese videyo a anvan ou telechaje li.');
    }

    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `course-previews/${courseId}/${Date.now()}_${sanitizedFilename}`;

    if (onProgress) onProgress(10);

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(storagePath, file, { contentType: file.type || 'video/mp4' });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Echèk telechajman videyo a: ${error.message || 'Eseye ankò.'}`);
    }

    if (onProgress) onProgress(80);

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(data.path);

    if (onProgress) onProgress(100);

    return { url: urlData.publicUrl, storagePath: data.path };
  },

  async deleteStorageFile(storagePath?: string | null): Promise<void> {
    if (!storagePath || typeof storagePath !== 'string') return;
    try {
      const { error } = await supabase.storage.from('uploads').remove([storagePath]);
      if (error && !error.message.includes('not found')) {
        console.warn('Could not delete storage file:', error.message);
      }
    } catch (err: any) {
      console.warn('Could not delete storage preview file:', err?.message || err);
    }
  },

  async savePreviewSettings(courseId: string, payload: CoursePreviewPayload): Promise<void> {
    const timestamp = new Date().toISOString();
    await coursesService.update(courseId, {
      preview_enabled: payload.previewEnabled,
      preview_type: payload.previewType,
      preview_video_url: payload.previewVideoUrl,
      preview_storage_path: payload.previewStoragePath,
      preview_thumbnail_url: payload.previewThumbnailUrl || null,
      updated_at: timestamp,
    } as Partial<Course>);
  },

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
