import { useRef, useState, type ChangeEvent } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { getUploadAttachmentsUrl } from '../lib/apiBase';
import type { IncidentAttachmentFile } from '../types';

interface AttachmentsPanelProps {
  incidentId: string;
  attachments: IncidentAttachmentFile[];
  canUpload?: boolean;
  onUploaded?: () => void;
}

export function AttachmentsPanel({ incidentId, attachments, canUpload = false, onUploaded }: AttachmentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles((previous) => [...previous, ...files]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeSelected(index: number) {
    setSelectedFiles((previous) => previous.filter((_, i) => i !== index));
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

      {canUpload && (
        <div className="attachment-upload no-print">
          <label className="outline-button attachment-file-picker">
            <Upload size={16} /> Choose files
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} hidden />
          </label>

          {selectedFiles.length > 0 && (
            <ul className="attachment-pending-list">
              {selectedFiles.map((file, i) => (
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

          {selectedFiles.length > 0 && (
            <button type="button" className="solid-button" disabled={uploading} onClick={handleUpload}>
              {uploading ? 'Uploading…' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
