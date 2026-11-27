import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { CustomerReview } from '../../types/studio';
import { formatStudioDate } from '../../services/studioService';
import { ProtectedMedia } from '../common/ProtectedMedia';

interface ReviewCardProps {
  review: CustomerReview;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <article className="rounded-2xl bg-[#101014] border border-zinc-800/90 p-6 flex flex-col justify-between gap-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">{review.displayName}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <span>{review.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatStudioDate(review.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0" aria-label={`${review.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? 'fill-[#D4AF37] text-[#D4AF37]'
                    : 'text-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">{review.reviewText}</p>

        {review.photoUrls && review.photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {review.photoUrls.map((url, i) => (
              <button
                key={`${url}_${i}`}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="rounded-lg overflow-hidden border border-zinc-800 hover:border-[#D4AF37]/60 transition-colors cursor-pointer"
              >
                <ProtectedMedia
                  url={url}
                  alt={`Review photo ${i + 1} by ${review.displayName}`}
                  className="w-full h-20 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {review.adminReply && (
        <div className="rounded-xl bg-[#16161d] border border-zinc-800 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#D4AF37]">SRI EDITING STUDIO Reply</span>
            {review.adminReplyAt && (
              <span className="text-zinc-500 tabular-nums">
                {formatStudioDate(review.adminReplyAt)}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{review.adminReply}</p>
        </div>
      )}

      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 border border-zinc-700 text-white hover:border-[#D4AF37] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <ProtectedMedia
              url={lightboxUrl}
              alt="Review photo full preview"
              className="max-h-[82vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </article>
  );
};
