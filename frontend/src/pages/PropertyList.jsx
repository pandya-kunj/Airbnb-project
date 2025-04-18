import React, { useEffect, useState } from "react";
import axios from "axios";
import PropertyCard from "../components/PropertyCard";
import "../styles/PropertyList.css";

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data } = await axios.get("http://localhost:4000/api/properties/all");
        setProperties(data.properties);
      } catch (error) {
        setError("Failed to fetch properties.");
        console.error(error);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="property-list">
      {error && <p className="error">{error}</p>}
      <div className="property-grid">
        {properties.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;