import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import { onAuthStateChanged } from "firebase/auth";
import {
  onValue,
  ref,
  update,
} from "firebase/database";

import {
  auth,
  database,
} from "../firebase/firebaseConfig";


function AdminDashboard() {
  const navigate = useNavigate();

  /* ==========================================
     AUTHENTICATION
  ========================================== */

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  /* ==========================================
     ADMIN USER
  ========================================== */

  const [adminUser, setAdminUser] = useState(null);
  const [adminChecked, setAdminChecked] = useState(false);

  /* ==========================================
     DATA
  ========================================== */

  const [plots, setPlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  const [dataReady, setDataReady] = useState(false);


  /* ==========================================
     AUTHENTICATION LISTENER
  ========================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setAuthChecked(true);

        /*
         * These state updates happen inside the
         * Firebase authentication callback.
         * This avoids the React
         * set-state-in-effect ESLint warning.
         */

        if (!user) {
          setAdminUser(null);
          setAdminChecked(false);
          setDataReady(false);
        } else {
          setAdminChecked(false);
          setDataReady(false);
        }
      },
      (error) => {
        console.error(
          "Authentication error:",
          error
        );

        setCurrentUser(null);
        setAuthChecked(true);
        setAdminUser(null);
        setAdminChecked(false);
        setDataReady(false);
      }
    );

    return () => unsubscribe();
  }, []);


  /* ==========================================
     ADMIN VERIFICATION
  ========================================== */

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const userRef = ref(
      database,
      `users/${currentUser.uid}`
    );

    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val();

        setAdminUser(data || null);
        setAdminChecked(true);

        /*
         * Firebase has responded with the current
         * user's admin information.
         */
        setDataReady(false);
      },
      (error) => {
        console.error(
          "Admin check error:",
          error
        );

        setAdminUser(null);
        setAdminChecked(true);
        setDataReady(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);


  /* ==========================================
     LOAD ADMIN DATA
  ========================================== */

  useEffect(() => {
    if (
      !currentUser ||
      !adminUser?.admin
    ) {
      return undefined;
    }

    let plotsLoaded = false;
    let bookingsLoaded = false;
    let usersLoaded = false;

    const checkAllDataLoaded = () => {
      if (
        plotsLoaded &&
        bookingsLoaded &&
        usersLoaded
      ) {
        setDataReady(true);
      }
    };


    /* ========================================
       PARTY PLOTS
    ======================================== */

    const plotsRef = ref(
      database,
      "partyPlots"
    );

    const unsubscribePlots = onValue(
      plotsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const plotList = Object.entries(
            data
          ).map(([id, plot]) => ({
            id,
            ...plot,
          }));

          setPlots(plotList);
        } else {
          setPlots([]);
        }

        plotsLoaded = true;
        checkAllDataLoaded();
      },
      (error) => {
        console.error(
          "Party plots loading error:",
          error
        );

        setPlots([]);

        plotsLoaded = true;
        checkAllDataLoaded();
      }
    );


    /* ========================================
       BOOKINGS
    ======================================== */

    const bookingsRef = ref(
      database,
      "bookings"
    );

    const unsubscribeBookings = onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const bookingList = Object.entries(
            data
          ).map(([id, booking]) => ({
            id,
            ...booking,
          }));

          setBookings(bookingList);
        } else {
          setBookings([]);
        }

        bookingsLoaded = true;
        checkAllDataLoaded();
      },
      (error) => {
        console.error(
          "Bookings loading error:",
          error
        );

        setBookings([]);

        bookingsLoaded = true;
        checkAllDataLoaded();
      }
    );


    /* ========================================
       USERS
    ======================================== */

    const usersRef = ref(
      database,
      "users"
    );

    const unsubscribeUsers = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const userList = Object.entries(
            data
          ).map(([id, user]) => ({
            id,
            ...user,
          }));

          setUsers(userList);
        } else {
          setUsers([]);
        }

        usersLoaded = true;
        checkAllDataLoaded();
      },
      (error) => {
        console.error(
          "Users loading error:",
          error
        );

        setUsers([]);

        usersLoaded = true;
        checkAllDataLoaded();
      }
    );


    return () => {
      unsubscribePlots();
      unsubscribeBookings();
      unsubscribeUsers();
    };
  }, [currentUser, adminUser]);


  /* ==========================================
     DELETE PARTY PLOT
  ========================================== */

  const handleDeletePlot = async (plot) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${plot.name}"?\n\n` +
      `The party plot and its availability data will be removed.\n\n` +
      `Historical bookings will NOT be deleted.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const updates = {};

      updates[`partyPlots/${plot.id}`] = null;
      updates[`availability/${plot.id}`] = null;

      await update(
        ref(database),
        updates
      );

      window.alert(
        "Party plot deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete party plot error:",
        error
      );

      window.alert(
        "Failed to delete the party plot. Please try again."
      );
    }
  };


  /* ==========================================
     STATISTICS
  ========================================== */

  const totalPlots = plots.length;

  const totalBookings = bookings.length;

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "confirmed"
    ).length;

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "cancelled"
    ).length;

  const completedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "completed"
    ).length;

  const totalRevenue = bookings
    .filter(
      (booking) =>
        booking.status !== "cancelled"
    )
    .reduce(
      (total, booking) =>
        total +
        Number(booking.amount || 0),
      0
    );


  /* ==========================================
     RECENT BOOKINGS
  ========================================== */

  const recentBookings = [...bookings]
    .sort((a, b) => {
      const dateA = new Date(
        a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 8);


  /* ==========================================
     GET PARTY PLOT IMAGE
  ========================================== */

  const getPlotImage = (plot) => {
    const fallbackImage =
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3";

    if (
      !plot?.images ||
      typeof plot.images !== "object"
    ) {
      return fallbackImage;
    }

    if (Array.isArray(plot.images)) {
      return (
        plot.images[0] ||
        fallbackImage
      );
    }

    return (
      plot.images.image1 ||
      plot.images.image2 ||
      plot.images.image3 ||
      Object.values(plot.images)[0] ||
      fallbackImage
    );
  };


  /* ==========================================
     AUTH LOADING
  ========================================== */

  if (!authChecked) {
    return (
      <div className="admin-loading">

        <div className="loading-spinner"></div>

        <p>
          Checking administrator access...
        </p>

      </div>
    );
  }


  /* ==========================================
     LOGIN REQUIRED
  ========================================== */

  if (!currentUser) {
    return (
      <div className="admin-access-page">

        <div className="admin-access-card">

          <div className="admin-access-icon">
            🔐
          </div>

          <h2>
            Login Required
          </h2>

          <p>
            Please login with your administrator
            account to access the dashboard.
          </p>

          <button
            className="admin-back-button"
            onClick={() =>
              navigate("/login")
            }
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }


  /* ==========================================
     ADMIN CHECK LOADING
  ========================================== */

  if (!adminChecked) {
    return (
      <div className="admin-loading">

        <div className="loading-spinner"></div>

        <p>
          Verifying administrator permissions...
        </p>

      </div>
    );
  }


  /* ==========================================
     ACCESS DENIED
  ========================================== */

  if (!adminUser?.admin) {
    return (
      <div className="admin-access-page">

        <div className="admin-access-card">

          <div className="admin-access-icon">
            🚫
          </div>

          <h2>
            Access Denied
          </h2>

          <p>
            Your account does not have
            administrator permissions.
          </p>

          <button
            className="admin-back-button"
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


  /* ==========================================
     DATA LOADING
  ========================================== */

  if (!dataReady) {
    return (
      <div className="admin-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading admin dashboard...
        </p>

      </div>
    );
  }


  /* ==========================================
     ADMIN DASHBOARD
  ========================================== */

  return (
    <div className="admin-dashboard">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="admin-header">

        {/* LEFT SIDE */}

        <div className="admin-header-left">

          <button
            className="admin-back-home"
            onClick={() =>
              navigate("/")
            }
          >
            ← Home
          </button>

          <div className="admin-header-title">

            <p className="admin-label">
              ADMIN PANEL
            </p>

            <h1>
              Dashboard
            </h1>

            <p className="admin-welcome">
              Welcome back,{" "}
              <strong>
                {adminUser?.name ||
                  currentUser.displayName ||
                  "Admin"}
              </strong>
            </p>

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div className="admin-header-right">

          <div className="admin-user-info">

            <div className="admin-avatar">

              {(
                adminUser?.name ||
                currentUser.email ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}

            </div>

            <div className="admin-user-details">

              <strong>
                {adminUser?.name ||
                  "Administrator"}
              </strong>

              <span>
                {currentUser.email}
              </span>

            </div>

          </div>


          <button
            className="admin-home-button"
            onClick={() =>
              navigate("/")
            }
          >
            View Website
          </button>

        </div>

      </header>


      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="admin-main">


        {/* =================================
            STATISTICS
        ================================= */}

        <section className="admin-stats">

          {/* TOTAL PARTY PLOTS */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              🏡
            </div>

            <div>

              <p>
                Total Party Plots
              </p>

              <h2>
                {totalPlots}
              </h2>

            </div>

          </div>


          {/* TOTAL BOOKINGS */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              📅
            </div>

            <div>

              <p>
                Total Bookings
              </p>

              <h2>
                {totalBookings}
              </h2>

            </div>

          </div>


          {/* CONFIRMED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              ✅
            </div>

            <div>

              <p>
                Confirmed
              </p>

              <h2>
                {confirmedBookings}
              </h2>

            </div>

          </div>


          {/* REVENUE */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              💰
            </div>

            <div>

              <p>
                Total Revenue
              </p>

              <h2>
                ₹
                {totalRevenue.toLocaleString(
                  "en-IN"
                )}
              </h2>

            </div>

          </div>

        </section>


        {/* =================================
            QUICK ACTIONS
        ================================= */}

        <section className="admin-actions">

          <div className="admin-action-heading">

            <div>

              <p className="section-small">
                MANAGEMENT
              </p>

              <h2>
                Quick Actions
              </h2>

            </div>


            <div className="admin-action-buttons">

              <button
                className="admin-primary-action"
                onClick={() =>
                  navigate(
                    "/admin/add-plot"
                  )
                }
              >
                <span>＋</span>
                Add Party Plot
              </button>

            </div>

          </div>

        </section>


        {/* =================================
            RECENT BOOKINGS
        ================================= */}

        <section className="admin-section">

          <div className="admin-section-header">

            <div>

              <p className="section-small">
                BOOKINGS
              </p>

              <h2>
                Recent Bookings
              </h2>

            </div>


            <div className="admin-booking-summary">

              <span>
                Confirmed:{" "}
                <strong>
                  {confirmedBookings}
                </strong>
              </span>

              <span>
                Cancelled:{" "}
                <strong>
                  {cancelledBookings}
                </strong>
              </span>

              <span>
                Completed:{" "}
                <strong>
                  {completedBookings}
                </strong>
              </span>

            </div>

          </div>


          {recentBookings.length === 0 ? (

            <div className="admin-empty-state">

              <div>
                📅
              </div>

              <h3>
                No bookings yet
              </h3>

              <p>
                New bookings will appear here.
              </p>

            </div>

          ) : (

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>
                      Customer
                    </th>

                    <th>
                      Party Plot
                    </th>

                    <th>
                      Event
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Guests
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {recentBookings.map(
                    (booking) => (

                      <tr
                        key={booking.id}
                      >

                        <td>

                          <div className="admin-customer">

                            <strong>
                              {booking.userName ||
                                "User"}
                            </strong>

                            <span>
                              {booking.userEmail ||
                                ""}
                            </span>

                          </div>

                        </td>


                        <td>
                          {booking.plotName ||
                            "Party Plot"}
                        </td>


                        <td>
                          {booking.eventType ||
                            "-"}
                        </td>


                        <td>
                          {booking.eventDate ||
                            "-"}
                        </td>


                        <td>
                          {booking.guestCount ||
                            0}
                        </td>


                        <td>
                          ₹
                          {Number(
                            booking.amount ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>


                        <td>

                          <span
                            className={`admin-status ${
                              booking.status ||
                              "pending"
                            }`}
                          >
                            {booking.status ||
                              "pending"}
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* =================================
            PARTY PLOT MANAGEMENT
        ================================= */}

        <section className="admin-section">

          <div className="admin-section-header">

            <div>

              <p className="section-small">
                VENUES
              </p>

              <h2>
                Party Plot Management
              </h2>

            </div>

            <span className="admin-count">
              {plots.length}{" "}
              {plots.length === 1
                ? "plot"
                : "plots"}
            </span>

          </div>


          {plots.length === 0 ? (

            <div className="admin-empty-state">

              <div>
                🏡
              </div>

              <h3>
                No party plots
              </h3>

              <p>
                Add your first party plot
                to get started.
              </p>

              <button
                className="admin-primary-action"
                onClick={() =>
                  navigate(
                    "/admin/add-plot"
                  )
                }
              >
                Add Party Plot
              </button>

            </div>

          ) : (

            <div className="admin-plots-grid">

              {plots.map((plot) => (

                <div
                  className="admin-plot-card"
                  key={plot.id}
                >

                  {/* IMAGE */}

                  <div className="admin-plot-image-wrapper">

                    <img
                      src={getPlotImage(plot)}
                      alt={
                        plot.name ||
                        "Party Plot"
                      }
                      className="admin-plot-image"
                      onError={(event) => {
                        event.currentTarget.src =
                          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3";
                      }}
                    />

                    <span
                      className={`admin-plot-status ${
                        plot.status ===
                        "inactive"
                          ? "inactive"
                          : "active"
                      }`}
                    >
                      {plot.status ||
                        "active"}
                    </span>

                  </div>


                  {/* CONTENT */}

                  <div className="admin-plot-content">

                    <div className="admin-plot-title-row">

                      <h3>
                        {plot.name}
                      </h3>

                      <span>
                        ⭐{" "}
                        {plot.rating || 0}
                      </span>

                    </div>


                    <p className="admin-plot-location">

                      📍{" "}

                      {plot.location?.area ||
                        ""}

                      {plot.location?.area &&
                      plot.location?.city
                        ? ", "
                        : ""}

                      {plot.location?.city ||
                        ""}

                    </p>


                    <div className="admin-plot-info">

                      <span>
                        👥{" "}
                        {plot.capacity
                          ?.maximum ||
                          0}{" "}
                        Guests
                      </span>

                      <span>
                        ₹
                        {Number(
                          plot.pricing
                            ?.perEvent ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>


                    {/* ACTIONS */}

                    <div className="admin-plot-actions">

                      <button
                        className="admin-view-button"
                        onClick={() =>
                          navigate(
                            `/plot/${plot.id}`,
                            {
                              state: {
                                plot,
                              },
                            }
                          )
                        }
                      >
                        View
                      </button>


                      <button
                        className="admin-edit-button"
                        onClick={() =>
                          navigate(
                            `/admin/edit-plot/${plot.id}`
                          )
                        }
                      >
                        Edit
                      </button>


                      <button
                        className="admin-delete-button"
                        onClick={() =>
                          handleDeletePlot(
                            plot
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* =================================
            USER OVERVIEW
        ================================= */}

        <section className="admin-section">

          <div className="admin-section-header">

            <div>

              <p className="section-small">
                USERS
              </p>

              <h2>
                User Overview
              </h2>

            </div>

            <span className="admin-count">
              {users.length}{" "}
              {users.length === 1
                ? "user"
                : "users"}
            </span>

          </div>


          <div className="admin-user-summary">

            {/* REGISTERED USERS */}

            <div>

              <span>
                👥
              </span>

              <div>

                <strong>
                  {users.length}
                </strong>

                <p>
                  Registered Users
                </p>

              </div>

            </div>


            {/* ADMINISTRATORS */}

            <div>

              <span>
                👑
              </span>

              <div>

                <strong>
                  {
                    users.filter(
                      (user) =>
                        user.admin === true
                    ).length
                  }
                </strong>

                <p>
                  Administrators
                </p>

              </div>

            </div>


            {/* TOTAL BOOKINGS */}

            <div>

              <span>
                📋
              </span>

              <div>

                <strong>
                  {totalBookings}
                </strong>

                <p>
                  Total Bookings
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;