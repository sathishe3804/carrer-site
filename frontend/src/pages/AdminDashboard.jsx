import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    description: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/admin/jobs", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error("Fetch error:", err));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (!res.ok) return alert("Job posting failed");

    alert("✅ Job posted successfully!");

    // Refresh jobs list
    fetch("http://localhost:2000/api/admin/jobs", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setJobs);

    // clear form
    setForm({ title: "", company: "", location: "", description: "" });
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
