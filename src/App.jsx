import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";

import { useEffect, useState } from "react";

import {
  ref,
  onValue,
} from "firebase/database";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  database,
  auth,
} from "./firebase/firebaseConfig";

import PartyPlotCard from "./components/PartyPlotCard";

import PlotDetails from "./pages/PlotDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import AddPartyPlot from "./pages/AddPartyPlot";
import EditPartyPlot from "./pages/EditPartyPlot";

import "./index.css";


function Home() {
  const navigate = useNavigate();

  /* ==========================================
     PARTY PLOTS
  ========================================== */

  const [plots, setPlots] = useState([]);


  /* ==========================================
     SEARCH & FILTER STATES
  ========================================== */

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [facility, setFacility] = useState("All");


  /* ==========================================
     AUTH STATE
  ========================================== */

  const [currentUser, setCurrentUser] = useState(null);


  /* ==========================================
     LOAD AUTH STATE
  ========================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
      }
    );

    return () => unsubscribe();
  }, []);


  /* ==========================================
     LOAD PARTY PLOTS FROM FIREBASE
  ========================================== */

  useEffect(() => {
    const plotsRef = ref(database, "partyPlots");

    const unsubscribe = onValue(
      plotsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const plotList = Object.entries(data).map(
            ([id, plot]) => ({
              id,
              ...plot,
            })
          );

          setPlots(plotList);
        } else {
          setPlots([]);
        }
      }
    );

    return () => unsubscribe();
  }, []);


  /* ==========================================
     GET ALL AVAILABLE FACILITIES
  ========================================== */

  const availableFacilities = [
    ...new Set(
      plots.flatMap((plot) => {
        if (Array.isArray(plot.facilities)) {
          return plot.facilities;
        }

        if (typeof plot.facilities === "string") {
          return plot.facilities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }

        return [];
      })
    ),
  ].sort();


  /* ==========================================
     FILTER PARTY PLOTS
  ========================================== */

  const filteredPlots = plots.filter((plot) => {

    /* ---------- SEARCH ---------- */

    const searchText = search
      .toLowerCase()
      .trim();

    const plotName =
      plot.name?.toLowerCase() || "";

    const plotArea =
      plot.location?.area?.toLowerCase() || "";

    const plotCity =
      plot.location?.city?.toLowerCase() || "";

    const plotAddress =
      plot.location?.address?.toLowerCase() || "";

    const matchesSearch =
      searchText === "" ||
      plotName.includes(searchText) ||
      plotArea.includes(searchText) ||
      plotCity.includes(searchText) ||
      plotAddress.includes(searchText);


    /* ---------- CITY ---------- */

    const matchesCity =
      city === "All" ||
      plot.location?.city === city;


    /* ---------- PRICE ---------- */

    const plotPrice =
      Number(plot.pricing?.perEvent) || 0;

    const matchesPrice =
      maxPrice === "" ||
      plotPrice <= Number(maxPrice);


    /* ---------- GUEST CAPACITY ---------- */

    const plotCapacity =
      Number(plot.capacity?.maximum) || 0;

    const matchesGuests =
      minGuests === "" ||
      plotCapacity >= Number(minGuests);


    /* ---------- RATING ---------- */

    const plotRating =
      Number(plot.rating) || 0;

    const matchesRating =
      Number(minRating) === 0 ||
      plotRating >= Number(minRating);


    /* ---------- FACILITY ---------- */

    let plotFacilities = [];

    if (Array.isArray(plot.facilities)) {
      plotFacilities = plot.facilities;
    } else if (typeof plot.facilities === "string") {
      plotFacilities = plot.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    const matchesFacility =
      facility === "All" ||
      plotFacilities.includes(facility);


    /* ---------- FINAL RESULT ---------- */

    return (
      matchesSearch &&
      matchesCity &&
      matchesPrice &&
      matchesGuests &&
      matchesRating &&
      matchesFacility
    );
  });


  /* ==========================================
     RESET FILTERS
  ========================================== */

  const handleResetFilters = () => {
    setSearch("");
    setCity("All");
    setMaxPrice("");
    setMinGuests("");
    setMinRating("0");
    setFacility("All");
  };


  /* ==========================================
     CHECK WHETHER FILTERS ARE ACTIVE
  ========================================== */

  const filtersActive =
    search.trim() !== "" ||
    city !== "All" ||
    maxPrice !== "" ||
    minGuests !== "" ||
    minRating !== "0" ||
    facility !== "All";


  /* ==========================================
     VIEW DETAILS
  ========================================== */

  const handleViewDetails = (plot) => {
    navigate(`/plot/${plot.id}`, {
      state: {
        plot,
      },
    });
  };


  /* ==========================================
     LOGOUT
  ========================================== */

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  /* ==========================================
     HOME PAGE
  ========================================== */

  return (
    <div className="app">

      {/* ======================================
          NAVBAR
      ====================================== */}

      <nav className="navbar">

        <div className="logo">
          Party<span>Plot</span>
        </div>


        <div className="nav-links">

          <Link to="/">
            Home
          </Link>

          <a href="#plots">
            Party Plots
          </a>

          <a href="#about">
            About
          </a>

          <a href="#contact">
            Contact
          </a>

          <Link to="/my-bookings">
            My Bookings
          </Link>

        </div>


        {currentUser ? (

          <div className="user-nav">

            <span className="user-greeting">
              Hi{" "}
              {currentUser.displayName ||
                currentUser.email}
            </span>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        ) : (

          <button
            className="login-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

        )}

      </nav>


      {/* ======================================
          HERO
      ====================================== */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <p className="hero-small">
            YOUR PERFECT VENUE AWAITS
          </p>

          <h1>
            Find the Perfect
            <br />
            <span>Party Plot</span>
          </h1>

          <p className="hero-description">
            Discover beautiful party plots
            for weddings, birthdays,
            receptions, corporate events
            and every special celebration.
          </p>

          <a
            href="#plots"
            className="explore-button"
          >
            Explore Party Plots →
          </a>

        </div>

      </section>


      {/* ======================================
          SEARCH & ADVANCED FILTERS
      ====================================== */}

      <section className="search-section">

        <div className="advanced-search-box">

          {/* SEARCH */}

          <div className="advanced-search-main">

            <div className="search-input">

              <span>🔍</span>

              <input
                type="text"
                placeholder="Search by plot name, area, city or address..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

          </div>


          {/* FILTERS */}

          <div className="advanced-filters">

            {/* CITY */}

            <div className="filter-group">

              <label>
                📍 City
              </label>

              <select
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
              >

                <option value="All">
                  All Cities
                </option>

                <option value="Vadodara">
                  Vadodara
                </option>

                <option value="Ahmedabad">
                  Ahmedabad
                </option>

              </select>

            </div>


            {/* MAX PRICE */}

            <div className="filter-group">

              <label>
                💰 Maximum Price
              </label>

              <select
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
              >

                <option value="">
                  Any Price
                </option>

                <option value="50000">
                  Up to ₹50,000
                </option>

                <option value="100000">
                  Up to ₹1,00,000
                </option>

                <option value="150000">
                  Up to ₹1,50,000
                </option>

                <option value="200000">
                  Up to ₹2,00,000
                </option>

                <option value="300000">
                  Up to ₹3,00,000
                </option>

              </select>

            </div>


            {/* GUEST CAPACITY */}

            <div className="filter-group">

              <label>
                👥 Guest Capacity
              </label>

              <select
                value={minGuests}
                onChange={(event) =>
                  setMinGuests(event.target.value)
                }
              >

                <option value="">
                  Any Capacity
                </option>

                <option value="100">
                  100+ Guests
                </option>

                <option value="250">
                  250+ Guests
                </option>

                <option value="500">
                  500+ Guests
                </option>

                <option value="750">
                  750+ Guests
                </option>

                <option value="1000">
                  1000+ Guests
                </option>

                <option value="1500">
                  1500+ Guests
                </option>

              </select>

            </div>


            {/* RATING */}

            <div className="filter-group">

              <label>
                ⭐ Minimum Rating
              </label>

              <select
                value={minRating}
                onChange={(event) =>
                  setMinRating(event.target.value)
                }
              >

                <option value="0">
                  Any Rating
                </option>

                <option value="3">
                  3.0+ ⭐
                </option>

                <option value="3.5">
                  3.5+ ⭐
                </option>

                <option value="4">
                  4.0+ ⭐
                </option>

                <option value="4.5">
                  4.5+ ⭐
                </option>

              </select>

            </div>


            {/* FACILITY */}

            <div className="filter-group">

              <label>
                🎉 Facility
              </label>

              <select
                value={facility}
                onChange={(event) =>
                  setFacility(event.target.value)
                }
              >

                <option value="All">
                  All Facilities
                </option>

                {availableFacilities.map(
                  (item) => (
                    <option
                      value={item}
                      key={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* RESET */}

            <button
              className="reset-filters-button"
              onClick={handleResetFilters}
              disabled={!filtersActive}
            >
              ↻ Reset Filters
            </button>

          </div>

        </div>

      </section>


      {/* ======================================
          PARTY PLOTS
      ====================================== */}

      <section
        className="plots-section"
        id="plots"
      >

        <div className="section-heading">

          <div>

            <p className="section-small">
              DISCOVER VENUES
            </p>

            <h2>
              Popular Party Plots
            </h2>

          </div>

          <p>
            {filteredPlots.length}{" "}
            {filteredPlots.length === 1
              ? "plot"
              : "plots"}{" "}
            available
          </p>

        </div>


        {/* ACTIVE FILTER SUMMARY */}

        {filtersActive && (

          <div className="active-filter-bar">

            <span>
              🔎 Showing{" "}
              <strong>
                {filteredPlots.length}
              </strong>{" "}
              matching plots
            </span>

            <button
              onClick={handleResetFilters}
            >
              Clear all filters
            </button>

          </div>

        )}


        {/* RESULTS */}

        {filteredPlots.length === 0 ? (

          <div className="no-results">

            <div className="no-results-icon">
              🔍
            </div>

            <h3>
              No party plots found
            </h3>

            <p>
              Try changing your search or
              filter options.
            </p>

            {filtersActive && (

              <button
                className="no-results-reset"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>

            )}

          </div>

        ) : (

          <div className="plots-grid">

            {filteredPlots.map(
              (plot) => (

                <PartyPlotCard
                  key={plot.id}
                  plot={plot}
                  onViewDetails={
                    handleViewDetails
                  }
                />

              )
            )}

          </div>

        )}

      </section>


      {/* ======================================
          ABOUT
      ====================================== */}

      <section
        className="about-section"
        id="about"
      >

        <p className="section-small">
          ABOUT US
        </p>

        <h2>
          Making Event Planning Easier
        </h2>

        <p>
          Our Party Plot Management
          System helps users discover,
          compare and book party plots
          in Vadodara and Ahmedabad
          from one convenient platform.
        </p>

      </section>


      {/* ======================================
          CONTACT US
      ====================================== */}

      <section
        className="contact-section"
        id="contact"
      >

        <div className="contact-heading">

          <p className="section-small">
            GET IN TOUCH
          </p>

          <h2>
            Contact Us
          </h2>

          <p>
            Have a question about a party plot,
            booking or event? We are here to help
            you plan your perfect celebration.
          </p>

        </div>


        <div className="contact-content">

          {/* CONTACT INFORMATION */}

          <div className="contact-info">

            <div className="contact-card">

              <div className="contact-icon">
                📍
              </div>

              <div>
                <h3>
                  Visit Us
                </h3>

                <p>
                  Vadodara & Ahmedabad,
                  Gujarat, India
                </p>
              </div>

            </div>


            <div className="contact-card">

              <div className="contact-icon">
                📞
              </div>

              <div>
                <h3>
                  Call Us
                </h3>

                <a href="tel:+919876543210">
                  +91 98765 43210
                </a>

                <p>
                  Available for booking
                  assistance
                </p>
              </div>

            </div>


            <div className="contact-card">

              <div className="contact-icon">
                ✉️
              </div>

              <div>
                <h3>
                  Email Us
                </h3>

                <a href="mailto:partyplotmanagement@gmail.com">
                  partyplotmanagement@gmail.com
                </a>

                <p>
                  We will get back to you
                  as soon as possible.
                </p>
              </div>

            </div>

          </div>


          {/* CONTACT CTA */}

          <div className="contact-cta">

            <div className="contact-cta-icon">
              ✨
            </div>

            <h3>
              Planning a Special Event?
            </h3>

            <p>
              From intimate celebrations to
              grand weddings, find a venue that
              fits your event, guest count and
              budget.
            </p>

            <a
              href="#plots"
              className="contact-button"
            >
              Explore Party Plots →
            </a>

          </div>

        </div>

      </section>


      {/* ======================================
          FOOTER
      ====================================== */}

      <footer>

        <div className="footer-content">

          <div className="footer-brand">

            <h3>
              Party<span>Plot</span>
            </h3>

            <p>
              Find. Compare. Celebrate.
            </p>

          </div>


          <div className="footer-links">

            <a href="#home">
              Home
            </a>

            <a href="#plots">
              Party Plots
            </a>

            <a href="#about">
              About
            </a>

            <a href="#contact">
              Contact
            </a>

          </div>

        </div>


        <p className="copyright">
          © 2026 Party Plot Management System
        </p>

      </footer>

    </div>
  );
}


/* =========================================
   APP ROUTER
========================================= */

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/plot/:id"
          element={<PlotDetails />}
        />

        <Route
          path="/booking/:id"
          element={<Booking />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/add-plot"
          element={<AddPartyPlot />}
        />

        <Route
          path="/admin/edit-plot/:id"
          element={<EditPartyPlot />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;