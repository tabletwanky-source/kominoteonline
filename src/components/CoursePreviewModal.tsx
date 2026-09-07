import React, { useEffect } from 'react';
import { X, Play, ShieldCheck, Film } from 'lucide-react';
import { Course } from '../types/database';
import { hasValidCoursePreview } from '../utils/coursePreview';
import { CoursePreviewPlayer } from './CoursePreviewPlayer';

interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !course || !hasValidCoursePreview(course)) {
    return null;
  }

  const { previewType, previewVideoUrl } = course;

  return (
    <div
      id="course-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md transition-opacity animate-fadeIn overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        id="course-preview-modal-content"
        style={{ width: 'min(94vw, 900px)' }}
        className="relative bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h2
                id="preview-modal-title"
                className="text-sm sm:text-base font-bold text-white truncate"
              >
                Apèsi Videyo Kou a
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-md">
                {course.title}
              </p>
            </div>
          </div>

          {/* Close button with accessible >=44px touch target */}
          <button
            id="preview-modal-close-btn"
            onClick={onClose}
            aria-label="Fèmen videyo apèsi"
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container (16:9 ratio, responsive) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <CoursePreviewPlayer
            type={previewType}
            url={previewVideoUrl}
            title={course.title}
            courseId={course.id}
            autoPlay={true}
          />
        </div>

        {/* Footer Badge / Trust Notice */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize">
              Sous: {previewType === 'upload' ? 'Fichye Telechaje' : previewType}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Kominote Online • Apèsi Ofisyèl</span>
          </div>
        </div>
      </div>
    </div>
  );
};
