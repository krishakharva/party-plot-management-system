import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ref,
  onValue,
  runTransaction,
  push,
  update,
} from "firebase/database";

import { onAuthStateChanged } from "firebase/auth";

import {
  database,
  auth,
} from "../firebase/firebaseConfig";


function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  /*
   * Plot passed from PlotDetails page
   */
  const initialPlot = location.state?.plot || null;

  /*
   * Selected date passed from PlotDetails
   */
  const initialDate =
    location.state?.selectedDate || "";

  const [plot, setPlot] =
    useState(initialPlot);

  const [user, setUser] =
    useState(null);

  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [eventType, setEventType] =
    useState("");

  const [guestCount, setGuestCount] =
    useState("");

  /*
   * null means Firebase availability
   * has not loaded yet.
   */
  const [availability, setAvailability] =
    useState(null);

  /*
   * This is only needed when the plot was
   * not passed through navigation state.
   */
  const [plotLoadComplete, setPlotLoadComplete] =
    useState(Boolean(initialPlot));


  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [bookingId, setBookingId] =
    useState("");


  /*
   * ==========================================
   * AUTHENTICATION
   * ==========================================
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
        }
      );

    return () => unsubscribe();
  }, []);


  /*
   * ==========================================
   * LOAD PLOT FROM FIREBASE
   * ==========================================
   *
   * If PlotDetails already passed the plot,
   * we don't need another Firebase request.
   *
   * If the page was opened directly using
   * /booking/:id, then we load the plot.
   */

  useEffect(() => {
    if (initialPlot || !id) {
      return;
    }

    const plotRef =
      ref(
        database,
        `partyPlots/${id}`
      );

    const unsubscribe =
      onValue(
        plotRef,
        (snapshot) => {
          const data =
            snapshot.val();

          if (data) {
            setPlot({
              id,
              ...data,
            });
          }

          /*
           * This state update happens inside
           * the Firebase callback, not
           * synchronously inside the effect.
           */
          setPlotLoadComplete(true);
        },
        (firebaseError) => {
          console.error(
            "Error loading party plot:",
            firebaseError
          );

          setPlotLoadComplete(true);
        }
      );

    return () => unsubscribe();

  }, [id, initialPlot]);


  /*
   * ==========================================
   * LOAD AVAILABILITY
   * ==========================================
   */

  useEffect(() => {
    if (!id) {
      return;
    }

    const availabilityRef =
      ref(
        database,
        `availability/${id}`
      );

    const unsubscribe =
      onValue(
        availabilityRef,
        (snapshot) => {
          const data =
            snapshot.val();

          setAvailability(
            data || {}
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading availability:",
            firebaseError
          );

          setAvailability({});
        }
      );

    return () => unsubscribe();

  }, [id]);


  /*
   * ==========================================
   * LOADING STATUS
   * ==========================================
   *
   * These are derived values instead of
   * separate state variables.
   */

  const loadingPlot =
    !plotLoadComplete;

  const loadingAvailability =
    availability === null;


  /*
   * ==========================================
   * LOADING PLOT
   * ==========================================
   */

  if (loadingPlot) {
    return (
      <div className="booking-loading">

        <h2>
          Loading booking details...
        </h2>

      </div>
    );
  }


  /*
   * ==========================================
   * PLOT NOT FOUND
   * ==========================================
   */

  if (!plot) {
    return (
      <div className="booking-error-page">

        <h2>
          Party Plot Not Found
        </h2>

        <p>
          We could not find this party plot.
        </p>

        <button
          onClick={() =>
            navigate("/")
          }
        >
          ← Back to Home
        </button>

      </div>
    );
  }


  /*
   * ==========================================
   * LOGIN REQUIRED
   * ==========================================
   */

  if (!user) {
    return (
      <div className="booking-login-page">

        <div className="booking-login-card">

          <div className="booking-logo">
            Party<span>Plot</span>
          </div>

          <h2>
            Login Required
          </h2>

          <p>
            Please login before making a booking.
          </p>

          <button
            className="booking-primary-button"
            onClick={() =>
              navigate("/login")
            }
          >
            Login
          </button>

          <button
            className="booking-secondary-button"
            onClick={() =>
              navigate(`/plot/${id}`, {
                state: {
                  plot,
                },
              })
            }
          >
            ← Back to Plot
          </button>

        </div>

      </div>
    );
  }


  /*
   * ==========================================
   * CAPACITY
   * ==========================================
   */

  const minimumGuests =
    Number(
      plot.capacity?.minimum || 1
    );

  const maximumGuests =
    Number(
      plot.capacity?.maximum || 999999
    );


  /*
   * ==========================================
   * PRICE
   * ==========================================
   */

  const bookingAmount =
    Number(
      plot.pricing?.perEvent || 0
    );


  /*
   * ==========================================
   * DATE STATUS
   * ==========================================
   */

  const dateStatus =
    selectedDate && availability
      ? availability[selectedDate]
      : null;


  /*
   * ==========================================
   * HANDLE BOOKING
   * ==========================================
   */

  const handleBooking = async (event) => {
    event.preventDefault();

    setError("");


    /*
     * EVENT TYPE
     */

    if (!eventType) {
      setError(
        "Please select an event type."
      );

      return;
    }


    /*
     * DATE
     */

    if (!selectedDate) {
      setError(
        "Please select an event date."
      );

      return;
    }


    /*
     * GUEST COUNT
     */

    const guests =
      Number(guestCount);

    if (!guestCount || guests <= 0) {
      setError(
        "Please enter the number of guests."
      );

      return;
    }


    if (guests < minimumGuests) {
      setError(
        `Minimum guest capacity is ${minimumGuests}.`
      );

      return;
    }


    if (guests > maximumGuests) {
      setError(
        `Maximum guest capacity is ${maximumGuests}.`
      );

      return;
    }


    /*
     * AVAILABILITY LOADING
     */

    if (
      loadingAvailability ||
      availability === null
    ) {
      setError(
        "Please wait while availability is checked."
      );

      return;
    }


    /*
     * DATE MUST BE AVAILABLE
     */

    if (dateStatus !== "available") {

      if (dateStatus === "booked") {

        setError(
          "This party plot is already booked on the selected date."
        );

      } else {

        setError(
          "This date is not available for booking."
        );

      }

      return;
    }


    try {

      setSubmitting(true);


      /*
       * ========================================
       * ATOMIC AVAILABILITY TRANSACTION
       * ========================================
       *
       * This prevents two users from booking
       * the same available date simultaneously.
       */

      const availabilityDateRef =
        ref(
          database,
          `availability/${id}/${selectedDate}`
        );


      const transactionResult =
        await runTransaction(
          availabilityDateRef,
          (currentValue) => {

            if (
              currentValue === "available"
            ) {
              return "booked";
            }

            /*
             * Abort transaction if the date
             * is no longer available.
             */
            return;
          }
        );


      /*
       * ========================================
       * TRANSACTION FAILED
       * ========================================
       */

      if (
        !transactionResult.committed ||
        transactionResult.snapshot.val() !==
          "booked"
      ) {

        setError(
          "Sorry, this date was just booked by another user. Please select another date."
        );

        setSubmitting(false);

        return;
      }


      /*
       * ========================================
       * CREATE BOOKING ID
       * ========================================
       */

      const bookingsRef =
        ref(
          database,
          "bookings"
        );

      const newBookingRef =
        push(bookingsRef);

      const newBookingId =
        newBookingRef.key;


      /*
       * ========================================
       * BOOKING DATA
       * ========================================
       */

      const bookingData = {

        userId:
          user.uid,

        userName:
          user.displayName ||
          "User",

        userEmail:
          user.email || "",

        plotId:
          id,

        plotName:
          plot.name || "",

        eventType:
          eventType,

        eventDate:
          selectedDate,

        guestCount:
          guests,

        amount:
          bookingAmount,

        status:
          "confirmed",

        createdAt:
          new Date().toISOString(),

      };


      /*
       * ========================================
       * SAVE BOOKING
       * ========================================
       */

      await update(
        ref(
          database,
          `bookings/${newBookingId}`
        ),
        bookingData
      );


      /*
       * ========================================
       * SUCCESS
       * ========================================
       */

      setBookingId(
        newBookingId
      );

      setSuccess(true);

    } catch (firebaseError) {

      console.error(
        "Booking error:",
        firebaseError
      );

      setError(
        "Something went wrong while creating your booking. Please try again."
      );

    } finally {

      setSubmitting(false);

    }
  };


  /*
   * ==========================================
   * SUCCESS SCREEN
   * ==========================================
   */

  if (success) {

    return (
      <div className="booking-success-page">

        <div className="booking-success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Booking Confirmed!
          </h1>

          <p className="success-message">
            Your party plot has been successfully
            booked.
          </p>


          <div className="booking-summary">

            <div>

              <span>
                Party Plot
              </span>

              <strong>
                {plot.name}
              </strong>

            </div>


            <div>

              <span>
                Event
              </span>

              <strong>
                {eventType}
              </strong>

            </div>


            <div>

              <span>
                Date
              </span>

              <strong>
                {selectedDate}
              </strong>

            </div>


            <div>

              <span>
                Guests
              </span>

              <strong>
                {guestCount}
              </strong>

            </div>


            <div>

              <span>
                Amount
              </span>

              <strong>
                ₹
                {bookingAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>


          <div className="booking-id-box">

            <span>
              Booking ID
            </span>

            <strong>
              {bookingId}
            </strong>

          </div>


          <button
            className="booking-primary-button"
            onClick={() =>
              navigate("/")
            }
          >
            Back to Home
          </button>

        </div>

      </div>
    );
  }


  /*
   * ==========================================
   * BOOKING FORM
   * ==========================================
   */

  return (
    <div className="booking-page">

      <div className="booking-container">


        {/* BACK BUTTON */}

        <button
          className="booking-back-button"
          onClick={() =>
            navigate(
              `/plot/${id}`,
              {
                state: {
                  plot,
                },
              }
            )
          }
        >
          ← Back to Plot
        </button>


        <div className="booking-layout">


          {/* =================================
              FORM
          ================================== */}

          <div className="booking-form-card">

            <h1>
              Book Your Party Plot
            </h1>

            <p className="booking-subtitle">
              Complete the details below to confirm
              your booking.
            </p>


            {/* ERROR */}

            {error && (
              <div className="booking-form-error">
                {error}
              </div>
            )}


            <form
              onSubmit={handleBooking}
            >


              {/* EVENT TYPE */}

              <div className="booking-form-group">

                <label htmlFor="eventType">
                  Event Type
                </label>

                <select
                  id="eventType"
                  value={eventType}
                  onChange={(event) =>
                    setEventType(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select event type
                  </option>

                  <option value="Wedding">
                    Wedding
                  </option>

                  <option value="Reception">
                    Reception
                  </option>

                  <option value="Birthday">
                    Birthday Party
                  </option>

                  <option value="Engagement">
                    Engagement
                  </option>

                  <option value="Corporate Event">
                    Corporate Event
                  </option>

                  <option value="Anniversary">
                    Anniversary
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* DATE */}

              <div className="booking-form-group">

                <label htmlFor="bookingDate">
                  Event Date
                </label>

                <input
                  id="bookingDate"
                  type="date"
                  value={selectedDate}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(event) =>
                    setSelectedDate(
                      event.target.value
                    )
                  }
                />


                {selectedDate && (
                  <small
                    className={
                      dateStatus ===
                      "available"
                        ? "date-available"
                        : "date-unavailable"
                    }
                  >

                    {dateStatus ===
                    "available"
                      ? "✓ Date is available"
                      : dateStatus ===
                        "booked"
                      ? "✕ Date is already booked"
                      : "Date availability not found"}

                  </small>
                )}

              </div>


              {/* GUEST COUNT */}

              <div className="booking-form-group">

                <label htmlFor="guestCount">
                  Number of Guests
                </label>

                <input
                  id="guestCount"
                  type="number"
                  placeholder={`${minimumGuests} - ${maximumGuests}`}
                  min={minimumGuests}
                  max={maximumGuests}
                  value={guestCount}
                  onChange={(event) =>
                    setGuestCount(
                      event.target.value
                    )
                  }
                />

                <small>
                  Capacity:{" "}
                  {minimumGuests} -{" "}
                  {maximumGuests} guests
                </small>

              </div>


              {/* USER INFORMATION */}

              <div className="booking-user-box">

                <h3>
                  Your Information
                </h3>

                <p>

                  <strong>
                    Name:
                  </strong>{" "}

                  {user.displayName ||
                    "Not available"}

                </p>

                <p>

                  <strong>
                    Email:
                  </strong>{" "}

                  {user.email}

                </p>

              </div>


              {/* SUBMIT */}

              <button
                type="submit"
                className="confirm-booking-button"
                disabled={submitting}
              >

                {submitting
                  ? "Confirming Booking..."
                  : "Confirm Booking"}

              </button>

            </form>

          </div>


          {/* =================================
              SUMMARY
          ================================== */}

          <div className="booking-summary-card">

            <img
              src={plot.images?.[0]}
              alt={plot.name}
            />


            <div className="booking-summary-content">

              <h2>
                {plot.name}
              </h2>

              <p>

                📍{" "}
                {plot.location?.area},{" "}
                {plot.location?.city}

              </p>


              <div className="summary-rating">
                ⭐ {plot.rating || 0}
              </div>


              <hr />


              <div className="summary-row">

                <span>
                  Event
                </span>

                <strong>
                  {eventType ||
                    "Not selected"}
                </strong>

              </div>


              <div className="summary-row">

                <span>
                  Date
                </span>

                <strong>
                  {selectedDate ||
                    "Not selected"}
                </strong>

              </div>


              <div className="summary-row">

                <span>
                  Guests
                </span>

                <strong>
                  {guestCount ||
                    "Not selected"}
                </strong>

              </div>


              <hr />


              <div className="summary-total">

                <span>
                  Total Amount
                </span>

                <strong>
                  ₹
                  {bookingAmount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <p className="price-note">

                Final pricing is based on the
                selected party plot's listed
                event price.

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Booking;