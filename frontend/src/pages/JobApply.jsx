import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function JobApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [job, setJob] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    city: "",
    position: "",
    start_date: "",
    resume: null,
  });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch job details from the live backend (Railway)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch job details");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => {
        console.error("Job fetch error:", err);
        alert("Failed to load job details. Please try again later.");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // ✅ Submit job application
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please login to apply for jobs.");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.append("job_id", id);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) throw new Error(data.message || "Application failed");

      alert("✅ Application submitted successfully!");
      navigate("/applications");
    } catch (err) {
      setLoading(false);
      console.error("Apply error:", err);
      alert("❌ Failed to submit application. Please try again.");
    }
  };

  if (!job) return <p className="text-center mt-5">Loading job details...</p>;

  return (
    <div className="container mt-4">
      <h3>Apply for: {job.title}</h3>
      <p>
        <strong>{job.company}</strong> • {job.location}
      </p>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="row">
          <div className="col-md-6 mb-2">
            <input
              name="first_name"
              placeholder="First name"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6 mb-2">
            <input
              name="last_name"
              placeholder="Last name"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="form-control mb-2"
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone"
          className="form-control mb-2"
          onChange={handleChange}
        />
        <input
          name="gender"
          placeholder="Gender"
          className="form-control mb-2"
          onChange={handleChange}
        />
        <input
          name="city"
          placeholder="City"
          className="form-control mb-2"
          onChange={handleChange}
        />
        <input
          name="position"
          placeholder="Position"
          className="form-control mb-2"
          onChange={handleChange}
        />
        <input
          name="start_date"
          type="date"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <label className="form-label">Upload Resume (PDF/DOC)</label>
        <input
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx"
          className="form-control mb-3"
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
