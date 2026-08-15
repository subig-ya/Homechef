import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ChatPanel from '../components/chat/ChatPanel';
import {
  Star,
  MapPin,
  CalendarDays,
  Camera,
  ArrowLeft,
  ArrowRight,
  Clock,
  ChefHat,
  Quote,
  UtensilsCrossed,
  Flag,
  X,
  Heart,
  MessageSquareText
} from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200';
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200';
const FALLBACK_DISH = 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=600';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const ChefPublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [reportErr, setReportErr] = useState('');

  const [chatOpen, setChatOpen] = useState(false);

  const [favorited, setFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const isLoggedIn = !!localStorage.getItem('homechef_token');
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('homechef_user') || 'null');
    } catch {
      return null;
    }
  })();
  const isOwnProfile = !!currentUser && currentUser.id === id;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get(`/chefs/${id}`);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this chef');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setFormErr('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setFormMsg('');
    setFormErr('');

    try {
      const token = localStorage.getItem('homechef_token');
      await API.post(
        '/reviews',
        { sellerId: id, rating, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormMsg('Thanks! Your review has been posted.');
      setRating(0);
      setComment('');
      await load();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Unable to post your review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportMsg('');
    setReportErr('');

    try {
      const token = localStorage.getItem('homechef_token');
      await API.post(
        '/reports',
        { targetType: 'CHEF', targetId: id, reason: reportReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportMsg('Report submitted. Our team will review it shortly.');
      setReportReason('');
      setTimeout(() => {
        setReportOpen(false);
        setReportMsg('');
      }, 2000);
    } catch (err) {
      setReportErr(err.response?.data?.message || 'Unable to submit your report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const loadFavoriteState = async (chefId) => {
    const token = localStorage.getItem('homechef_token');
    if (!token) return;
    try {
      const res = await API.get('/favorites', { headers: { Authorization: `Bearer ${token}` } });
      const favs = res.data.data || [];
      setFavorited(favs.some((f) => f.targetType === 'CHEF' && String(f.targetId) === String(chefId)));
    } catch {
      /* keep current state */
    }
  };

  useEffect(() => {
    if (data?.chef?._id && isLoggedIn && !isOwnProfile) {
      loadFavoriteState(data.chef._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoggedIn, isOwnProfile]);

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('homechef_token');
    if (!token || !data?.chef?._id) return;
    setFavoriteLoading(true);
    try {
      const res = await API.post(
        '/favorites/toggle',
        { targetType: 'CHEF', targetId: data.chef._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavorited(res.data.data?.favorited ?? !favorited);
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Unable to update favorites.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF4F7] flex items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-500">Loading chef profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF4F7] flex items-center justify-center px-4">
        <div className="text-center">
          <ChefHat className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-slate-700">{error || 'Chef not found.'}</p>
          <Link to="/chefs" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#4B254B] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to all chefs
          </Link>
        </div>
      </div>
    );
  }

  const { chef, averageRating, reviewCount, ratingBreakdown, dishes, reviews } = data;
  const maxBreakdown = Math.max(1, ...Object.values(ratingBreakdown));

  return (
    <div className="min-h-screen bg-[#FAF4F7] pb-20">
      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link to="/chefs" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-[#4B254B]">
          <ArrowLeft className="h-4 w-4" /> All chefs
        </Link>
      </div>

      {/* Cover + identity */}
      <div className="relative mt-4 h-72 overflow-hidden sm:h-80">
        <img
          src={chef.coverImage || FALLBACK_COVER}
          alt={`${chef.name}'s kitchen`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#381E39]/85 via-[#381E39]/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 pb-7 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <img
                src={chef.profileImage || FALLBACK_AVATAR}
                alt={chef.name}
                className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white object-cover shadow-lg"
              />
              <div className="text-white sm:pb-1">
                <h1 className="text-3xl font-extrabold tracking-tight">{chef.name}</h1>
                {chef.tagline && <p className="mt-1 text-sm text-pink-100/90">{chef.tagline}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-pink-100/80">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {chef.location || 'Home kitchen'}
                  </span>
                  {chef.yearsOfExperience > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {chef.yearsOfExperience} yr{chef.yearsOfExperience !== 1 ? 's' : ''} experience
                    </span>
                  )}
                  {reviewCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      {averageRating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ChefHat className="h-3.5 w-3.5" /> New chef
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-12 lg:col-span-2">
          {/* About */}
          <section>
            <h2 className="text-xl font-extrabold text-[#381E39]">About {chef.name.split(' ')[0]}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              {chef.bio || 'This chef is getting their profile ready.'}
            </p>
            {(chef.cuisines?.length > 0 || chef.specialties?.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chef.cuisines?.map((c) => (
                  <span key={c} className="rounded-lg border border-[#E25C80]/30 bg-white px-3 py-1 text-xs font-semibold text-[#4B254B]">
                    {c}
                  </span>
                ))}
                {chef.specialties?.map((spec) => (
                  <span key={spec} className="rounded-lg border border-pink-100 bg-white px-3 py-1 text-xs font-semibold text-[#4B254B]">
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Their work — portfolio */}
          {chef.portfolio?.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#4B254B]" />
                <h2 className="text-xl font-extrabold text-[#381E39]">Their work</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {chef.portfolio.map((item, i) => (
                  <figure
                    key={i}
                    className="group overflow-hidden rounded-2xl border border-pink-100/80 bg-white"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#FAF4F7]">
                      <img
                        src={item.image}
                        alt={item.title || 'Chef work sample'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <figcaption className="px-5 py-4">
                      {item.title && <p className="text-sm font-bold text-[#381E39]">{item.title}</p>}
                      {item.caption && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.caption}</p>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Menu */}
          {dishes.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-[#4B254B]" />
                <h2 className="text-xl font-extrabold text-[#381E39]">Menu & signature dishes</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {dishes.map((dish) => (
                  <div key={dish._id} className="flex gap-4 rounded-2xl border border-pink-100/80 bg-white p-4">
                    <img
                      src={dish.image || FALLBACK_DISH}
                      alt={dish.name}
                      className="h-24 w-24 shrink-0 rounded-xl border border-pink-100 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#381E39]">{dish.name}</h3>
                        <span className="shrink-0 text-sm font-bold text-[#4B254B]">Rs. {dish.price}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {dish.cuisine} · {dish.categoryId?.name || 'Home cooking'}
                      </p>
                      {dish.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">{dish.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <div className="mb-5 flex items-center gap-2">
              <Quote className="h-5 w-5 text-[#4B254B]" />
              <h2 className="text-xl font-extrabold text-[#381E39]">Reviews from customers</h2>
            </div>

            {reviewCount > 0 && (
              <div className="rounded-2xl border border-pink-100/80 bg-white p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-[#381E39]">{averageRating.toFixed(1)}</p>
                    <div className="mt-1 flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <div key={s} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-6 shrink-0 font-semibold">{s}★</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pink-100">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${((ratingBreakdown[s] || 0) / maxBreakdown) * 100}%` }}
                          />
                        </div>
                        <span className="w-4 shrink-0 text-right">{ratingBreakdown[s] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Review form */}
            {isLoggedIn && !isOwnProfile && (
              <form onSubmit={handleReviewSubmit} className="mt-6 rounded-2xl border border-pink-100/80 bg-white p-6">
                <h3 className="text-sm font-bold text-[#381E39]">Share your experience with {chef.name.split(' ')[0]}</h3>

                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(0)}
                      aria-label={`${s} star${s !== 1 ? 's' : ''}`}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          (hover || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-slate-400">{rating > 0 ? `${rating} of 5` : 'Tap to rate'}</span>
                </div>

                {formMsg && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                    {formMsg}
                  </div>
                )}
                {formErr && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {formErr}
                  </div>
                )}

                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about the food, the cooking, and the experience..."
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 rounded-xl bg-[#4B254B] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#391B39] disabled:opacity-60"
                >
                  {submitting ? 'Posting...' : 'Post review'}
                </button>
              </form>
            )}

            {!isLoggedIn && (
              <p className="mt-6 text-xs text-slate-500">
                <Link to="/login" className="font-bold text-[#4B254B] hover:underline">Log in</Link> to share your experience with this chef.
              </p>
            )}

            {/* Review list */}
            {reviews.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="rounded-2xl border border-pink-100/80 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.customerId?.profileImage || FALLBACK_AVATAR}
                          alt={review.customerId?.name || 'Customer'}
                          className="h-10 w-10 rounded-full border border-pink-100 object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#381E39]">{review.customerId?.name || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-3xl border border-pink-100/80 bg-white p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ready to book?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {chef.name.split(' ')[0]} comes to your home and cooks fresh, so you and your guests can relax.
            </p>
            <button
              onClick={() => navigate(`/bookings?chef=${chef._id}`)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition-colors hover:bg-[#391B39]"
            >
              <CalendarDays className="h-4 w-4" /> Book this chef
            </button>
            {isLoggedIn && !isOwnProfile ? (
              <button
                onClick={() => {
                  setChatOpen(true);
                  setReportErr('');
                  setReportMsg('');
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#4B254B]/20 bg-[#FFF9F5] py-3 text-sm font-bold text-[#4B254B] transition-colors hover:bg-pink-50"
              >
                <MessageSquareText className="h-4 w-4" /> Message {chef.name.split(' ')[0]}
              </button>
            ) : !isLoggedIn ? (
              <Link
                to="/login"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#4B254B]/20 bg-[#FFF9F5] py-3 text-sm font-bold text-[#4B254B] transition-colors hover:bg-pink-50"
              >
                <MessageSquareText className="h-4 w-4" /> Log in to message {chef.name.split(' ')[0]}
              </Link>
            ) : null}
            {isLoggedIn && !isOwnProfile && (
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E25C80]/25 bg-white py-3 text-sm font-bold text-[#4B254B] transition-colors hover:bg-[#FCECEF] disabled:opacity-60"
              >
                <Heart
                  className={`h-4 w-4 ${favorited ? 'fill-[#E25C80] text-[#E25C80]' : 'text-[#E25C80]'}`}
                />
                {favorited ? 'Saved to favorites' : 'Save this chef'}
              </button>
            )}
            <Link
              to="/food"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white py-3 text-sm font-bold text-[#4B254B] transition-colors hover:bg-pink-50"
            >
              Browse their food <ArrowRight className="h-4 w-4" />
            </Link>
            {isLoggedIn && !isOwnProfile && (
              <button
                onClick={() => {
                  setReportOpen(true);
                  setReportErr('');
                  setReportMsg('');
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white py-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <Flag className="h-3.5 w-3.5" /> Report this chef
              </button>
            )}
          </div>

          <div className="rounded-3xl border border-pink-100/80 bg-white p-6 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick facts</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Location</dt>
                <dd className="flex items-center gap-1 font-semibold text-[#381E39]">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {chef.location || 'Home kitchen'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Experience</dt>
                <dd className="font-semibold text-[#381E39]">
                  {chef.yearsOfExperience > 0 ? `${chef.yearsOfExperience} yr${chef.yearsOfExperience !== 1 ? 's' : ''}` : 'Home cook'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Menu items</dt>
                <dd className="font-semibold text-[#381E39]">{dishes.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Work samples</dt>
                <dd className="font-semibold text-[#381E39]">{chef.portfolio?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleReportSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#381E39]">Report {chef.name.split(' ')[0]}</h3>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Let us know why this profile should be reviewed by our team. False reports waste admin time, so please be
              accurate.
            </p>

            {reportMsg && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                {reportMsg}
              </div>
            )}
            {reportErr && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {reportErr}
              </div>
            )}

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows="4"
              required
              minLength={5}
              placeholder="What's the issue? (e.g. inappropriate content, no-show, unsafe behaviour...)"
              className="mt-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Chat drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            style={{ animation: 'none' }}
          >
            <ChatPanel
              otherUser={{
                id: chef._id,
                name: chef.name,
                profileImage: chef.profileImage,
                role: chef.role
              }}
              onClose={() => setChatOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefPublicProfilePage;
