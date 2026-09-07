import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Film,
  RotateCcw,
  Check,
  Save,
  Eye,
  Info,
} from 'lucide-react';
import { Course } from '../../types/database';
import {
  getYouTubeVideoId,
  getVimeoVideoId,
  hasValidCoursePreview,
} from '../../utils/coursePreview';
import { coursePreviewService } from '../../services/coursePreviewService';
import { CoursePreviewPlayer } from '../CoursePreviewPlayer';

interface CoursePreviewVideoSettingsProps {
  course: Course;
  onUpdated?: (updatedCourse: Partial<Course>) => void;
}

type PreviewSourceType = 'youtube' | 'vimeo' | 'upload' | 'none';

export const CoursePreviewVideoSettings: React.FC<CoursePreviewVideoSettingsProps> = ({
  course,
  onUpdated,
}) => {
  // Local state initialized from course
  const initialType: PreviewSourceType = course.previewEnabled && course.previewType
    ? (course.previewType as PreviewSourceType)
    : 'none';

  const [selectedType, setSelectedType] = useState<PreviewSourceType>(initialType);
  const [videoUrl, setVideoUrl] = useState<string>(course.previewVideoUrl || '');
  const [storagePath, setStoragePath] = useState<string | null>(course.previewStoragePath || null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize if course prop changes
  useEffect(() => {
    if (course.previewEnabled && course.previewType) {
      setSelectedType(course.previewType as PreviewSourceType);
      setVideoUrl(course.previewVideoUrl || '');
      setStoragePath(course.previewStoragePath || null);
    } else {
      setSelectedType('none');
      setVideoUrl('');
      setStoragePath(null);
    }
  }, [course.id, course.previewEnabled, course.previewType, course.previewVideoUrl]);

  // Derived validation
  const youtubeId = selectedType === 'youtube' ? getYouTubeVideoId(videoUrl) : null;
  const vimeoId = selectedType === 'vimeo' ? getVimeoVideoId(videoUrl) : null;

  const isValidInput = (): boolean => {
    if (selectedType === 'none') return true;
    if (selectedType === 'youtube') return Boolean(youtubeId);
    if (selectedType === 'vimeo') return Boolean(vimeoId);
    if (selectedType === 'upload') return Boolean(videoUrl && videoUrl.trim().length > 10);
    return false;
  };

  // Handle direct file upload to Firebase Storage
  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const validExtensions = ['.mp4', '.webm', '.mov'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setErrorMessage('Fòma fichye a pa sipòte. Tanpri chwazi yon videyo MP4, WebM, oswa MOV.');
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      setErrorMessage('Fichye a twò lou. Limit maksimòm pou videyo apèsi se 250 MB.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Clean up previous storage file if replacing
      if (storagePath) {
        await coursePreviewService.deleteStorageFile(storagePath);
      }

      const result = await coursePreviewService.uploadPreviewVideo(
        course.id,
        file,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setVideoUrl(result.url);
      setStoragePath(result.storagePath);
      setSelectedType('upload');
      setSuccessMessage('Videyo a telechaje avèk siksè nan Firebase Storage! Peze "Sove Videyo Apèsi" pou konfime.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Echèk pandan telechajman videyo a.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Save changes to Firestore
  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedType === 'youtube') {
      if (!youtubeId) {
        setErrorMessage('Lyen YouTube la pa valab. Tanpri mete yon lyen YouTube ki kòrèk.');
        return;
      }
    } else if (selectedType === 'vimeo') {
      if (!vimeoId) {
        setErrorMessage('Lyen Vimeo a pa valab. Tanpri mete yon lyen Vimeo ki kòrèk.');
        return;
      }
    } else if (selectedType === 'upload') {
      if (!videoUrl) {
        setErrorMessage('Tanpri chwazi epi telechaje yon fichye videyo anvan ou sove.');
        return;
      }
    }

    try {
      setIsSaving(true);
      if (selectedType === 'none') {
        await coursePreviewService.removePreviewVideo(course.id, storagePath);
        onUpdated?.({
          previewEnabled: false,
          previewType: null,
          previewVideoUrl: null,
          previewStoragePath: null,
        });
        setVideoUrl('');
        setStoragePath(null);
        setSuccessMessage('Videyo apèsi a retire avèk siksè.');
      } else {
        const payload = {
          previewEnabled: true,
          previewType: selectedType,
          previewVideoUrl: videoUrl.trim(),
          previewStoragePath: selectedType === 'upload' ? storagePath : null,
        };
        await coursePreviewService.savePreviewSettings(course.id, payload);
        onUpdated?.(payload);
        setSuccessMessage('Videyo apèsi kou a sove avèk siksè nan Firestore!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erè pandan anrejistreman an nan Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove preview video
  const handleRemove = async () => {
    if (!window.confirm('Èske ou sèten ou vle retire videyo apèsi kou sa a?')) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setIsSaving(true);
      await coursePreviewService.removePreviewVideo(course.id, storagePath);
      setSelectedType('none');
      setVideoUrl('');
      setStoragePath(null);
      onUpdated?.({
        previewEnabled: false,
        previewType: null,
        previewVideoUrl: null,
        previewStoragePath: null,
      });
      setSuccessMessage('Videyo apèsi kou a efase nèt.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erè pandan efasman an.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasCurrentPreview = hasValidCoursePreview({
    ...course,
    previewEnabled: selectedType !== 'none',
    previewType: selectedType === 'none' ? null : selectedType,
    previewVideoUrl: videoUrl,
  });

  return (
    <div
      id="course-preview-video-settings"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>Videyo Apèsi Kou a</span>
              {hasCurrentPreview && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Aktif</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defini videyo entwodiksyon piblik la pou vizitè yo ka gade apèsi fòmasyon an anvan yo achte.
            </p>
          </div>
        </div>

        {/* Quick remove button if preview is currently active */}
        {course.previewEnabled && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isSaving || isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Retire Videyo Apèsi</span>
          </button>
        )}
      </div>

      {/* Alert Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {/* Source Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Kalite Videyo (Sous Apèsi a)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* YouTube option */}
          <button
            type="button"
            onClick={() => {
              setSelectedType('youtube');
              setErrorMessage(null);
            }}
            className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'youtube'
                ? 'border-red-500 bg-red-50/70 text-red-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
            <span>YouTube</span>
          </button>

          {/* Vimeo option */}
          <button
            type="button"
            onClick={() => {
              setSelectedType('vimeo');
              setErrorMessage(null);
            }}
            className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'vimeo'
                ? 'border-sky-500 bg-sky-50/70 text-sky-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Film className="w-3.5 h-3.5" />
            </div>
            <span>Vimeo</span>
          </button>

          {/* Upload Videyo option */}
          <button
            type="button"
            onClick={() => {
              setSelectedType('upload');
              setErrorMessage(null);
            }}
            className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'upload'
                ? 'border-blue-500 bg-blue-50/70 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <span>Upload Videyo</span>
          </button>

          {/* Pa gen Videyo option */}
          <button
            type="button"
            onClick={() => {
              setSelectedType('none');
              setErrorMessage(null);
            }}
            className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'none'
                ? 'border-slate-400 bg-slate-200 text-slate-800 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shadow-xs">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <span>Pa gen Videyo Apèsi</span>
          </button>
        </div>
      </div>

      {/* Dynamic Input Sections */}
      {selectedType === 'youtube' && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fadeIn">
          <label className="block text-xs font-bold text-slate-800">
            Lyen Videyo YouTube
          </label>
          <div className="relative">
            <input
              type="text"
              id="admin-course-preview-youtube-input"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="egz: https://www.youtube.com/watch?v=AbCdEfGhIjK oswa https://youtu.be/..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all pr-10"
            />
            {youtubeId && (
              <div className="absolute right-3 top-2.5 text-emerald-600" title="Lyen valab">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Nòt pou YouTube:</strong> Asire w videyo YouTube ou chwazi a pèmèt lekti entegre (embedding). Si mèt videyo a bloke lekti sou lòt sit, YouTube ap refize jwe li.
            </p>
          </div>

          {/* Validation Feedback */}
          {videoUrl.trim() && !youtubeId && (
            <p className="text-xs text-rose-600 font-medium">
              Lyen YouTube la pa valab.
            </p>
          )}

          {/* Live Preview Embed using CoursePreviewPlayer */}
          {youtubeId && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-red-600 fill-current" />
                  <span>Apèsi an dirèk YouTube:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsTesting(!isTesting)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Kache Tès' : 'Teste Videyo'}</span>
                </button>
              </div>
              <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-black shadow-xs border border-slate-200">
                <CoursePreviewPlayer
                  type="youtube"
                  url={videoUrl}
                  title={course.title}
                  courseId={course.id}
                  autoPlay={isTesting}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {selectedType === 'vimeo' && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fadeIn">
          <label className="block text-xs font-bold text-slate-800">
            Lyen Videyo Vimeo
          </label>
          <div className="relative">
            <input
              type="text"
              id="admin-course-preview-vimeo-input"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="egz: https://vimeo.com/123456789"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all pr-10"
            />
            {vimeoId && (
              <div className="absolute right-3 top-2.5 text-emerald-600" title="Lyen valab">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Nòt pou Vimeo:</strong> Asire w paramèt vi prive videyo Vimeo a pèmèt li parèt sou lòt sitwèb (&quot;Anywhere&quot;).
            </p>
          </div>

          {/* Validation Feedback */}
          {videoUrl.trim() && !vimeoId && (
            <p className="text-xs text-rose-600 font-medium">
              Lyen Vimeo a pa valab.
            </p>
          )}

          {/* Live Preview Embed using CoursePreviewPlayer */}
          {vimeoId && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-sky-600 fill-current" />
                  <span>Apèsi an dirèk Vimeo:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsTesting(!isTesting)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Kache Tès' : 'Teste Videyo'}</span>
                </button>
              </div>
              <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-black shadow-xs border border-slate-200">
                <CoursePreviewPlayer
                  type="vimeo"
                  url={videoUrl}
                  title={course.title}
                  courseId={course.id}
                  autoPlay={isTesting}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {selectedType === 'upload' && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fadeIn">
          <label className="block text-xs font-bold text-slate-800">
            Telechaje Videyo Apèsi (Firebase Storage)
          </label>

          <input
            type="file"
            ref={fileInputRef}
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* Drag and drop upload box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelected(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">
              Glise yon fichye videyo la, oswa klike pou w chwazi
            </p>
            <p className="text-[11px] text-slate-500 mb-4">
              Fòma aksepte: MP4, WebM, MOV (Nou rekòmande MP4). Gwosè maksimòm: 250 MB.
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{videoUrl ? 'Ranplase Videyo' : 'Chwazi Videyo'}</span>
            </button>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Telechajman nan Firebase Storage...</span>
                <span>{uploadProgress || 0}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress || 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview of current uploaded video using CoursePreviewPlayer */}
          {videoUrl && !isUploading && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-blue-600 fill-current" />
                  <span>Videyo aktyèl ki telechaje a:</span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTesting(!isTesting)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isTesting ? 'Kache Tès' : 'Teste Videyo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    Ranplase
                  </button>
                </div>
              </div>
              <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-black shadow-xs border border-slate-200">
                <CoursePreviewPlayer
                  type="upload"
                  url={videoUrl}
                  title={course.title}
                  courseId={course.id}
                  autoPlay={isTesting}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {selectedType === 'none' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
          <p className="font-semibold text-slate-800">Pa gen videyo apèsi aktive pou kou sa a.</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kout bouton &quot;Gade Apèsi&quot; a pap parèt sou paj kou a ni sou kat kou a. Vizitè yo pral wè sèlman foto ilistrasyon an.
          </p>
        </div>
      )}

      {/* Save Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="text-[11px] text-slate-400">
          Chanjman yo ap sove dirèkteman nan dokiman fòmasyon an nan Firestore.
        </div>

        <div className="flex items-center gap-2">
          {selectedType !== 'none' && isValidInput() && (
            <button
              type="button"
              onClick={() => setIsTesting(!isTesting)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>{isTesting ? 'Fèmen Tès' : 'Teste Videyo'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading || (selectedType !== 'none' && !isValidInput())}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Anrejistreman...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Sove Videyo Apèsi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
