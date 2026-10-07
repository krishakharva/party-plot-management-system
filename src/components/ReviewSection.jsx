import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, update } from "firebase/database";

import { auth, database } from "../firebase/firebaseConfig";
import "../styles/ReviewSection.css";

function ReviewSection({ plotId, plotName }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [bookings, setBookings] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // -----------------------------------
  // AUTHENTICATION
  // -----------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------------
  // LOAD REVIEWS
  // -----------------------------------
  useEffect(() => {
    if (!plotId) return undefined;

    const reviewsRef = ref(database, "reviews");

    const unsubscribe = onValue(
      reviewsRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        const loadedReviews = Object.entries(data)
          .map(([reviewId, review]) => ({
            id: reviewId,
            ...review,
          }))
          .filter((review) => review.plotId === plotId)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            return dateB - dateA;
          });

        setReviews(loadedReviews);
        setLoadingReviews(false);
      },
      (error) => {
        console.error("Error loading reviews:", error);
        setReviews([]);
        setLoadingReviews(false);
      }
    );

    return () => unsubscribe();
  }, [plotId]);

  // -----------------------------------
  // LOAD USER BOOKINGS
  // -----------------------------------
  useEffect(() => {
    if (!user || !plotId) return undefined;

    const bookingsRef = ref(database, "bookings");

    const unsubscribe = onValue(
      bookingsRef,
      (snapshot) => {
        setBookings(snapshot.val() || {});
      },
      (error) => {
        console.error("Error loading bookings:", error);
        setBookings({});
      }
    );

    return () => unsubscribe();
  }, [user, plotId]);

  // -----------------------------------
  // FIND ELIGIBLE BOOKING
  // -----------------------------------
  const eligibleBooking = useMemo(() => {
    if (!user || !plotId || !bookings) {
      return null;
    }

    const bookingEntry = Object.entries(bookings).find(
      ([, booking]) =>
        booking &&
        booking.userId === user.uid &&
        booking.plotId === plotId &&
        (booking.status === "confirmed" ||
          booking.status === "completed")
    );

    if (!bookingEntry) {
      return null;
    }

    return {
      id: bookingEntry[0],
      ...bookingEntry[1],
    };
  }, [user, plotId, bookings]);

  // -----------------------------------
  // CHECK WHETHER USER ALREADY REVIEWED
  // -----------------------------------
  const hasReviewed = useMemo(() => {
    if (!user) return false;

    return reviews.some((review) => review.userId === user.uid);
  }, [reviews, user]);

  // -----------------------------------
  // RATING SUMMARY
  // -----------------------------------
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  // -----------------------------------
  // SUBMIT REVIEW
  // -----------------------------------
  const handleSubmitReview = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Please login before submitting a review.");
      return;
    }

    if (!eligibleBooking) {
      setErrorMessage(
        "You need a confirmed or completed booking for this venue."
      );
      return;
    }

    if (hasReviewed) {
      setErrorMessage("You have already reviewed this venue.");
      return;
    }

    if (rating === 0) {
      setErrorMessage("Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Please write a review.");
      return;
    }

    if (comment.trim().length < 10) {
      setErrorMessage(
        "Please write at least 10 characters in your review."
      );
      return;
    }

    try {
      setSubmitting(true);

      const reviewsRef = ref(database, "reviews");
      const newReviewRef = push(reviewsRef);

      const reviewData = {
        userId: user.uid,
        userName: user.displayName || "User",
        userEmail: user.email || "",
        plotId,
        plotName: plotName || "",
        bookingId: eligibleBooking.id,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      // Calculate new average rating
      const currentTotal = reviews.reduce(
        (sum, review) => sum + Number(review.rating || 0),
        0
      );

      const newReviewCount = reviews.length + 1;
      const newAverageRating = Number(
        ((currentTotal + rating) / newReviewCount).toFixed(1)
      );

      const updates = {};

      updates[`reviews/${newReviewRef.key}`] = reviewData;

      updates[`partyPlots/${plotId}/rating`] = newAverageRating;

      updates[`partyPlots/${plotId}/reviewCount`] = newReviewCount;

      await update(ref(database), updates);

      setRating(0);
      setHoverRating(0);
      setComment("");

      setSuccessMessage(
        "Thank you! Your review has been submitted successfully."
      );
    } catch (error) {
      console.error("Error submitting review:", error);

      setErrorMessage(
        "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------
  // FORMAT DATE
  // -----------------------------------
  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // -----------------------------------
  // GET USER INITIAL
  // -----------------------------------
  const getInitial = (name, email) => {
    const value = name || email || "U";

    return value.charAt(0).toUpperCase();
  };

  return (
    <section className="reviews-section">
      {/* HEADER */}
      <div className="reviews-header">
        <div>
          <span className="reviews-label">Guest Experience</span>

          <h2>Reviews & Ratings</h2>

          <p>
            See what guests say about {plotName || "this party plot"}.
          </p>
        </div>

        <div className="rating-summary">
          <div className="rating-number">
            {averageRating || "0.0"}
          </div>

          <div>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= Math.round(Number(averageRating))
                      ? "star filled"
                      : "star"
                  }
                >
                  ★
                </span>
              ))}
            </div>

            <span className="review-count">
              {reviews.length}{" "}
              {reviews.length === 1 ? "Review" : "Reviews"}
            </span>
          </div>
        </div>
      </div>

      {/* WRITE REVIEW AREA */}
      <div className="write-review-card">
        <div className="write-review-header">
          <div>
            <h3>Share Your Experience</h3>
            <p>
              Your feedback helps other people choose the right venue.
            </p>
          </div>

          <div className="review-pencil">✍️</div>
        </div>

        {/* AUTH LOADING */}
        {authLoading ? (
          <div className="review-message">
            Checking your account...
          </div>
        ) : !user ? (
          /* NOT LOGGED IN */
          <div className="review-login-message">
            <div className="review-message-icon">🔐</div>

            <div>
              <strong>Want to write a review?</strong>

              <p>
                Login to your account to share your experience.
              </p>
            </div>

            <Link to="/login" className="review-login-button">
              Login to Review
            </Link>
          </div>
        ) : !eligibleBooking ? (
          /* NO BOOKING */
          <div className="review-login-message booking-required">
            <div className="review-message-icon">📅</div>

            <div>
              <strong>Booking required</strong>

              <p>
                You can review this venue after making a confirmed
                booking.
              </p>
            </div>
          </div>
        ) : hasReviewed ? (
          /* ALREADY REVIEWED */
          <div className="review-success">
            <span>✓</span>

            <div>
              <strong>Thank you for your review!</strong>

              <p>
                You have already shared your experience for this
                venue.
              </p>
            </div>
          </div>
        ) : (
          /* REVIEW FORM */
          <form
            className="review-form"
            onSubmit={handleSubmitReview}
          >
            <div className="rating-input">
              <label>Your Rating</label>

              <div className="interactive-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={
                      star <= (hoverRating || rating)
                        ? "rating-star active"
                        : "rating-star"
                    }
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <span className="rating-selected-text">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>

            <div className="review-comment">
              <label htmlFor="review-comment">
                Your Review
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell us about your experience at this venue..."
                rows="5"
                maxLength="500"
              />

              <div className="character-count">
                {comment.length}/500
              </div>
            </div>

            {errorMessage && (
              <div className="review-error">
                ⚠️ {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="review-success">
                ✓ {successMessage}
              </div>
            )}

            <button
              type="submit"
              className="submit-review-button"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "⭐ Submit Review"}
            </button>
          </form>
        )}
      </div>

      {/* REVIEWS LIST */}
      <div className="reviews-list-container">
        <div className="reviews-list-heading">
          <h3>What Our Guests Say</h3>

          <span>
            {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        {loadingReviews ? (
          <div className="reviews-loading">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <div className="no-reviews-icon">💬</div>

            <h4>No reviews yet</h4>

            <p>
              Be the first person to share your experience at this
              venue.
            </p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-user">
                  <div className="review-avatar">
                    {getInitial(
                      review.userName,
                      review.userEmail
                    )}
                  </div>

                  <div>
                    <strong>
                      {review.userName || "Guest"}
                    </strong>

                    <span>
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="review-content">
                  <div className="review-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= Number(review.rating)
                            ? "star filled"
                            : "star"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <p>{review.comment}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ReviewSection;