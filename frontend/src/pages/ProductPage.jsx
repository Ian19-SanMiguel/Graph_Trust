import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCartStore } from "../stores/useCartStore";
import { MessageSquareText, ShoppingCart, Star, Store } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const { addToCart } = useCartStore();
  const { user } = useUserStore();
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/products/${id}`);
        setProduct(res.data);
        await fetchReviews(id);
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

      toast.success(response.data?.message || "Review submitted");
      setReviewForm((prev) => ({ ...prev, comment: "" }));
      await fetchReviews(id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            <img src={product.image} alt={product.name} className="w-full h-96 object-cover rounded" />
          </div>
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-gray-300 mb-4">{product.description}</p>
            <div className="mb-4">
              {product.shopId ? (
                <Link
                  to={`/shop/${product.shopId}`}
                  className="inline-flex items-center gap-2 text-accent-300 hover:text-accent-200"
                >
                  <Store size={16} />
                  Visit {product.shopName || "Shop"}
                </Link>
              ) : (
                <p className="text-gray-400">Shop not available</p>
              )}
            </div>
            <p className="text-2xl font-semibold text-accent-400 mb-7">${product.price}</p>
            <button
              className="flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 rounded"
              onClick={() => addToCart(product)}
            >
              <ShoppingCart /> Add to cart
            </button>

            {product.shopId && (
              <div className="mt-6 rounded-xl border border-accent-500/30 bg-accent-500/15 p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full border-2 border-gray-200/80 bg-gray-900 text-white flex items-center justify-center">
                      <Store size={26} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-xs uppercase tracking-wider">{product.shopName || "Shop"}</p>
                      <p className="text-xs text-gray-300">Active 10 minutes ago</p>
                      <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) {
                              toast.error("Please login to chat with this shop");
                              return;
                            }

                            navigate(`/messages?shopId=${encodeURIComponent(product.shopId)}&shopName=${encodeURIComponent(product.shopName || "Shop")}`);
                          }}
                          className="inline-flex h-7 items-center gap-1 rounded bg-accent-500 hover:bg-accent-400 px-2.5 text-xs font-semibold text-gray-900 whitespace-nowrap"
                        >
                          <MessageSquareText size={12} />
                          Chat Now
                        </button>
                        <Link
                          to={`/shop/${product.shopId}`}
                          className="inline-flex h-7 items-center rounded bg-gray-700 hover:bg-gray-600 px-2.5 text-xs font-semibold text-gray-100 whitespace-nowrap"
                        >
                          View Shop
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-gray-400 uppercase tracking-wide">Ratings</p>
                      <p className="text-gray-100 font-semibold leading-tight">125.9k</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-gray-400 uppercase tracking-wide">Products</p>
                      <p className="text-gray-100 font-semibold leading-tight">906</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-gray-400 uppercase tracking-wide">Joined</p>
                      <p className="text-gray-100 font-semibold leading-tight">1 Year Ago</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-gray-400 uppercase tracking-wide">Followers</p>
                      <p className="text-gray-100 font-semibold leading-tight">200.0k</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
            <p className="text-gray-400 text-sm">Loading reviews...</p>
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
    </div>
  );
};

export default ProductPage;
