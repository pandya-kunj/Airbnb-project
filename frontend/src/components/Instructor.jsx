import React from "react";
import "../styles/Instructor.css";
import instructorImage from "../assets/profile.png";

const Instructor = () => {
  return (
    <div className="instructor-page">
      <div className="instructor-card">
        <div className="instructor-image">
          <img  alt="Instructor" />
        </div>
        <div className="instructor-info">
          <h1>Pandya Kunj</h1>
          <h4>Your Instructor</h4>
          <p>
            Hello! I'm  pandya kunj, a passionate MERN stack developer
            with a love for teaching and building scalable, robust applications.
            With years of experience in JavaScript, React, Node.js, Express, and
            MongoDB, I am dedicated to helping developers learn and grow their
            skills. Join me in this journey to master authentication and the
            MERN stack!
          </p>
          <div className="social-links">
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
            >
              Youtube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
