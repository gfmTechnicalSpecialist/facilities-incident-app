import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { getUploadAttachmentsUrl } from '../lib/apiBase';
import type { IncidentAttachmentFile } from '../types';

type AttachmentsMode = 'view' | 'instant' | 'staged';

interface AttachmentsPanelProps {
  incidentId: string;
  attachments: IncidentAttachmentFile[];
  /** @default "view" — only lists existing attachments, no file picker or upload. */
  mode?: AttachmentsMode;
  /** Called when files are staged for deferred upload (mode="staged"). */
  onFilesChange?: (files: File[]) => void;
  /** Called after a successful instant upload (mode="instant"). */
  onUploaded?: () => void;
  /** Pre-populate the pending file list (used in mode="staged" when parent manages state). */
  stagedFiles?: File[];
}

export function AttachmentsPanel({
  incidentId,
  attachments,
  mode = 'view',
  onFilesChange,
  onUploaded,
  stagedFiles,
}: AttachmentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPick = mode === 'instant' || mode === 'staged';
  const pendingFiles = mode === 'staged' && stagedFiles ? stagedFiles : selectedFiles;

  // Sync staged files prop -> internal state for instant mode is not needed,
  // but for staged mode the parent owns the state via stagedFiles prop.
  useEffect(() => {
    if (mode === 'instant') {
      // reset internal state when incident changes (mode=instant re-mounts anyway but be safe)
      setSelectedFiles([]);
      setError(null);
    }
  }, [incidentId, mode]);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (mode === 'staged') {
      const combined = [...(stagedFiles ?? []), ...files];
      onFilesChange?.(combined);
    } else {
      setSelectedFiles((previous) => [...previous, ...files]);
    }
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeSelected(index: number) {
    if (mode === 'staged') {
      const next = (stagedFiles ?? []).filter((_, i) => i !== index);
      onFilesChange?.(next);
    } else {
      setSelectedFiles((previous) => previous.filter((_, i) => i !== index));
    }
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));
      const res = await fetch(getUploadAttachmentsUrl(incidentId), {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setSelectedFiles([]);
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachments.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="card">
      <h3>Attachments</h3>
      {attachments.length > 0 ? (
        <ul className="attachment-list">
          {attachments.map((att, i) => (
            <li key={`${att.url}-${i}`}>
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                <FileText size={14} />
                <span>{att.fileName}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">No attachments uploaded yet.</p>
      )}

      {canPick && (
        <div className="attachment-upload no-print">
          <label htmlFor={inputId} className="outline-button attachment-file-picker">
            <Upload size={16} /> Choose files
            <input id={inputId} ref={fileInputRef} type="file" multiple onChange={handleFileSelect} hidden />
          </label>

          {pendingFiles.length > 0 && (
            <ul className="attachment-pending-list">
              {pendingFiles.map((file, i) => (
                <li key={`${file.name}-${i}`}>
                  <span>{file.name}</span>
                  <button type="button" className="ghost-button attachment-remove-btn" onClick={() => removeSelected(i)} aria-label={`Remove ${file.name}`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="form-error">{error}</p>}

          {mode === 'instant' && pendingFiles.length > 0 && (
            <button type="button" className="solid-button" disabled={uploading} onClick={handleUpload}>
              {uploading ? 'Uploading…' : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
