import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  ref,
  onValue,
  update,
} from "firebase/database";

import {
  auth,
  database,
} from "../firebase/firebaseConfig";


function MyBookings() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [plots, setPlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);


  /* ==========================================
     AUTH
  ========================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);

        if (!user) {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);


  /* ==========================================
     LOAD PARTY PLOTS
  ========================================== */

  useEffect(() => {
    const plotsRef = ref(
      database,
      "partyPlots"
    );

    const unsubscribe = onValue(
      plotsRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        setPlots(data);
      },
      (error) => {
        console.error(
          "Error loading party plots:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);


  /* ==========================================
     LOAD USER BOOKINGS
  ========================================== */

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const bookingsRef = ref(
      database,
      "bookings"
    );

    const unsubscribe = onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        const userBookings = Object.entries(
          data
        )
          .map(([id, booking]) => ({
            id,
            ...booking,
          }))
          .filter(
            (booking) =>
              booking.userId === currentUser.uid
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) -
              new Date(a.createdAt || 0)
          );

        setBookings(userBookings);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Error loading bookings:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);


  /* ==========================================
     GET PLOT IMAGE
  ========================================== */

  const getPlotImage = (plot) => {
    if (!plot?.images) {
      return "https://placehold.co/800x500?text=Party+Plot";
    }

    if (Array.isArray(plot.images)) {
      return (
        plot.images[0] ||
        "https://placehold.co/800x500?text=Party+Plot"
      );
    }

    if (
      typeof plot.images === "object"
    ) {
      return (
        plot.images.image1 ||
        plot.images.image2 ||
        plot.images.image3 ||
        Object.values(plot.images)[0] ||
        "https://placehold.co/800x500?text=Party+Plot"
      );
    }

    return "https://placehold.co/800x500?text=Party+Plot";
  };


  /* ==========================================
     FORMAT DATE
  ========================================== */

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* ==========================================
     FORMAT TIME / BOOKING CREATED
  ========================================== */

  const formatBookingDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* ==========================================
     STATUS
  ========================================== */

  const getStatusClass = (status) => {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "confirmed":
        return "booking-status-confirmed";

      case "cancelled":
        return "booking-status-cancelled";

      case "completed":
        return "booking-status-completed";

      default:
        return "booking-status-default";
    }
  };


  const getStatusText = (status) => {
    if (!status) {
      return "Pending";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };


  /* ==========================================
     CANCEL BOOKING
  ========================================== */

  const handleCancelBooking = async (
    booking
  ) => {
    if (
      booking.status === "cancelled" ||
      booking.status === "completed"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel your booking for ${booking.plotName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(booking.id);

      const updates = {};

      updates[
        `bookings/${booking.id}/status`
      ] = "cancelled";

      updates[
        `availability/${booking.plotId}/${booking.eventDate}`
      ] = "available";

      await update(
        ref(database),
        updates
      );

    } catch (error) {
      console.error(
        "Error cancelling booking:",
        error
      );

      alert(
        "Unable to cancel the booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };


  /* ==========================================
     VIEW PLOT
  ========================================== */

  const handleViewPlot = (booking) => {
    const plot = plots[booking.plotId];

    if (!plot) {
      alert(
        "This party plot is no longer available."
      );

      return;
    }

    navigate(
      `/plot/${booking.plotId}`,
      {
        state: {
          plot: {
            id: booking.plotId,
            ...plot,
          },
        },
      }
    );
  };


  /* ==========================================
     LOGIN PAGE
  ========================================== */

  if (!currentUser && !loading) {
    return (
      <div className="my-bookings-page">
        <div className="my-bookings-login-card">

          <div className="my-bookings-login-icon">
            🔐
          </div>

          <h1>Login Required</h1>

          <p>
            Please login to view your bookings.
          </p>

          <button
            className="my-bookings-primary-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="my-bookings-secondary-button"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

        </div>
      </div>
    );
  }


  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="my-bookings-loading">

          <div className="booking-loading-spinner">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h2>Loading your bookings...</h2>

          <p>
            Please wait while we fetch your bookings.
          </p>

        </div>
      </div>
    );
  }


  /* ==========================================
     MAIN PAGE
  ========================================== */

  return (
    <div className="my-bookings-page">

      {/* HEADER */}

      <div className="my-bookings-header">

        <div className="my-bookings-header-inner">

          <button
            className="my-bookings-back-button"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

          <div className="my-bookings-heading">

            <p className="my-bookings-eyebrow">
              YOUR BOOKINGS
            </p>

            <h1>
              My Bookings
            </h1>

            <p>
              Manage your upcoming and previous
              party plot bookings.
            </p>

          </div>

          <div className="booking-count-badge">
            {bookings.length}
            <span>
              {bookings.length === 1
                ? " Booking"
                : " Bookings"}
            </span>
          </div>

        </div>

      </div>


      {/* CONTENT */}

      <main className="my-bookings-container">

        {bookings.length === 0 ? (

          /* EMPTY STATE */

          <div className="my-bookings-empty">

            <div className="empty-booking-icon">
              📅
            </div>

            <h2>
              No Bookings Yet
            </h2>

            <p>
              You haven't booked a party plot yet.
              Explore our venues and find the perfect
              place for your celebration.
            </p>

            <button
              className="my-bookings-primary-button empty-button"
              onClick={() => navigate("/")}
            >
              Explore Party Plots
            </button>

          </div>

        ) : (

          /* BOOKING LIST */

          <div className="my-bookings-list">

            {bookings.map((booking) => {

              const plot =
                plots[booking.plotId];

              const image =
                getPlotImage(plot);

              const locationText =
                plot?.location?.area &&
                plot?.location?.city
                  ? `${plot.location.area}, ${plot.location.city}`
                  : plot?.location?.city ||
                    "Location not available";

              const isCancelled =
                booking.status ===
                "cancelled";

              const isCompleted =
                booking.status ===
                "completed";

              return (
                <article
                  className={`booking-card-modern ${
                    isCancelled
                      ? "booking-card-cancelled"
                      : ""
                  }`}
                  key={booking.id}
                >

                  {/* IMAGE */}

                  <div className="booking-card-image-wrapper">

                    <img
                      src={image}
                      alt={
                        booking.plotName ||
                        "Party Plot"
                      }
                      className="booking-card-image"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/800x500?text=Party+Plot";
                      }}
                    />

                    <div
                      className={`booking-status-badge ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      <span className="status-dot">
                        ●
                      </span>

                      {getStatusText(
                        booking.status
                      )}
                    </div>

                  </div>


                  {/* BOOKING CONTENT */}

                  <div className="booking-card-body">

                    <div className="booking-card-top">

                      <div>

                        <p className="booking-card-label">
                          PARTY PLOT
                        </p>

                        <h2>
                          {booking.plotName ||
                            "Party Plot"}
                        </h2>

                        <p className="booking-location">
                          📍 {locationText}
                        </p>

                      </div>

                      <div className="booking-amount">

                        <small>
                          Total Amount
                        </small>

                        <strong>
                          ₹
                          {Number(
                            booking.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* EVENT DETAILS */}

                    <div className="booking-details-grid">

                      <div className="booking-detail-item">

                        <div className="booking-detail-icon">
                          🎉
                        </div>

                        <div>
                          <span>
                            Event Type
                          </span>

                          <strong>
                            {booking.eventType ||
                              "Event"}
                          </strong>
                        </div>

                      </div>


                      <div className="booking-detail-item">

                        <div className="booking-detail-icon">
                          📅
                        </div>

                        <div>
                          <span>
                            Event Date
                          </span>

                          <strong>
                            {formatDate(
                              booking.eventDate
                            )}
                          </strong>
                        </div>

                      </div>


                      <div className="booking-detail-item">

                        <div className="booking-detail-icon">
                          👥
                        </div>

                        <div>
                          <span>
                            Guests
                          </span>

                          <strong>
                            {booking.guestCount ||
                              0}{" "}
                            Guests
                          </strong>
                        </div>

                      </div>


                      <div className="booking-detail-item">

                        <div className="booking-detail-icon">
                          🕐
                        </div>

                        <div>
                          <span>
                            Booked On
                          </span>

                          <strong>
                            {formatBookingDate(
                              booking.createdAt
                            )}
                          </strong>
                        </div>

                      </div>

                    </div>


                    {/* BOOKING ID */}

                    <div className="booking-id-section">

                      <span>
                        Booking ID
                      </span>

                      <strong>
                        {booking.id}
                      </strong>

                    </div>


                    {/* ACTIONS */}

                    <div className="booking-card-actions">

                      <button
                        className="booking-view-button"
                        onClick={() =>
                          handleViewPlot(
                            booking
                          )
                        }
                      >
                        View Plot
                      </button>

                      {!isCancelled &&
                        !isCompleted && (
                          <button
                            className="booking-cancel-button"
                            onClick={() =>
                              handleCancelBooking(
                                booking
                              )
                            }
                            disabled={
                              cancellingId ===
                              booking.id
                            }
                          >
                            {cancellingId ===
                            booking.id
                              ? "Cancelling..."
                              : "Cancel Booking"}
                          </button>
                        )}

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </main>

    </div>
  );
}

export default MyBookings;