import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ReviewCard } from '../../components/reviews/ReviewCard';
import { FileDropzone } from '../../components/common/FileDropzone';
import {
  submitCustomerReview,
  subscribeCustomerProjects,
} from '../../services/studioService';
import { CustomerReview, EditingProject } from '../../types/studio';

interface ReviewsPageProps {
  reviews: CustomerReview[];
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ reviews }) => {
  const { user, profile, emailVerified } = useAuth();
  const [customerProjects, setCustomerProjects] = useState<EditingProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    if (profile?.displayName) setDisplayName(profile.displayName);
    else if (user?.displayName) setDisplayName(user.displayName);
  }, [profile, user]);

  useEffect(() => {
    if (!user) {
      setCustomerProjects([]);
      return;
    }
    const unsub = subscribeCustomerProjects(user.uid, (projects) => {
      const completed = projects.filter((p) => p.status === 'Completed');
      setCustomerProjects(completed);
      if (completed.length > 0 && !selectedProjectId) {
        setSelectedProjectId(completed[0].id);
      }
    });
    return () => unsub();
  }, [user]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const paginatedReviews = reviews.slice((page - 1) * pageSize, page * pageSize);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitMessage('');
    if (!user || !emailVerified) {
      setSubmitError('Please sign in with a verified account to submit a review.');
      return;
    }
    const proj = customerProjects.find((p) => p.id === selectedProjectId);
    if (!proj) {
      setSubmitError('Please select one of your completed projects.');
      return;
    }
    if (reviewText.trim().length < 10) {
      setSubmitError('Please write at least 10 characters in your review.');
      return;
    }

    try {
      setSubmitting(true);
      await submitCustomerReview({
        customerId: user.uid,
        displayName: displayName.trim() || 'Verified Client',
        projectId: proj.id,
        category: proj.serviceTitle,
        rating,
        reviewText: reviewText.trim(),
        photoUrls,
      });
      setReviewText('');
      setPhotoUrls([]);
      setSubmitMessage('Your review has been submitted and is awaiting studio approval.');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      {/* Header & Real Rating Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#D4AF37]">Verified Client Feedback</p>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white">
            Customer Reviews
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every review is linked to a completed editing project and moderated before public listing.
          </p>
        </div>

        <div className="rounded-2xl bg-[#101014] border border-zinc-800 px-6 py-4 flex items-center gap-6 shrink-0">
          <div>
            <p className="text-xs text-zinc-400">Average Rating</p>
            <p className="text-3xl font-mono-tabular font-semibold text-[#D4AF37]">
              {averageRating ? `${averageRating} / 5.0` : '—'}
            </p>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div>
            <p className="text-xs text-zinc-400">Approved Reviews</p>
            <p className="text-3xl font-mono-tabular font-semibold text-white">{reviews.length}</p>
          </div>
        </div>
      </div>

      {/* Approved Reviews List */}
      {paginatedReviews.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    page === idx + 1
                      ? 'bg-[#D4AF37] text-black font-semibold'
                      : 'bg-[#101014] border border-zinc-800 text-zinc-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-10 text-center space-y-2">
          <p className="text-base font-medium text-white">No approved reviews published yet.</p>
          <p className="text-sm text-zinc-400">
            Once a client completes an editing project and submits a review, it appears here after studio moderation.
          </p>
        </div>
      )}

      {/* Review Submission Panel for Eligible Customers */}
      <section className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white">Share Your Experience</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Clients with at least one completed editing project can rate the service and attach edited preview photos.
          </p>
        </div>

        {!user ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f]"
            >
              Sign In to Review a Project
            </Link>
          </div>
        ) : customerProjects.length === 0 ? (
          <p className="text-sm text-zinc-400">
            You do not have any completed projects ready to review yet.{' '}
            <Link to="/request-edit" className="text-[#D4AF37] hover:underline">
              Submit a new editing request →
            </Link>
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmitReview(e)} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Completed Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {customerProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n} stars`}
                    onClick={() => setRating(n)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-[#D4AF37] cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        n <= rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Your Review
              </label>
              <textarea
                rows={4}
                required
                minLength={10}
                maxLength={1500}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Describe the quality, turnaround, and communication..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Attach Review Photos (Optional, up to 3)
              </label>
              <FileDropzone
                scope="reviews"
                accept="image/jpeg,image/png,image/webp"
                maxFiles={3}
                maxMb={10}
                uploadedUrls={photoUrls}
                onUploaded={setPhotoUrls}
                helperText="JPG, PNG, or WEBP up to 10 MB each"
              />
            </div>

            {submitError && <p className="text-xs text-red-400">{submitError}</p>}
            {submitMessage && (
              <p className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {submitMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting Review...' : 'Submit Review for Approval'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
