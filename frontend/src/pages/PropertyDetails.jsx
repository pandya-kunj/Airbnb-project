import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/PropertyDetails.css";

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:4000/api/properties/${id}`);
        setProperty(data.property);
      } catch (error) {
        setError("Failed to fetch property details.");
        console.error(error);
      }
    };
    fetchPropertyDetails();
  }, [id]);

  return (
    <div className="property-details">
      {error && <p className="error">{error}</p>}
      {property ? (
        <>
          <h1>{property.title}</h1>
          <div className="details-content">
            <img src={property.images?.[0] || "default-image.jpg"} alt={property.title || "Property"} className="details-image" />
            <p>{property.description || "No description available"}</p>
            <h3>Price: ${property.price} / night</h3>
            <p>Address: {property.address}</p>
            <p>Listed By: {property.listedBy?.name || "Unknown"}</p>
          </div>
        </>
      ) : (
        <p>Loading property details...</p>
      )}
    </div>
  );
};

export default PropertyDetails;