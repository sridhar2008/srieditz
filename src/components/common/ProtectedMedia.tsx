import React, { useEffect, useState } from 'react';
import { FileText, Film, Image as ImageIcon } from 'lucide-react';
import { getProtectedMediaUrl } from '../../services/api';

interface ProtectedMediaProps {
  url: string;
  alt: string;
  className?: string;
  previewOnly?: boolean;
}

export const ProtectedMedia: React.FC<ProtectedMediaProps> = ({
  url,
  alt,
  className = 'w-full h-36 object-cover rounded-lg',
  previewOnly = false,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    getProtectedMediaUrl(url).then((next) => {
      if (active) setResolvedUrl(next);
    });
    return () => {
      active = false;
    };
  }, [url]);

  const lower = url.toLowerCase();
  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
  const isPdf = lower.endsWith('.pdf');

  if (isPdf) {
    return (
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 p-3 rounded-lg bg-[#16161b] border border-zinc-800 hover:border-[#D4AF37] text-xs text-zinc-200 transition-colors"
      >
        <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span className="truncate">{alt || 'Reference PDF Document'}</span>
      </a>
    );
  }

  if (isVideo) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-black border border-zinc-800 w-full h-full">
        <video
          src={resolvedUrl}
          controls={!previewOnly}
          muted={previewOnly}
          playsInline
          preload="metadata"
          className={className}
          onError={() => setFailed(true)}
        />
        {failed && (
          <div className="p-4 flex items-center gap-2 text-xs text-zinc-400">
            <Film className="w-4 h-4 text-[#D4AF37]" />
            <span>Protected video attachment</span>
          </div>
        )}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex items-center justify-center p-6 rounded-lg bg-[#16161b] border border-zinc-800 text-zinc-500 text-xs gap-2">
        <ImageIcon className="w-4 h-4" />
        <span>Preview unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
