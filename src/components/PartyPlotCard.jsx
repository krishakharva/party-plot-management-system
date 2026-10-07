function PartyPlotCard({ plot, onViewDetails }) {
  // Get the first image whether Firebase stores images
  // as an array or as an object (image1, image2, image3)
  let image = "";

  if (Array.isArray(plot.images)) {
    image = plot.images[0] || "";
  } else if (plot.images && typeof plot.images === "object") {
    image =
      plot.images.image1 ||
      plot.images.image2 ||
      plot.images.image3 ||
      Object.values(plot.images)[0] ||
      "";
  }

  // Fallback image
  if (!image) {
    image =
      "https://placehold.co/800x500?text=Party+Plot";
  }

  const price = plot.pricing?.perEvent || 0;
  const rating = plot.rating || 0;

  return (
    <div className="party-plot-card">

      {/* Plot Image */}
      <div className="party-plot-image-wrapper">
        <img
          src={image}
          alt={plot.name || "Party Plot"}
          className="party-plot-image"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/800x500?text=Party+Plot";
          }}
        />

        {/* Rating */}
        <div className="party-plot-rating">
          ⭐ {rating}
        </div>

        {/* Status */}
        {plot.status && (
          <div className="party-plot-status">
            {plot.status}
          </div>
        )}
      </div>

      {/* Plot Information */}
      <div className="party-plot-content">

        <h3>{plot.name || "Party Plot"}</h3>

        <p className="party-plot-location">
          📍{" "}
          {plot.area ||
            plot.location?.area ||
            "Location not available"}

          {plot.city ? `, ${plot.city}` : ""}
        </p>

        <p className="party-plot-description">
          {plot.description
            ? plot.description.length > 100
              ? `${plot.description.substring(0, 100)}...`
              : plot.description
            : "Beautiful party plot for your special occasions."}
        </p>

        {/* Plot Information */}
        <div className="party-plot-info-row">
          <span>
            👥 Up to {plot.capacity?.maximum || "N/A"} guests
          </span>

          <span>
            ⭐ {rating} rating
          </span>
        </div>

        {/* Price + Button */}
        <div className="party-plot-bottom">

          <div className="party-plot-price">
            <small>Starting from</small>

            <strong>
              ₹{Number(price).toLocaleString("en-IN")}
            </strong>

            <span>/ event</span>
          </div>

          <button
            className="view-details-btn"
            onClick={() => onViewDetails(plot)}
          >
            View Details
          </button>

        </div>
      </div>
    </div>
  );
}

export default PartyPlotCard;