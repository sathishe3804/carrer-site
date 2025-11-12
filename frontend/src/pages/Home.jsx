import React, { useEffect, useState } from "react";
import "./Home.css";

export default function Home() {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Guest";

  const [, setShowScroll] = useState(false);

  // Optional: fade-in animation when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-bg">
      <div className="home-content">
        <h1 className="welcome-text">Welcome, {name}! 👋</h1>

        <section className="description-section">
          <h3>Explore Your Career Path</h3>
          <p>
            Browse top job opportunities, post openings as an admin, and engage in
            community forums. Scroll down to explore what’s new and trending today!
          </p>
        </section>

        <div className="forum-scroll">
          <h4 className="forum-title">Latest Forum Topics</h4>
          <div className="forum-box-container">
            <div className="forum-box fade-in delay-1">
              <h5>How to Prepare for Interviews</h5>
              <p>Tips and strategies shared by industry experts to ace your next interview.</p>
            </div>
            <div className="forum-box fade-in delay-2">
              <h5>Career Growth Stories</h5>
              <p>Read inspiring journeys from professionals who started just like you.</p>
            </div>
            <div className="forum-box fade-in delay-3">
              <h5>Tech Trends 2025</h5>
              <p>Discover the latest technologies shaping the modern workplace.</p>
            </div>
          </div>
        </div>

        <footer className="home-footer">
          <p>© 2025 Career Site. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
