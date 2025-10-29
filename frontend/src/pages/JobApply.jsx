import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
    resume: null, // file upload
  });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch job details
  useEffect(() => {
    fetch(`http://localhost:5000/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Job fetch failed");
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => {
        console.error("Job fetch error:", err);
        alert("Failed to load job details.");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value, // handle file input
    }));
  };

  // ✅ Apply for job (file upload enabled)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please login to apply.");
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
      const res = await fetch("http://localhost:5000/api/apply", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) throw new Error(data.message || "Apply failed");

      alert("✅ Application submitted successfully!");
      navigate("/applications");
    } catch (err) {
      setLoading(false);
      console.error("Apply error:", err);
      alert("❌ Failed to submit application.");
    }
  };

  if (!job) return <p>Loading job...</p>;

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
          {loading ? "Applying..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
