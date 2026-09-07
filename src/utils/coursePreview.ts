import { Course } from '../types/database';

/**
 * Known placeholder / demo video IDs and terms that MUST never be displayed.
 */
const BANNED_PATTERNS = [
  'dQw4w9WgXcQ',
  'never gonna give you up',
  'rick astley',
  'rickroll',
  'samplevideo',
  'demovideo',
  'placeholdervideo',
  'fallbackvideo',
  'defaultvideo',
];

/**
 * Checks whether a given string / URL matches any forbidden placeholder/demo markers.
 */
export function isPlaceholderOrDemoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return BANNED_PATTERNS.some((pattern) => lower.includes(pattern.toLowerCase()));
}

/**
 * Safely extracts a real YouTube video ID (11 characters) from various valid YouTube URL formats.
 * Returns null if the URL is invalid or matches forbidden demo videos (e.g. Rick Astley).
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (isPlaceholderOrDemoUrl(trimmed)) return null;

  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://youtube.com/shorts/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    const id = match[1];
    if (isPlaceholderOrDemoUrl(id)) return null;
    return id;
  }

  // Bare 11-character alphanumeric YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    if (isPlaceholderOrDemoUrl(trimmed)) return null;
    return trimmed;
  }

  return null;
}

export const extractYouTubeVideoId = getYouTubeVideoId;

/**
 * Safely extracts a real Vimeo numeric ID from various Vimeo URL formats.
 * Returns null if the URL is invalid.
 */
export function getVimeoVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (isPlaceholderOrDemoUrl(trimmed)) return null;

  // Handles:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  // - https://vimeo.com/channels/staffpicks/123456789
  const regExp = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]+\/videos\/|video\/|))(\d{6,12})/i;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // Bare numeric ID
  if (/^\d{6,12}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export const extractVimeoVideoId = getVimeoVideoId;

/**
 * Generates an authentic YouTube embed URL without fallbacks.
 */
export function getYouTubeEmbedUrl(urlOrId: string, autoPlay: boolean = false): string | null {
  const videoId = getYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&playsinline=1&modestbranding=1`;
}

/**
 * Generates an authentic Vimeo embed URL without fallbacks.
 */
export function getVimeoEmbedUrl(urlOrId: string, autoPlay: boolean = false): string | null {
  const videoId = getVimeoVideoId(urlOrId);
  if (!videoId) return null;
  return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}&title=0&byline=0&portrait=0`;
}

/**
 * Strictly verifies whether a course has an authentic, admin-configured preview video.
 * Returns false if:
 * - previewEnabled is not strictly true
 * - previewType is missing or not 'youtube' | 'vimeo' | 'upload'
 * - previewVideoUrl is missing, empty, or a known placeholder
 * - URL fails format validation
 */
export function hasValidCoursePreview(course?: Course | null): boolean {
  if (!course) return false;
  if (!course.previewEnabled) return false;
  if (!course.previewType) return false;
  if (!course.previewVideoUrl || typeof course.previewVideoUrl !== 'string') return false;

  const url = course.previewVideoUrl.trim();
  if (isPlaceholderOrDemoUrl(url)) return false;

  if (course.previewType === 'youtube') {
    return extractYouTubeVideoId(url) !== null;
  }

  if (course.previewType === 'vimeo') {
    return extractVimeoVideoId(url) !== null;
  }

  if (course.previewType === 'upload') {
    return url.length > 5 && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('blob:'));
  }

  return false;
}

/**
 * Generates the clean iframe embed URL for supported third-party providers.
 * Returns null for uploaded MP4/WebM videos (which render via native HTML5 <video>).
 */
export function getCoursePreviewEmbedUrl(course: Course): string | null {
  if (!hasValidCoursePreview(course)) return null;

  if (course.previewType === 'youtube') {
    const videoId = extractYouTubeVideoId(course.previewVideoUrl);
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  }

  if (course.previewType === 'vimeo') {
    const videoId = extractVimeoVideoId(course.previewVideoUrl);
    if (!videoId) return null;
    return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }

  return null;
}

/**
 * Sanitizes course preview fields by stripping out any demo/placeholder values.
 */
export function sanitizeCoursePreview(course: Course): Course {
  if (!hasValidCoursePreview(course)) {
    return {
      ...course,
      previewEnabled: false,
      previewType: null,
      previewVideoUrl: null,
      previewStoragePath: course.previewStoragePath || null,
      previewThumbnailUrl: course.previewThumbnailUrl || null,
    };
  }
  return course;
}
