import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const endpoint =
      user?.role === "admin"
        ? "http://localhost:5000/api/admin/jobs"
        : "http://localhost:5000/api/jobs";

    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  }, [user, token]);

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

                  {user?.role !== "admin" ? (
                    <Link
                      to={`/jobs/${job.id}/apply`}
                      className="btn btn-primary mt-2"
                    >
                      Apply Now
                    </Link>
                  ) : (
                    <span className="badge bg-success mt-3">Posted by You</span>
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
