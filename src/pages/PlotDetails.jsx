import { useEffect, useState } from "react";
import ReviewSection from "../components/ReviewSection";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ref,
  onValue,
} from "firebase/database";

import { database } from "../firebase/firebaseConfig";

function PlotDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const plot = location.state?.plot;

  const [availability, setAvailability] =
    useState(null);

  const [selectedDate, setSelectedDate] =
    useState("");

  /* ==========================================
     LOAD AVAILABILITY
  ========================================== */

  useEffect(() => {
    if (!id) {
      return;
    }

    const availabilityRef = ref(
      database,
      `availability/${id}`
    );

    const unsubscribe = onValue(
      availabilityRef,
      (snapshot) => {
        const data = snapshot.val();

        setAvailability(data || {});
      },
      (error) => {
        console.error(
          "Error loading availability:",
          error
        );

        setAvailability({});
      }
    );

    return () => unsubscribe();
  }, [id]);

  /* ==========================================
     PLOT NOT FOUND
  ========================================== */

  if (!plot) {
    return (
      <div className="details-error-page">
        <div className="details-error-card">

          <div className="details-error-icon">
            🏡
          </div>

          <h2>
            Party Plot Not Found
          </h2>

          <p>
            We could not find the selected
            party plot.
          </p>

          <button
            className="details-back-home"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

        </div>
      </div>
    );
  }

  /* ==========================================
     DATA
  ========================================== */

  const loadingAvailability =
    availability === null;

  const selectedDateStatus =
    selectedDate && availability
      ? availability[selectedDate]
      : null;

  /* ==========================================
     IMAGE
  ========================================== */

  let image = "";

  if (
    plot.images &&
    typeof plot.images === "object"
  ) {
    if (Array.isArray(plot.images)) {
      image = plot.images[0] || "";
    } else {
      image =
        plot.images.image1 ||
        plot.images.image2 ||
        plot.images.image3 ||
        Object.values(plot.images)[0] ||
        "";
    }
  }

  if (!image) {
    image =
      "https://placehold.co/1200x700?text=Party+Plot";
  }

  /* ==========================================
     FACILITIES
  ========================================== */

  let facilities = plot.facilities || {};

  if (Array.isArray(facilities)) {
    const facilityObject = {};

    facilities.forEach((item) => {
      const key = String(item)
        .toLowerCase()
        .replace(/\s+/g, "");

      facilityObject[key] = true;
    });

    facilities = facilityObject;
  }

  if (typeof facilities === "string") {
    const facilityObject = {};

    facilities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const key = item
          .toLowerCase()
          .replace(/\s+/g, "");

        facilityObject[key] = true;
      });

    facilities = facilityObject;
  }

  const facilityList = [
    {
      key: "parking",
      icon: "🅿️",
      name: "Parking",
    },
    {
      key: "catering",
      icon: "🍽️",
      name: "Catering",
    },
    {
      key: "decoration",
      icon: "🎀",
      name: "Decoration",
    },
    {
      key: "ac",
      icon: "❄️",
      name: "Air Conditioning",
    },
    {
      key: "stage",
      icon: "🎤",
      name: "Stage",
    },
    {
      key: "dj",
      icon: "🎵",
      name: "DJ",
    },
    {
      key: "rooms",
      icon: "🏠",
      name: "Rooms",
    },
    {
      key: "security",
      icon: "🛡️",
      name: "Security",
    },
  ].filter(
    (item) => facilities[item.key]
  );

  /* ==========================================
     DATE CHANGE
  ========================================== */

  const handleDateChange = (event) => {
    setSelectedDate(
      event.target.value
    );
  };

  /* ==========================================
     CHECK AVAILABILITY
  ========================================== */

  const handleCheckAvailability = () => {
    if (!selectedDate) {
      alert(
        "Please select an event date."
      );

      return;
    }

    if (
      selectedDateStatus ===
      "available"
    ) {
      alert(
        `✓ ${plot.name} is available on ${selectedDate}!`
      );

      return;
    }

    if (
      selectedDateStatus ===
      "booked"
    ) {
      alert(
        `✕ ${plot.name} is already booked on ${selectedDate}.`
      );

      return;
    }

    alert(
      "Availability for this date has not been added yet."
    );
  };

  /* ==========================================
     BOOK NOW
  ========================================== */

  const handleBookNow = () => {
    if (!selectedDate) {
      alert(
        "Please select an available event date first."
      );

      return;
    }

    if (
      selectedDateStatus !==
      "available"
    ) {
      alert(
        "Please select an available date before continuing."
      );

      return;
    }

    navigate(
      `/booking/${id}`,
      {
        state: {
          plot,
          selectedDate,
        },
      }
    );
  };

  /* ==========================================
     TODAY
  ========================================== */

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="details-page">

      {/* ======================================
          TOP NAVIGATION
      ====================================== */}

      <div className="details-topbar">

        <button
          className="details-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back to Party Plots
        </button>

      </div>

      <div className="details-container">

        {/* ====================================
            IMAGE HERO
        ==================================== */}

        <section className="plot-hero-card">

          <div className="plot-hero-image-wrapper">

            <img
              className="plot-hero-image"
              src={image}
              alt={
                plot.name ||
                "Party Plot"
              }
              onError={(event) => {
                event.currentTarget.src =
                  "https://placehold.co/1200x700?text=Party+Plot";
              }}
            />

            <div className="plot-image-overlay">

              <span className="plot-venue-badge">
                ✨ Party Venue
              </span>

            </div>

          </div>

          <div className="plot-hero-info">

            <div className="plot-hero-location">
              📍{" "}
              {plot.location?.area ||
                "Location"}

              {plot.location?.city
                ? `, ${plot.location.city}`
                : ""}
            </div>

            <h1>
              {plot.name}
            </h1>

            <div className="plot-rating-row">

              <span className="plot-rating">
                ⭐ {plot.rating || 0}
              </span>

              <span className="plot-review-count">
                {plot.reviewCount ||
                  0}{" "}
                Reviews
              </span>

            </div>

            <p className="plot-short-description">
              {plot.description ||
                "A beautiful venue perfect for weddings, birthdays, receptions, corporate events and other special celebrations."}
            </p>

          </div>

        </section>

        {/* ====================================
            MAIN CONTENT
        ==================================== */}

        <div className="details-layout">

          {/* ==================================
              LEFT CONTENT
          ================================== */}

          <main className="details-main-content">

            {/* ==================================
                ABOUT
            ================================== */}

            <section className="details-section">

              <div className="details-section-heading">

                <span className="section-icon">
                  🏡
                </span>

                <div>

                  <h2>
                    About This Party Plot
                  </h2>

                  <p>
                    Everything you need for
                    your special celebration
                  </p>

                </div>

              </div>

              <p className="details-description">
                {plot.description ||
                  "A beautiful venue perfect for weddings, birthdays, receptions, corporate events and other special celebrations."}
              </p>

            </section>

            {/* ==================================
                CAPACITY
            ================================== */}

            <section className="details-section">

              <div className="details-section-heading">

                <span className="section-icon">
                  👥
                </span>

                <div>

                  <h2>
                    Capacity
                  </h2>

                  <p>
                    Plan your guest list
                    comfortably
                  </p>

                </div>

              </div>

              <div className="capacity-cards">

                <div className="capacity-card">

                  <div className="capacity-icon">
                    👤
                  </div>

                  <div>

                    <strong>
                      {plot.capacity
                        ?.minimum ||
                        0}
                    </strong>

                    <span>
                      Minimum Guests
                    </span>

                  </div>

                </div>

                <div className="capacity-card">

                  <div className="capacity-icon">
                    👥
                  </div>

                  <div>

                    <strong>
                      {plot.capacity
                        ?.maximum ||
                        0}
                    </strong>

                    <span>
                      Maximum Guests
                    </span>

                  </div>

                </div>

              </div>

            </section>

            {/* ==================================
                FACILITIES
            ================================== */}

            <section className="details-section">

              <div className="details-section-heading">

                <span className="section-icon">
                  ✨
                </span>

                <div>

                  <h2>
                    Facilities & Amenities
                  </h2>

                  <p>
                    Everything available at
                    this venue
                  </p>

                </div>

              </div>

              {facilityList.length > 0 ? (

                <div className="facilities-modern-grid">

                  {facilityList.map(
                    (item) => (
                      <div
                        className="facility-modern-card"
                        key={item.key}
                      >

                        <span className="facility-modern-icon">
                          {item.icon}
                        </span>

                        <span>
                          {item.name}
                        </span>

                        <span className="facility-check">
                          ✓
                        </span>

                      </div>
                    )
                  )}

                </div>

              ) : (

                <div className="no-facilities">
                  Facility information is not
                  available for this venue.
                </div>

              )}

            </section>

            {/* ==================================
                LOCATION
            ================================== */}

            <section className="details-section">

              <div className="details-section-heading">

                <span className="section-icon">
                  📍
                </span>

                <div>

                  <h2>
                    Location
                  </h2>

                  <p>
                    Find your perfect venue
                  </p>

                </div>

              </div>

              <div className="location-card">

                <div className="location-icon">
                  📍
                </div>

                <div>

                  <strong>
                    {plot.location?.area},{" "}
                    {plot.location?.city}
                  </strong>

                  <p>
                    {plot.location?.address}
                  </p>

                  <p>
                    {plot.location?.state}

                    {plot.location?.pincode
                      ? ` - ${plot.location.pincode}`
                      : ""}
                  </p>

                </div>

              </div>

            </section>

          </main>

          {/* ==================================
              RIGHT BOOKING CARD
          ================================== */}

          <aside className="details-sidebar">

            <div className="booking-card-modern">

              {/* =================================
                  PRICE
              ================================== */}

              <div className="booking-price-section">

                <span>
                  Starting from
                </span>

                <div className="booking-price">

                  ₹
                  {plot.pricing?.perEvent
                    ? Number(
                        plot.pricing
                          .perEvent
                      ).toLocaleString(
                        "en-IN"
                      )
                    : "N/A"}

                </div>

                <small>
                  per event
                </small>

              </div>

              <div className="booking-divider" />

              {/* =================================
                  AVAILABILITY
              ================================== */}

              <div className="availability-section-modern">

                <h3>
                  📅 Check Availability
                </h3>

                <label htmlFor="eventDate">
                  Select Event Date
                </label>

                <input
                  id="eventDate"
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={
                    handleDateChange
                  }
                />

                {/* LOADING */}

                {loadingAvailability && (
                  <div className="availability-loading">

                    <span className="loading-dot">
                      ●
                    </span>

                    Checking availability...

                  </div>
                )}

                {/* AVAILABLE */}

                {!loadingAvailability &&
                  selectedDate &&
                  selectedDateStatus ===
                    "available" && (

                    <div className="availability-status available-modern">

                      <span>
                        ✓
                      </span>

                      <div>

                        <strong>
                          Available
                        </strong>

                        <small>
                          {selectedDate}
                        </small>

                      </div>

                    </div>
                  )}

                {/* BOOKED */}

                {!loadingAvailability &&
                  selectedDate &&
                  selectedDateStatus ===
                    "booked" && (

                    <div className="availability-status booked-modern">

                      <span>
                        ✕
                      </span>

                      <div>

                        <strong>
                          Already Booked
                        </strong>

                        <small>
                          {selectedDate}
                        </small>

                      </div>

                    </div>
                  )}

                {/* UNKNOWN */}

                {!loadingAvailability &&
                  selectedDate &&
                  !selectedDateStatus && (

                    <div className="availability-status unknown-modern">

                      <span>
                        !
                      </span>

                      <div>

                        <strong>
                          Not Available
                        </strong>

                        <small>
                          Availability not
                          added for this
                          date.
                        </small>

                      </div>

                    </div>
                  )}

                <button
                  className="availability-button-modern"
                  onClick={
                    handleCheckAvailability
                  }
                >
                  📅 Check Availability
                </button>

                <button
                  className="book-button-modern"
                  onClick={
                    handleBookNow
                  }
                  disabled={
                    !selectedDate ||
                    selectedDateStatus !==
                      "available"
                  }
                >
                  Book This Venue →
                </button>

              </div>
            </div>

          </aside>

        </div>

        {/* =================================================
            REVIEWS & RATINGS
        ================================================== */}

        <section className="plot-reviews-wrapper">

          <ReviewSection
            plotId={id}
            plotName={plot.name}
          />

        </section>

      </div>

    </div>
  );
}

export default PlotDetails;