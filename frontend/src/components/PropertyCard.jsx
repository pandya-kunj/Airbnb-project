import React from "react";
import { Link } from "react-router-dom";
import "../styles/PropertyCard.css";

const PropertyCard = ({ property }) => {
  return (
    <div className="property-card">
      <Link to={`/properties/${property._id}`} className="property-link">
        <img src={property.images?.[0] || "default-image.jpg"} alt={property.title || "Property"} className="property-image" />
        <div className="property-info">
          <h3>{property.title}</h3>
          <p>{property.address}</p>
          <p>${property.price } per night</p>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard;