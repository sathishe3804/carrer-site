import React, { useEffect, useState } from "react";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to view your applications.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/applications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Server error");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          console.error("Invalid API response:", data);
          setApplications([]);
        }
      })
      .catch((err) => {
        console.error("Error loading applications:", err);
        setError("Failed to load applications.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-3 text-center">My Applications</h2>

      {applications.length === 0 ? (
        <div className="alert alert-info text-center">
          No applications found.
        </div>
      ) : (
        <table className="table table-hover shadow-sm border rounded">
          <thead className="table-dark">
            <tr>
              <th>Job Title</th>
              <th>Status</th>
              <th>Interview Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.job_title}</td>
                <td>
                  <span
                    className={`badge ${
                      app.status === "Accepted"
                        ? "bg-success"
                        : app.status === "Rejected"
                        ? "bg-danger"
                        : "bg-warning text-dark"
                    }`}
                  >
                    {app.status}
                  </span>
                </td>
                <td>{app.interview_date || "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
