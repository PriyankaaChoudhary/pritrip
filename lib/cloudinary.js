/**
 * Uploads a file directly to Cloudinary using an unsigned preset.
 * Returns a Promise that resolves to { url, public_id, type, width, height, bytes }.
 *
 * onProgress receives a number 0-100 as the upload proceeds.
 */
export function uploadToCloudinary(file, onProgress) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return Promise.reject(new Error('Cloudinary not configured. Check .env.local'));
  }

  // Determine resource type: image or video
  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            url:       result.secure_url,
            public_id: result.public_id,
            type:      resourceType,
            width:     result.width,
            height:    result.height,
            bytes:     result.bytes,
            format:    result.format,
            duration:  result.duration, // only for videos
          });
        } catch (e) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        let msg = 'Upload failed';
        try {
          const err = JSON.parse(xhr.responseText);
          if (err.error?.message) msg = err.error.message;
        } catch {}
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', url);
    xhr.send(formData);
  });
}

/**
 * Returns an optimized URL for an image with automatic format/quality.
 * Cloudinary transforms images on the fly — no pre-processing needed.
 */
export function cldThumb(url, { width = 400, height = 300 } = {}) {
  if (!url || !url.includes('/upload/')) return url;
  const transformation = `c_fill,f_auto,q_auto,w_${width},h_${height}`;
  return url.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * File validation.
 */
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 100;

export function validateFile(file) {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    return { ok: false, error: 'Only images and videos are supported' };
  }

  const maxMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  const sizeMB = file.size / (1024 * 1024);

  if (sizeMB > maxMB) {
    return {
      ok: false,
      error: `File too large — ${sizeMB.toFixed(1)}MB exceeds ${maxMB}MB limit for ${isVideo ? 'videos' : 'images'}`,
    };
  }

  return { ok: true, isVideo, isImage };
}