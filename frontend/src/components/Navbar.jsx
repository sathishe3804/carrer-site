import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <Link className="navbar-brand fw-bold" to="/">Forum Careers</Link>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/jobs">Jobs</Link></li>

          {token && user?.role === "user" && (
            <li className="nav-item"><Link className="nav-link" to="/applications">My Applications</Link></li>
          )}

          {token && user?.role === "admin" && (
            <>
              <li className="nav-item"><Link className="nav-link" to="/admin">Admin Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/admin/applications">Applications</Link></li>
            </>
          )}

          {!token ? (
            <>
              <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/signup">Signup</Link></li>
            </>
          ) : (
            <li className="nav-item">
              <button className="btn btn-sm btn-light ms-2" onClick={handleLogout}>Logout</button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
