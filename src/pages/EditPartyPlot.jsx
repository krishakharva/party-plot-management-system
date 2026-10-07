import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onValue, ref, update } from "firebase/database";
import { auth, database } from "../firebase/firebaseConfig";

function EditPartyPlot() {
  const { id } = useParams();
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
    status: "active",
  });

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notFound, setNotFound] = useState(false);

  /*
   * Load party plot from Firebase
   */
  useEffect(() => {
    if (!id) {
      return undefined;
    }

    const plotRef = ref(database, `partyPlots/${id}`);

    const unsubscribe = onValue(
      plotRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setFormData({
          name: data.name || "",
          description: data.description || "",
          city: data.location?.city || "Vadodara",
          area: data.location?.area || "",
          address: data.location?.address || "",
          contact: data.contact || "",
          minimumGuests: data.capacity?.minimum || "",
          maximumGuests: data.capacity?.maximum || "",
          price: data.pricing?.perEvent || "",
          facilities: Array.isArray(data.facilities)
            ? data.facilities.join(", ")
            : "",
          image: data.images?.[0] || "",
          status: data.status || "active",
        });

        setLoading(false);
        setNotFound(false);
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError("Failed to load party plot.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  /*
   * Invalid ID
   */
  if (!id) {
    return (
      <div className="admin-access-page">
        <div className="admin-access-card">
          <h2>Invalid Party Plot</h2>

          <p>
            No party plot ID was provided.
          </p>

          <button
            className="admin-back-button"
            onClick={() => navigate("/admin")}
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>

        <p>Loading party plot...</p>
      </div>
    );
  }

  /*
   * Party plot not found
   */
  if (notFound) {
    return (
      <div className="admin-access-page">
        <div className="admin-access-card">
          <h2>Party Plot Not Found</h2>

          <p>
            The party plot you are trying to edit does not exist.
          </p>

          <button
            className="admin-back-button"
            onClick={() => navigate("/admin")}
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  /*
   * Input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Submit update
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Required fields
     */
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.area.trim() ||
      !formData.address.trim() ||
      !formData.contact.trim() ||
      !formData.minimumGuests ||
      !formData.maximumGuests ||
      !formData.price
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const minimumGuests = Number(formData.minimumGuests);
    const maximumGuests = Number(formData.maximumGuests);
    const price = Number(formData.price);

    /*
     * Number validation
     */
    if (
      Number.isNaN(minimumGuests) ||
      Number.isNaN(maximumGuests) ||
      Number.isNaN(price)
    ) {
      setError(
        "Guest capacity and price must be valid numbers."
      );
      return;
    }

    /*
     * Capacity validation
     */
    if (minimumGuests <= 0 || maximumGuests <= 0) {
      setError(
        "Guest capacity must be greater than 0."
      );
      return;
    }

    if (minimumGuests > maximumGuests) {
      setError(
        "Minimum guests cannot be greater than maximum guests."
      );
      return;
    }

    /*
     * Price validation
     */
    if (price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    /*
     * Authentication check
     */
    if (!auth.currentUser) {
      setError(
        "You must be logged in as an admin."
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * Convert comma-separated facilities
       * into Firebase array
       */
      const facilities = formData.facilities
        .split(",")
        .map((facility) => facility.trim())
        .filter((facility) => facility !== "");

      /*
       * Updated plot data
       */
      const updatedPlot = {
        name: formData.name.trim(),

        description: formData.description.trim(),

        location: {
          city: formData.city,
          area: formData.area.trim(),
          address: formData.address.trim(),
        },

        contact: formData.contact.trim(),

        capacity: {
          minimum: minimumGuests,
          maximum: maximumGuests,
        },

        pricing: {
          perEvent: price,
        },

        facilities,

        images: [
          formData.image.trim() ||
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3",
        ],

        status: formData.status,
      };

      /*
       * Update only this party plot
       */
      await update(
        ref(database, `partyPlots/${id}`),
        updatedPlot
      );

      setSuccess(
        "Party plot updated successfully!"
      );

      /*
       * Return to admin dashboard
       */
      setTimeout(() => {
        navigate("/admin");
      }, 1200);
    } catch (firebaseError) {
      console.error(firebaseError);

      setError(
        "Failed to update party plot. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-plot-page">
      <div className="add-plot-container">

        {/* Header */}
        <div className="add-plot-header">

          <button
            className="add-plot-back-button"
            onClick={() => navigate("/admin")}
          >
            ← Back to Dashboard
          </button>

          <div>
            <p className="section-small">
              ADMIN PANEL
            </p>

            <h1>Edit Party Plot</h1>

            <p>
              Update the details, pricing and
              facilities of this party plot.
            </p>
          </div>

        </div>

        {/* Form */}
        <form
          className="add-plot-form"
          onSubmit={handleSubmit}
        >

          {/* Basic Information */}
          <div className="add-plot-section">

            <h2 className="add-plot-section-title">
              Basic Information
            </h2>

            <div className="add-plot-grid">

              <div className="add-plot-field full-width">

                <label>
                  Party Plot Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter party plot name"
                />

              </div>

              <div className="add-plot-field full-width">

                <label>
                  Description *
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the party plot..."
                  rows="5"
                />

              </div>

            </div>

          </div>

          {/* Location */}
          <div className="add-plot-section">

            <h2 className="add-plot-section-title">
              Location Details
            </h2>

            <div className="add-plot-grid">

              <div className="add-plot-field">

                <label>
                  City *
                </label>

                <select
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

                <label>
                  Area *
                </label>

                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g. Gotri"
                />

              </div>

              <div className="add-plot-field full-width">

                <label>
                  Full Address *
                </label>

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                />

              </div>

              <div className="add-plot-field">

                <label>
                  Contact Number *
                </label>

                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                />

              </div>

            </div>

          </div>

          {/* Capacity and Pricing */}
          <div className="add-plot-section">

            <h2 className="add-plot-section-title">
              Capacity & Pricing
            </h2>

            <div className="add-plot-grid">

              <div className="add-plot-field">

                <label>
                  Minimum Guests *
                </label>

                <input
                  type="number"
                  name="minimumGuests"
                  value={formData.minimumGuests}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 100"
                />

              </div>

              <div className="add-plot-field">

                <label>
                  Maximum Guests *
                </label>

                <input
                  type="number"
                  name="maximumGuests"
                  value={formData.maximumGuests}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 1000"
                />

              </div>

              <div className="add-plot-field">

                <label>
                  Price Per Event (₹) *
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 150000"
                />

              </div>

            </div>

          </div>

          {/* Facilities */}
          <div className="add-plot-section">

            <h2 className="add-plot-section-title">
              Facilities & Image
            </h2>

            <div className="add-plot-grid">

              <div className="add-plot-field full-width">

                <label>
                  Facilities
                </label>

                <input
                  type="text"
                  name="facilities"
                  value={formData.facilities}
                  onChange={handleChange}
                  placeholder="Parking, AC Hall, Garden, Catering..."
                />

                <small>
                  Separate facilities using commas.
                </small>

              </div>

              <div className="add-plot-field full-width">

                <label>
                  Image URL
                </label>

                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="Enter image URL"
                />

              </div>

            </div>

          </div>

          {/* Status */}
          <div className="add-plot-section">

            <h2 className="add-plot-section-title">
              Plot Status
            </h2>

            <div className="add-plot-grid">

              <div className="add-plot-field">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>

              </div>

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
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="add-plot-actions">

            <button
              type="button"
              className="add-plot-cancel-button"
              onClick={() => navigate("/admin")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-plot-submit-button"
              disabled={saving}
            >
              {saving
                ? "Updating..."
                : "Update Party Plot"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default EditPartyPlot;