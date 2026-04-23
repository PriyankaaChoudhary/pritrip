'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, X, Star, Edit3, Trash2, GripVertical,
  Image as ImageIcon, Film, Loader2, AlertCircle, Check
} from 'lucide-react';
import { uploadToCloudinary, validateFile, cldThumb, MAX_IMAGE_MB, MAX_VIDEO_MB } from '@/lib/cloudinary';
import { ConfirmDialog } from './confirm-dialog';
import { useToast } from './toast';
import {
  recordUploadAction,
  addTripPhotoAction,
  updateTripPhotoAction,
  deleteTripPhotoAction,
  reorderTripPhotosAction,
} from '../trips/[id]/media-actions';

/**
 * Gallery component for a single trip.
 * Props:
 *   tripId — uuid
 *   initialPhotos — array of photo rows
 *   disabled — true if trip isn't saved yet
 */
export function PhotoGallery({ tripId, initialPhotos = [], disabled = false }) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadingFiles, setUploadingFiles] = useState([]); // [{id, name, progress, error}]
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const fileInputRef = useRef();

  /* ============ Upload handling ============ */
  const handleFiles = useCallback(async (fileList) => {
    if (disabled) {
      toast({ kind: 'err', text: 'Save the trip first before uploading photos' });
      return;
    }

    const files = Array.from(fileList);
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.ok) {
        toast({ kind: 'err', text: `${file.name}: ${validation.error}` });
        continue;
      }
      uploadSingleFile(file);
    }
  }, [disabled, tripId]); // eslint-disable-line

  async function uploadSingleFile(file) {
    const tempId = Math.random().toString(36).slice(2);
    setUploadingFiles(cur => [...cur, { id: tempId, name: file.name, progress: 0 }]);

    try {
      const result = await uploadToCloudinary(file, (p) => {
        setUploadingFiles(cur => cur.map(u => u.id === tempId ? { ...u, progress: p } : u));
      });

      // Record in DB
      const recRes = await recordUploadAction(result);
      if (!recRes.ok) throw new Error(recRes.error);

      // Link to trip as a photo
      const shouldBeHero = photos.length === 0; // first photo = hero
      const photoRes = await addTripPhotoAction({
        tripId,
        uploadId: recRes.upload.id,
        url: result.url,
        caption: null,
        altText: null,
        isHero: shouldBeHero,
      });
      if (!photoRes.ok) throw new Error(photoRes.error);

      setPhotos(cur => [...cur, photoRes.photo]);
      setUploadingFiles(cur => cur.filter(u => u.id !== tempId));
      toast({ kind: 'ok', text: `Uploaded ${file.name}` });
    } catch (err) {
      setUploadingFiles(cur => cur.map(u =>
        u.id === tempId ? { ...u, error: err.message } : u
      ));
      toast({ kind: 'err', text: `${file.name}: ${err.message}` });
      // Keep error visible for 5 seconds then remove
      setTimeout(() => {
        setUploadingFiles(cur => cur.filter(u => u.id !== tempId));
      }, 5000);
    }
  }

  /* ============ Drag over zone ============ */
  function onDropZoneDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }
  function onDropZoneDragOver(e) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  /* ============ Edit photo dialog ============ */
  async function savePhotoEdit(updates) {
    const res = await updateTripPhotoAction({
      photoId: editingPhoto.id,
      tripId,
      caption: updates.caption,
      altText: updates.alt_text,
      isHero: updates.is_hero,
    });
    if (res.ok) {
      setPhotos(cur => cur.map(p => {
        if (p.id === editingPhoto.id) {
          return { ...p, ...updates };
        }
        // If marking hero, clear other heroes locally too
        if (updates.is_hero && p.is_hero) return { ...p, is_hero: false };
        return p;
      }));
      setEditingPhoto(null);
      toast({ kind: 'ok', text: 'Photo updated' });
    } else {
      toast({ kind: 'err', text: res.error });
    }
  }

  /* ============ Delete photo ============ */
  async function doDelete() {
    const photo = confirmDelete;
    const res = await deleteTripPhotoAction({ photoId: photo.id, tripId });
    if (res.ok) {
      setPhotos(cur => cur.filter(p => p.id !== photo.id));
      setConfirmDelete(null);
      toast({ kind: 'ok', text: 'Photo removed' });
    } else {
      toast({ kind: 'err', text: res.error });
    }
  }

  /* ============ Reorder via drag ============ */
  function onCardDragStart(id) {
    return (e) => {
      setDraggingId(id);
      e.dataTransfer.effectAllowed = 'move';
    };
  }
  function onCardDragOver(id) {
    return (e) => {
      e.preventDefault();
      if (id !== draggingId) setDragOverId(id);
    };
  }
  async function onCardDrop(targetId) {
    return async (e) => {
      e.preventDefault();
      if (!draggingId || draggingId === targetId) {
        setDraggingId(null); setDragOverId(null);
        return;
      }

      const srcIdx = photos.findIndex(p => p.id === draggingId);
      const tgtIdx = photos.findIndex(p => p.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return;

      const next = [...photos];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, moved);
      setPhotos(next);
      setDraggingId(null); setDragOverId(null);

      const res = await reorderTripPhotosAction({
        tripId,
        orderedIds: next.map(p => p.id),
      });
      if (!res.ok) {
        toast({ kind: 'err', text: 'Reorder failed — refreshing order' });
      }
    };
  }

  function onCardDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  /* ============ Render ============ */
  if (disabled) {
    return (
      <div className="bg-base border-2 border-dashed border-default rounded-xl p-8 text-center">
        <ImageIcon size={32} className="mx-auto text-faint mb-3" strokeWidth={1.5}/>
        <div className="text-sm font-semibold text-ink mb-1">Save the trip first</div>
        <p className="text-xs text-muted">
          Once this trip has a title and region saved, you can upload photos here.
        </p>
      </div>
    );
  }

  const hasContent = photos.length > 0 || uploadingFiles.length > 0;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={onDropZoneDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropZoneDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative bg-base border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
          ${dragOver
            ? 'border-lime bg-lime-soft scale-[1.01]'
            : 'border-default hover:border-lime hover:bg-hover'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-lime' : 'text-muted'}`} strokeWidth={1.8}/>
        <div className="text-sm font-semibold text-ink mb-0.5">
          {dragOver ? 'Drop to upload' : 'Drop photos or videos here'}
        </div>
        <div className="text-[11px] text-muted font-mono">
          click to browse · images up to {MAX_IMAGE_MB}MB · videos up to {MAX_VIDEO_MB}MB
        </div>
      </div>

      {/* In-progress uploads */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-1.5">
          {uploadingFiles.map(u => (
            <div key={u.id} className="bg-raised border border-default rounded-lg p-2.5 flex items-center gap-2.5">
              {u.error
                ? <AlertCircle size={14} className="text-cherry shrink-0" />
                : <Loader2 size={14} className="text-lime animate-spin shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-ink truncate">{u.name}</div>
                {!u.error && (
                  <div className="mt-1 h-0.5 bg-default rounded-full overflow-hidden">
                    <div className="h-full bg-lime transition-all" style={{ width: `${u.progress}%` }}/>
                  </div>
                )}
                {u.error && (
                  <div className="text-xs text-cherry mt-0.5">{u.error}</div>
                )}
              </div>
              {!u.error && (
                <span className="text-[10px] font-mono text-muted">{u.progress}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted flex items-center justify-between">
            <span>{photos.length} photo{photos.length === 1 ? '' : 's'}</span>
            <span className="opacity-60">drag to reorder</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {photos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onEdit={() => setEditingPhoto(photo)}
                onDelete={() => setConfirmDelete(photo)}
                isDragging={draggingId === photo.id}
                isDragOver={dragOverId === photo.id}
                onDragStart={onCardDragStart(photo.id)}
                onDragOver={onCardDragOver(photo.id)}
                onDrop={onCardDrop(photo.id)}
                onDragEnd={onCardDragEnd}
              />
            ))}
          </div>
        </>
      )}

      {/* Edit dialog */}
      {editingPhoto && (
        <EditPhotoDialog
          photo={editingPhoto}
          onSave={savePhotoEdit}
          onCancel={() => setEditingPhoto(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this photo?"
        description="The file stays on Cloudinary but is disconnected from this trip."
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/* ============ Single photo card ============ */
function PhotoCard({ photo, onEdit, onDelete, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const isVideo = photo.uploads?.type === 'video';
  const thumbUrl = isVideo ? photo.url : cldThumb(photo.url, { width: 400, height: 300 });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`
        relative group aspect-[4/3] rounded-xl overflow-hidden border-2 bg-hover transition cursor-move
        ${isDragging ? 'opacity-40' : ''}
        ${isDragOver ? 'border-lime ring-2 ring-lime' : 'border-default'}
      `}
    >
      {/* Thumb */}
      {isVideo ? (
        <video
          src={photo.url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbUrl}
          alt={photo.alt_text || ''}
          className="w-full h-full object-cover"
        />
      )}

      {/* Type indicator */}
      {isVideo && (
        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
          <Film size={10}/> Video
        </div>
      )}

      {/* Hero star */}
      {photo.is_hero && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-sun text-ink flex items-center justify-center" title="Hero photo">
          <Star size={11} fill="currentColor" strokeWidth={0}/>
        </div>
      )}

      {/* Drag handle */}
      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ left: isVideo ? '3.5rem' : '0.375rem' }}>
        <GripVertical size={12}/>
      </div>

      {/* Bottom gradient + caption */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pb-2 pt-8 opacity-0 group-hover:opacity-100 transition">
        <div className="text-white text-[11px] truncate">
          {photo.caption || <span className="italic opacity-60">no caption</span>}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute inset-x-0 bottom-0 p-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex-1 bg-white/90 hover:bg-white text-ink rounded-md text-xs font-semibold py-1 transition inline-flex items-center justify-center gap-1"
        >
          <Edit3 size={11}/> Edit
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="bg-white/90 hover:bg-cherry hover:text-white text-ink rounded-md text-xs font-semibold py-1 px-2 transition"
          title="Remove"
        >
          <Trash2 size={11}/>
        </button>
      </div>
    </div>
  );
}

/* ============ Edit photo dialog ============ */
function EditPhotoDialog({ photo, onSave, onCancel }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [altText, setAltText] = useState(photo.alt_text || '');
  const [isHero, setIsHero] = useState(!!photo.is_hero);
  const [saving, setSaving] = useState(false);
  const isVideo = photo.uploads?.type === 'video';

  async function handleSubmit() {
    setSaving(true);
    await onSave({ caption, alt_text: altText, is_hero: isHero });
    setSaving(false);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !saving && onCancel()}
    >
      <div
        className="w-full max-w-lg bg-raised border-2 border-default rounded-3xl p-6 shadow-popover"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-extrabold text-ink">Edit photo</h2>
          <button onClick={() => !saving && onCancel()} className="text-muted hover:text-ink transition p-1">
            <X size={18}/>
          </button>
        </div>

        <div className="aspect-video bg-hover rounded-xl overflow-hidden mb-4">
          {isVideo ? (
            <video src={photo.url} controls className="w-full h-full object-contain"/>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cldThumb(photo.url, { width: 800, height: 450 })} alt="" className="w-full h-full object-contain"/>
          )}
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-[11px] font-mono uppercase tracking-[1.5px] text-muted mb-1.5">Caption</span>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Shown under the photo on the public site"
              className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none text-ink placeholder:text-faint"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-mono uppercase tracking-[1.5px] text-muted mb-1.5">Alt text</span>
            <input
              type="text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="What's in the photo (for screen readers + SEO)"
              className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none text-ink placeholder:text-faint"
            />
            <span className="block text-[10px] text-faint mt-1 font-mono">
              Google reads this · describe the photo plainly
            </span>
          </label>

          {!isVideo && (
            <button
              type="button"
              onClick={() => setIsHero(!isHero)}
              className={`
                w-full flex items-center gap-2.5 p-3 rounded-xl border-2 transition text-left
                ${isHero
                  ? 'bg-sun/15 border-sun text-ink'
                  : 'bg-base border-default text-secondary hover:border-strong'}
              `}
            >
              <Star size={16} className={isHero ? 'fill-sun text-sun' : ''}/>
              <span className="text-sm font-semibold flex-1">
                {isHero ? 'Hero photo' : 'Make hero photo'}
              </span>
              {isHero && <Check size={14} className="text-sun"/>}
            </button>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={() => !saving && onCancel()}
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-full border border-default hover:border-ink text-ink transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm font-bold px-5 py-2 rounded-full bg-lime text-inverse-text transition active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}