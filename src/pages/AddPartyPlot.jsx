import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ref,
  push,
  update,
} from "firebase/database";

import {
  database,
  auth,
} from "../firebase/firebaseConfig";


function AddPartyPlot() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "Vadodara",
    area: "",
    address: "",
    contact: "",
    minimumGuests: "",
    maximumGuests: "",
    price: "",
    facilities: "",
    image: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


  // --------------------------------
  // Handle input changes
  // --------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // --------------------------------
  // Create next 30 availability dates
  // --------------------------------

  const createAvailability = () => {
    const availability = {};

    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);

      date.setDate(
        today.getDate() + i
      );

      const year =
        date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const dateString =
        `${year}-${month}-${day}`;

      availability[dateString] =
        "available";
    }

    return availability;
  };


  // --------------------------------
  // Submit form
  // --------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(false);


    // Validation

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.area.trim() ||
      !formData.address.trim() ||
      !formData.contact.trim()
    ) {
      setError(
        "Please fill in all required fields."
      );
      return;
    }


    const minimumGuests =
      Number(
        formData.minimumGuests
      );

    const maximumGuests =
      Number(
        formData.maximumGuests
      );

    const price =
      Number(formData.price);


    if (
      !minimumGuests ||
      minimumGuests < 1
    ) {
      setError(
        "Please enter a valid minimum guest capacity."
      );
      return;
    }


    if (
      !maximumGuests ||
      maximumGuests < minimumGuests
    ) {
      setError(
        "Maximum guests must be greater than or equal to minimum guests."
      );
      return;
    }


    if (!price || price <= 0) {
      setError(
        "Please enter a valid event price."
      );
      return;
    }


    if (!auth.currentUser) {
      setError(
        "Your login session has expired. Please login again."
      );
      return;
    }


    try {
      setLoading(true);


      // Create new plot reference

      const plotsRef =
        ref(database, "partyPlots");

      const newPlotRef =
        push(plotsRef);

      const plotId =
        newPlotRef.key;


      // Convert facilities text into array

      const facilities =
        formData.facilities
          .split(",")
          .map((facility) =>
            facility.trim()
          )
          .filter(
            (facility) =>
              facility.length > 0
          );


      // Create plot data

      const plotData = {
        name:
          formData.name.trim(),

        description:
          formData.description.trim(),

        ownerId:
          auth.currentUser.uid,

        contact:
          formData.contact.trim(),

        location: {
          area:
            formData.area.trim(),

          city:
            formData.city,

          address:
            formData.address.trim(),
        },

        capacity: {
          minimum:
            minimumGuests,

          maximum:
            maximumGuests,
        },

        pricing: {
          perEvent:
            price,
        },

        facilities,

        rating: 0,

        reviewCount: 0,

        images: [
          formData.image.trim() ||
          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3"
        ],

        status:
          "active",

        createdAt:
          new Date().toISOString(),
      };


      // Create availability

      const availability =
        createAvailability();


      // Save both plot and availability

      const updates = {};

      updates[
        `partyPlots/${plotId}`
      ] = plotData;

      updates[
        `availability/${plotId}`
      ] = availability;


      await update(
        ref(database),
        updates
      );


      setSuccess(true);

      setTimeout(() => {
        navigate("/admin");
      }, 1500);

    } catch (firebaseError) {

      console.error(
        "Error adding party plot:",
        firebaseError
      );

      setError(
        "Unable to add the party plot. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="add-plot-page">

      <div className="add-plot-container">

        {/* Header */}

        <div className="add-plot-header">

          <button
            className="add-plot-back-button"
            onClick={() =>
              navigate("/admin")
            }
          >
            ← Back to Dashboard
          </button>

          <p className="section-small">
            ADMIN PANEL
          </p>

          <h1>
            Add Party Plot
          </h1>

          <p>
            Add a new party plot to your
            platform.
          </p>

        </div>


        {/* Form */}

        <form
          className="add-plot-form"
          onSubmit={handleSubmit}
        >

          {/* Basic Information */}

          <div className="add-plot-section">

            <div className="add-plot-section-title">

              <span>
                🏢
              </span>

              <div>
                <h2>
                  Basic Information
                </h2>

                <p>
                  Enter the basic details of
                  the party plot.
                </p>
              </div>

            </div>


            <div className="add-plot-grid">

              <div className="add-plot-field full-width">

                <label htmlFor="name">
                  Party Plot Name *
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Royal Celebration Garden"
                  value={formData.name}
                  onChange={handleChange}
                />

              </div>


              <div className="add-plot-field full-width">

                <label htmlFor="description">
                  Description *
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Describe the party plot..."
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                />

              </div>

            </div>

          </div>


          {/* Location */}

          <div className="add-plot-section">

            <div className="add-plot-section-title">

              <span>
                📍
              </span>

              <div>
                <h2>
                  Location
                </h2>

                <p>
                  Enter the venue location.
                </p>
              </div>

            </div>


            <div className="add-plot-grid">

              <div className="add-plot-field">

                <label htmlFor="city">
                  City *
                </label>

                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                >

                  <option value="Vadodara">
                    Vadodara
                  </option>

                  <option value="Ahmedabad">
                    Ahmedabad
                  </option>

                </select>

              </div>


              <div className="add-plot-field">

                <label htmlFor="area">
                  Area *
                </label>

                <input
                  id="area"
                  name="area"
                  type="text"
                  placeholder="e.g. Gotri"
                  value={formData.area}
                  onChange={handleChange}
                />

              </div>


              <div className="add-plot-field full-width">

                <label htmlFor="address">
                  Full Address *
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter complete venue address"
                  value={
                    formData.address
                  }
                  onChange={handleChange}
                />

              </div>


              <div className="add-plot-field">

                <label htmlFor="contact">
                  Contact Number *
                </label>

                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={
                    formData.contact
                  }
                  onChange={handleChange}
                />

              </div>

            </div>

          </div>


          {/* Capacity & Pricing */}

          <div className="add-plot-section">

            <div className="add-plot-section-title">

              <span>
                👥
              </span>

              <div>
                <h2>
                  Capacity & Pricing
                </h2>

                <p>
                  Set the guest capacity and
                  event price.
                </p>
              </div>

            </div>


            <div className="add-plot-grid">

              <div className="add-plot-field">

                <label htmlFor="minimumGuests">
                  Minimum Guests *
                </label>

                <input
                  id="minimumGuests"
                  name="minimumGuests"
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={
                    formData.minimumGuests
                  }
                  onChange={handleChange}
                />

              </div>


              <div className="add-plot-field">

                <label htmlFor="maximumGuests">
                  Maximum Guests *
                </label>

                <input
                  id="maximumGuests"
                  name="maximumGuests"
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={
                    formData.maximumGuests
                  }
                  onChange={handleChange}
                />

              </div>


              <div className="add-plot-field">

                <label htmlFor="price">
                  Price Per Event (₹) *
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  placeholder="e.g. 50000"
                  value={formData.price}
                  onChange={handleChange}
                />

              </div>

            </div>

          </div>


          {/* Facilities */}

          <div className="add-plot-section">

            <div className="add-plot-section-title">

              <span>
                ✨
              </span>

              <div>
                <h2>
                  Facilities
                </h2>

                <p>
                  Enter facilities separated
                  by commas.
                </p>
              </div>

            </div>


            <div className="add-plot-field">

              <label htmlFor="facilities">
                Facilities
              </label>

              <input
                id="facilities"
                name="facilities"
                type="text"
                placeholder="Parking, Catering, AC Hall, Decoration"
                value={
                  formData.facilities
                }
                onChange={handleChange}
              />

              <small>
                Example: Parking, Catering,
                Decoration, DJ, Security
              </small>

            </div>

          </div>


          {/* Image */}

          <div className="add-plot-section">

            <div className="add-plot-section-title">

              <span>
                🖼️
              </span>

              <div>
                <h2>
                  Venue Image
                </h2>

                <p>
                  Add an image URL for the
                  party plot.
                </p>
              </div>

            </div>


            <div className="add-plot-field">

              <label htmlFor="image">
                Image URL
              </label>

              <input
                id="image"
                name="image"
                type="url"
                placeholder="https://example.com/party-plot.jpg"
                value={formData.image}
                onChange={handleChange}
              />

              <small>
                Leave empty to use the default
                party plot image.
              </small>

            </div>

          </div>


          {/* Error */}

          {error && (
            <div className="add-plot-error">
              {error}
            </div>
          )}


          {/* Success */}

          {success && (
            <div className="add-plot-success">
              ✓ Party plot added successfully!
              Redirecting to dashboard...
            </div>
          )}


          {/* Buttons */}

          <div className="add-plot-actions">

            <button
              type="button"
              className="add-plot-cancel-button"
              onClick={() =>
                navigate("/admin")
              }
              disabled={loading}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="add-plot-submit-button"
              disabled={
                loading || success
              }
            >

              {loading
                ? "Adding Party Plot..."
                : "Add Party Plot"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default AddPartyPlot;