import React, { useRef, useState } from 'react';
import { Upload, X, FileCheck2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadStudioFiles } from '../../services/api';

interface FileDropzoneProps {
  scope: string;
  accept?: string;
  maxFiles?: number;
  maxMb?: number;
  uploadedUrls: string[];
  onUploaded: (urls: string[]) => void;
  helperText?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  scope,
  accept = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,application/pdf',
  maxFiles = 5,
  maxMb = 35,
  uploadedUrls,
  onUploaded,
  helperText,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    const chosen = Array.from(fileList);
    if (uploadedUrls.length + chosen.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    const oversized = chosen.find((f) => f.size > maxMb * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" exceeds the ${maxMb} MB file upload limit. For larger raw videos, paste a secure cloud link below.`);
      return;
    }

    try {
      setUploading(true);
      const res = await uploadStudioFiles(chosen, scope);
      const next = [...uploadedUrls, ...res.map((r) => r.url)];
      onUploaded(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
        className="rounded-xl border border-dashed border-zinc-700 bg-[#0d0d11] p-6 text-center hover:border-[#D4AF37]/70 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-[#D4AF37]" />
          )}
          <p className="text-sm font-medium text-zinc-200">
            {uploading ? 'Validating and encrypting upload...' : 'Drag & drop files or browse'}
          </p>
          <p className="text-xs text-zinc-500">
            {helperText || `Up to ${maxFiles} files · Max ${maxMb} MB each (JPG, PNG, WEBP, MP4, MOV, PDF)`}
          </p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-2 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Choose Files
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-800/60 px-3 py-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-1.5">
          {uploadedUrls.map((url, idx) => (
            <div
              key={`${url}_${idx}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-[#121217] border border-zinc-800 px-3 py-2 text-xs"
            >
              <span className="flex items-center gap-2 text-zinc-200 truncate">
                <FileCheck2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="truncate">{url.split('/').pop()}</span>
              </span>
              <button
                type="button"
                aria-label="Remove uploaded file"
                onClick={() => onUploaded(uploadedUrls.filter((_, i) => i !== idx))}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
