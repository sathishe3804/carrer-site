import React, { useEffect, useState } from "react";
import "./AdminApplication.css";
import { API_BASE_URL } from "../config";

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // ✅ Fetch all applications safely
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/applications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // ✅ Ensure it's an array before setting state
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          console.warn("Unexpected response:", data);
          setApplications([]);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [token]);

  // ✅ Update Status
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/applications/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status. Check console.");
    }
  };

  // ✅ Update Interview Date
  const handleDateChange = async (id, newDate) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/applications/${id}/interview-date`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ interview_date: newDate }),
        }
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, interview_date: newDate } : app
        )
      );
    } catch (err) {
      console.error("Failed to update interview date:", err);
      alert("Error updating interview date. Check console.");
    }
  };

  // ✅ UI Rendering
  if (loading) return <p className="loading">Loading applications...</p>;

  return (
    <div className="admin-applications">
      <h2>Candidate Applications</h2>
      {Array.isArray(applications) && applications.length > 0 ? (
        <table className="app-table">
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th>Email</th>
              <th>Job Title</th>
              <th>Status</th>
              <th>Interview Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.first_name} {app.last_name}</td>
                <td>{app.email}</td>
                <td>{app.job_title}</td>
                <td>
                  <select
                    value={app.status || "Pending"}
                    onChange={(e) =>
                      handleStatusChange(app.id, e.target.value)
                    }
                    className={`status ${app.status?.toLowerCase() || "pending"}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    value={
                      app.interview_date
                        ? app.interview_date.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange(app.id, e.target.value)
                    }
                    className="date-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No applications found.</p>
      )}
    </div>
  );
}
