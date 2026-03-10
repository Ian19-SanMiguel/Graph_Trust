import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCartStore } from "../stores/useCartStore";
import { ChevronLeft, ChevronRight, Flag, MessageSquareText, ShoppingCart, Star, Store } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { formatPrice } from "../lib/price";
import ReportModal from "../components/ReportModal";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [shopSnapshot, setShopSnapshot] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showReportModal, setShowReportModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const { addToCart } = useCartStore();
  const { user, checkAuth } = useUserStore();
  const navigate = useNavigate();

  const existingUserReview = user ? reviews.find((review) => review.userId === user._id) : null;

  const fetchReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const reviewsResponse = await axios.get(`/reviews/product/${productId}`);
      setReviews(reviewsResponse.data?.reviews || []);
      setReviewSummary(reviewsResponse.data?.summary || { averageRating: 0, totalReviews: 0 });
    } catch {
      setReviews([]);
      setReviewSummary({ averageRating: 0, totalReviews: 0 });
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatReviewDate = (timestamp) => {
    const seconds = timestamp?.seconds;
    if (!seconds) return "Recently";

    const date = new Date(seconds * 1000);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getStarType = (ratingValue, starPosition) => {
    if (ratingValue >= starPosition) {
      return "full";
    }

    if (ratingValue >= starPosition - 0.5) {
      return "half";
    }

    return "empty";
  };

  const renderStarIcon = (starType, size) => {
    const fillWidth = starType === "full" ? "100%" : starType === "half" ? "50%" : "0%";

    return (
      <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <Star size={size} className="text-gray-500" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: fillWidth }}>
          <Star size={size} className="fill-yellow-400 text-yellow-400" />
        </span>
      </span>
    );
  };

  const fetchShopSnapshot = async (shopId) => {
    if (!shopId) {
      setShopSnapshot(null);
      return;
    }

    try {
      const res = await axios.get(`/products/shop/${shopId}`);
      setShopSnapshot({
        shop: res.data?.shop || null,
        productsCount: Array.isArray(res.data?.products) ? res.data.products.length : 0,
      });
    } catch {
      setShopSnapshot(null);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/products/${id}`);
        setProduct(res.data);
        setSelectedImage(res.data?.image || "");
        await fetchReviews(id);
        await fetchShopSnapshot(res.data?.shopId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (submittingReview) {
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await axios.post("/reviews", {
        productId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      const trustSource = String(response.data?.trustSource || "").toLowerCase();
      const trustUpdated = Boolean(response.data?.trustUpdated);
      const reviewMessage = response.data?.message || "Review submitted";

      if (trustSource === "ai") {
        toast.success(`${reviewMessage} • AI trust scoring applied.`);
      } else if (trustSource === "fallback") {
        toast.success(`${reviewMessage} • AI unavailable, fallback trust update used.`);
      } else if (!trustUpdated) {
        toast("Review saved. AI trust scoring is currently unavailable.", { icon: "⚠️" });
      } else {
        toast.success(reviewMessage);
      }
      setReviewForm((prev) => ({ ...prev, comment: "" }));
      await fetchReviews(id);
      await checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitProductReport = async (reasons) => {
    if (!user) {
      toast.error("Please login to submit a report");
      return;
    }

    await axios.post("/reports", {
      targetType: "product",
      targetId: id,
      targetName: product?.name || "Product",
      reasons,
    });

    toast.success("Report submitted. Thanks for helping keep GraphTrust safe.");
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  const liveShop = shopSnapshot?.shop || {};
  const liveStats = liveShop?.stats || {};
  const shopName = liveShop.shopName || product.shopName || "Shop";
  const ratingLabel = liveStats.ratingsDisplay || "No ratings";
  const productsLabel = Number.isFinite(shopSnapshot?.productsCount) ? shopSnapshot.productsCount : 0;
  const responseRateLabel = liveStats.responseRate || "N/A";
  const soldLabel = Number(liveStats.sold || 0);
  const followersLabel = Number(liveStats.followers || 0);
  const isOwnProduct = Boolean(user && product?.shopId && String(product.shopId) === String(user._id));
  const galleryImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images.filter(Boolean)
    : [product?.image].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-5 md:p-7">
          <div className="grid gap-8 lg:grid-cols-[390px_1fr]">
            <div>
              <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900/60">
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="h-[440px] w-full object-cover"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {galleryImages.slice(0, 8).map((imageUrl, index) => {
                    const active = (selectedImage || product.image) === imageUrl;
                    return (
                      <button
                        key={`${imageUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(imageUrl)}
                        className={`overflow-hidden rounded-md border transition ${
                          active ? "border-accent-500" : "border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="h-16 w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-4xl font-bold text-white">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const starType = getStarType(Number(reviewSummary.averageRating || 0), value);
                    return <span key={`summary-star-${value}`}>{renderStarIcon(starType, 14)}</span>;
                  })}
                </span>
                <span>{reviewSummary.averageRating.toFixed(1)}</span>
                <span>|</span>
                <span>{reviewSummary.totalReviews} rating{reviewSummary.totalReviews === 1 ? "" : "s"}</span>
              </div>

              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-300">{product.description}</p>

              <div className="mt-5">
                {product.shopId ? (
                  <Link
                    to={`/shop/${product.shopId}`}
                    className="inline-flex items-center gap-2 text-accent-300 hover:text-accent-200"
                  >
                    <Store size={16} />
                    Visit {shopName}
                  </Link>
                ) : (
                  <p className="text-gray-400">Shop not available</p>
                )}
              </div>

              <p className="mt-4 text-4xl font-black text-accent-400">₱ {formatPrice(product.price)}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded border border-gray-700 bg-gray-900/70">
                  <button
                    type="button"
                    onClick={() => setPurchaseQuantity((prev) => Math.max(1, prev - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center text-gray-200 hover:bg-gray-800"
                    aria-label="Decrease quantity"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="inline-flex h-10 min-w-12 items-center justify-center border-x border-gray-700 px-2 text-sm font-semibold text-white">
                    {purchaseQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPurchaseQuantity((prev) => Math.min(99, prev + 1))}
                    className="inline-flex h-10 w-10 items-center justify-center text-gray-200 hover:bg-gray-800"
                    aria-label="Increase quantity"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded bg-accent-600 px-5 py-2.5 font-semibold text-white hover:bg-accent-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300"
                  onClick={() => {
                    if (isOwnProduct) {
                      toast.error("You cannot purchase your own product");
                      return;
                    }
                    addToCart(product, purchaseQuantity);
                  }}
                  disabled={isOwnProduct}
                >
                  <ShoppingCart size={18} /> {isOwnProduct ? "Your product" : "Add to cart"}
                </button>
                <button
                  type='button'
                  className='inline-flex items-center gap-2 rounded border border-accent-500 px-5 py-2.5 font-semibold text-accent-300 hover:bg-accent-500/20'
                  onClick={() => setShowReportModal(true)}
                >
                  <Flag size={16} /> Report Product
                </button>
              </div>

              {product.shopId && (
                <div className="mt-6 rounded-xl border border-gray-700 bg-gray-900/65 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-gray-600 bg-gray-800 flex items-center justify-center">
                        {liveShop.logoUrl ? (
                          <img
                            src={liveShop.logoUrl}
                            alt={`${shopName} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store size={20} className="text-accent-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase tracking-[0.15em] text-gray-100">{shopName}</p>
                        <p className="truncate text-xs text-gray-400">{liveShop.tagline || "Storefront profile"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            toast.error("Please login to chat with this shop");
                            return;
                          }

                          navigate(`/messages?shopId=${encodeURIComponent(product.shopId)}&shopName=${encodeURIComponent(shopName)}`);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded bg-accent-600 px-3 text-xs font-semibold text-white hover:bg-accent-500"
                      >
                        <MessageSquareText size={12} />
                        Chat Now
                      </button>
                      <Link
                        to={`/shop/${product.shopId}`}
                        className="inline-flex h-8 items-center rounded bg-gray-700 px-3 text-xs font-semibold text-gray-100 hover:bg-gray-600"
                      >
                        View Shop
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {[
                      { label: "Ratings", value: ratingLabel },
                      { label: "Products", value: productsLabel },
                      { label: "Resp. Rate", value: responseRateLabel },
                      { label: "Sold", value: soldLabel },
                      { label: "Followers", value: followersLabel },
                    ].map((item) => (
                      <div key={item.label} className="rounded-md border border-gray-700 bg-gray-800/70 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">{item.label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-100">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Product Reviews</h2>
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-accent-300">{reviewSummary.averageRating.toFixed(1)}</span> / 5 · {reviewSummary.totalReviews} review{reviewSummary.totalReviews === 1 ? "" : "s"}
            </div>
          </div>

          <form onSubmit={handleSubmitReview} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 mb-5 space-y-3">
            <div>
              <p className="text-sm text-gray-300 mb-2">Your rating</p>
              <div className="flex items-center gap-1" aria-label="Choose rating">
                {[1, 2, 3, 4, 5].map((value) => {
                  const starType = getStarType(Number(reviewForm.rating), value);

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const clickX = event.clientX - rect.left;
                        const isLeftHalf = clickX <= rect.width / 2;
                        const nextRating = isLeftHalf ? value - 0.5 : value;
                        setReviewForm((prev) => ({ ...prev, rating: Math.max(1, nextRating) }));
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-400"
                      aria-label={`Rate ${value} stars`}
                      title={`Click left half for ${Math.max(1, value - 0.5)} or right half for ${value}`}
                    >
                      {renderStarIcon(starType, 20)}
                    </button>
                  );
                })}
                <span className="ml-2 text-sm text-gray-300">{Number(reviewForm.rating).toFixed(1)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="reviewComment" className="block text-sm text-gray-300 mb-2">
                Comment
              </label>
              <textarea
                id="reviewComment"
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                maxLength={500}
                placeholder="Share your experience with this product"
                className="w-full rounded-md border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:border-accent-400"
              />
            </div>

            {existingUserReview && (
              <p className="text-xs text-gray-400">You already reviewed this product. Submitting again will update it.</p>
            )}

            <button
              type="submit"
              disabled={submittingReview}
              className="inline-flex items-center rounded bg-accent-600 hover:bg-accent-500 disabled:bg-gray-700 disabled:text-gray-400 px-4 py-2 text-sm font-semibold text-white"
            >
              {submittingReview ? "Saving..." : existingUserReview ? "Update Review" : "Submit Review"}
            </button>
          </form>

          {reviewsLoading ? (
            <p className='text-gray-400 text-sm'>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{review.userName || "User"}</p>
                    <p className="text-xs text-gray-400">{formatReviewDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const starType = getStarType(Number(review.rating), value);
                      return <span key={value}>{renderStarIcon(starType, 14)}</span>;
                    })}
                  </div>
                  {review.comment ? <p className="mt-2 text-sm text-gray-200">{review.comment}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showReportModal && (
        <ReportModal
          title='Report Product'
          onClose={() => setShowReportModal(false)}
          onSubmit={handleSubmitProductReport}
        />
      )}
    </div>
  );
};

export default ProductPage;
