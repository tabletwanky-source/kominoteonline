import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { getYouTubeVideoId, getVimeoVideoId } from '../utils/coursePreview';

export interface CoursePreviewPlayerProps {
  type?: 'youtube' | 'vimeo' | 'upload' | 'none' | null;
  url?: string | null;
  title?: string;
  courseId?: string;
  autoPlay?: boolean;
  onPlaybackError?: (details: { previewType: string; provider: string; message: string }) => void;
  className?: string;
}

export const CoursePreviewPlayer: React.FC<CoursePreviewPlayerProps> = ({
  type,
  url,
  title = 'Kou',
  courseId,
  autoPlay = false,
  onPlaybackError,
  className = '',
}) => {
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset errors whenever URL or type changes
  useEffect(() => {
    setPlaybackError(null);
  }, [type, url]);

  if (!type || type === 'none' || !url || typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const trimmedUrl = url.trim();

  // 1. YOUTUBE PROVIDER
  if (type === 'youtube') {
    const videoId = getYouTubeVideoId(trimmedUrl);

    if (!videoId) {
      const errorMsg = 'Lyen YouTube la pa valab.';
      return (
        <div
          id="course-preview-error-youtube-invalid"
          className={`w-full aspect-video bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${className}`}
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{errorMsg}</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Tanpri verifye si lyen YouTube ou a kòrèk (egz: https://www.youtube.com/watch?v=... oswa https://youtu.be/...).
          </p>
        </div>
      );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&playsinline=1&modestbranding=1`;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const handleIframeError = () => {
      const errorMsg = 'Videyo sa a pa pèmèt lekti dirèk sou sit la.';
      console.error('[CoursePreviewPlayer] YouTube iframe playback error:', {
        previewType: 'youtube',
        provider: 'youtube',
        courseId: courseId || 'unspecified',
        urlParsingSucceeded: true,
      });
      setPlaybackError(errorMsg);
      onPlaybackError?.({
        previewType: 'youtube',
        provider: 'youtube',
        message: errorMsg,
      });
    };

    if (playbackError) {
      return (
        <div
          id="course-preview-youtube-restricted"
          className={`w-full aspect-video bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${className}`}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{playbackError}</p>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Mèt videyo a ka dezaktive opsyon lekti entegre (embed) sou lòt sitwèb.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <span>Gade sou YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setPlaybackError(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Eseye Ankò</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full aspect-video bg-black overflow-hidden ${className}`}>
        <iframe
          id="course-preview-youtube-embed"
          src={embedUrl}
          title={`${title} — Apèsi`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={handleIframeError}
        />
      </div>
    );
  }

  // 2. VIMEO PROVIDER
  if (type === 'vimeo') {
    const videoId = getVimeoVideoId(trimmedUrl);

    if (!videoId) {
      const errorMsg = 'Lyen Vimeo a pa valab.';
      return (
        <div
          id="course-preview-error-vimeo-invalid"
          className={`w-full aspect-video bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${className}`}
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{errorMsg}</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Tanpri verifye si lyen Vimeo ou a kòrèk (egz: https://vimeo.com/123456789).
          </p>
        </div>
      );
    }

    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}&title=0&byline=0&portrait=0`;
    const watchUrl = `https://vimeo.com/${videoId}`;

    const handleIframeError = () => {
      const errorMsg = 'Videyo sa a pa disponib pou lekti dirèk sou sit la.';
      console.error('[CoursePreviewPlayer] Vimeo iframe playback error:', {
        previewType: 'vimeo',
        provider: 'vimeo',
        courseId: courseId || 'unspecified',
        urlParsingSucceeded: true,
      });
      setPlaybackError(errorMsg);
      onPlaybackError?.({
        previewType: 'vimeo',
        provider: 'vimeo',
        message: errorMsg,
      });
    };

    if (playbackError) {
      return (
        <div
          id="course-preview-vimeo-restricted"
          className={`w-full aspect-video bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${className}`}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{playbackError}</p>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Mèt videyo Vimeo a ka mete restriksyon sou domèn kote videyo a ka parèt.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <span>Gade sou Vimeo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setPlaybackError(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Eseye Ankò</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full aspect-video bg-black overflow-hidden ${className}`}>
        <iframe
          id="course-preview-vimeo-embed"
          src={embedUrl}
          title={`${title} — Apèsi`}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture; web-share"
          allowFullScreen
          onError={handleIframeError}
        />
      </div>
    );
  }

  // 3. UPLOAD PROVIDER (Native HTML5 <video>)
  if (type === 'upload') {
    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const errorMsg = 'Nou pa t kapab ouvri videyo apèsi sa a.';
      console.error('[CoursePreviewPlayer] Native HTML5 video error:', {
        previewType: 'upload',
        sanitizedProvider: 'upload',
        courseId: courseId || 'unspecified',
        urlParsingSucceeded: Boolean(trimmedUrl),
        mediaError: (e.target as HTMLVideoElement)?.error?.message || 'Media decode or fetch failed',
      });
      setPlaybackError(errorMsg);
      onPlaybackError?.({
        previewType: 'upload',
        provider: 'upload',
        message: errorMsg,
      });
    };

    if (playbackError) {
      return (
        <div
          id="course-preview-error-upload"
          className={`w-full aspect-video bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${className}`}
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{playbackError}</p>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Tanpri verifye koneksyon entènèt ou an oswa kontakte administrasyon an pou verifye fichye videyo a.
          </p>
          <button
            type="button"
            onClick={() => {
              setPlaybackError(null);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rechaje Videyo</span>
          </button>
        </div>
      );
    }

    return (
      <div className={`relative w-full aspect-video bg-black overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          id="course-preview-html5-player"
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          className="w-full h-full object-contain bg-black"
          onError={handleVideoError}
        >
          <source src={trimmedUrl} type="video/mp4" />
          <source src={trimmedUrl} type="video/webm" />
          Fikilè ou a pa sipòte lektè videyo HTML5 la.
        </video>
      </div>
    );
  }

  return null;
};
