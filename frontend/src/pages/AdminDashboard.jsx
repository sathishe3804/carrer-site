import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config"; // ✅ Import backend URL

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    description: ""
  });

  const token = localStorage.getItem("token");

  // ✅ Fetch jobs for admin
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/api/admin/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error("Fetch error:", err));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Post new job
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to post job");
      }

      alert("✅ Job posted successfully!");

      // Refresh jobs list
      fetch(`${API_BASE_URL}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(setJobs);

      // Clear form
      setForm({ title: "", company: "", location: "", description: "" });
    } catch (err) {
      console.error("Error posting job:", err);
      alert("❌ Failed to post job. Check console for details.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Admin Dashboard</h2>
      <p>Manage your job listings here.</p>

      {/* ✅ Job Posting Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          className="form-control mb-2"
          name="title"
          placeholder="Job Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          className="form-control mb-2"
          name="company"
          placeholder="Company"
          value={form.company}
          onChange={handleChange}
          required
        />
        <input
          className="form-control mb-2"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />
        <textarea
          className="form-control mb-2"
          name="description"
          placeholder="Job Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <button className="btn btn-success" type="submit">
          Post Job
        </button>
      </form>

      {/* ✅ Jobs List */}
      {Array.isArray(jobs) && jobs.length > 0 ? (
        <ul className="list-group mt-3">
          {jobs.map((job) => (
            <li key={job.id} className="list-group-item">
              <strong>{job.title}</strong> — {job.company} ({job.location})
            </li>
          ))}
        </ul>
      ) : (
        <p>No jobs posted yet.</p>
      )}
    </div>
  );
}
