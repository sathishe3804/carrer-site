import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      alert("Please log in to view available jobs.");
      navigate("/login");
      return;
    }

    const endpoint =
      user?.role === "admin"
        ? `${API_BASE_URL}/api/admin/jobs`
        : `${API_BASE_URL}/api/jobs`;

    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) {
          alert("Session expired or unauthorized. Please log in again.");
          navigate("/login");
          return [];
        }
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        return res.json();
      })
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching jobs:", err))
      .finally(() => setLoading(false));
  }, [user, token, navigate]);

  if (loading) return <p className="text-center">Loading jobs...</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Job Listings</h2>
      {jobs.length === 0 ? (
        <p className="text-center">No jobs available.</p>
      ) : (
        <div className="row">
          {jobs.map((job) => (
            <div key={job.id} className="col-md-6 mb-4">
              <div className="card shadow-sm job-card border rounded">
                <div className="card-body">
                  <h4 className="card-title">{job.title}</h4>
                  <h6 className="text-muted">
                    {job.company} • {job.location}
                  </h6>
                  <p className="card-text mt-2">
                    {job.description?.substring(0, 100)}...
                  </p>

                  {user?.role === "admin" ? (
                    <span className="badge bg-success mt-3">Posted by You</span>
                  ) : (
                    <Link to={`/jobs/${job.id}/apply`} className="btn btn-primary mt-2">
                      Apply Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
