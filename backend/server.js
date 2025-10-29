const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

const SECRET_KEY = "career_site_secret_key";

// ---------------- MySQL Connection ----------------
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Sathish@3804",
  database: "career_site",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL Connected Successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
})();

// ---------------- File Upload Setup ----------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadsDir));

// ---------------- Middleware ----------------
function authenticateToken(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1] || header;
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// ---------------- AUTH ----------------
app.post("/api/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role || "user"]
    );
    res.json({ message: "Signup successful! Please log in." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ message: "Email already exists!" });
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      name: user.name,
      role: user.role,
      id: user.id,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ---------------- JOBS ----------------

// ✅ Admin posts a job
app.post("/api/jobs", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Only admins can post jobs" });

  const { title, description, company, location } = req.body;

  try {
    await db.query(
      "INSERT INTO jobs (title, description, company, location, posted_by) VALUES (?, ?, ?, ?, ?)",
      [title, description, company, location, req.user.id]
    );
    res.status(201).json({ message: "Job posted successfully" });
  } catch (err) {
    console.error("Job Post Error:", err);
    res.status(500).json({ message: "Error posting job" });
  }
});

// ✅ Get all jobs (for logged-in users)
app.get("/api/jobs", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, u.name AS posted_by_name 
       FROM jobs j
       LEFT JOIN users u ON j.posted_by = u.id
       ORDER BY j.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Get Jobs Error:", err);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// ✅ Get single job
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Job not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Admin’s own jobs
app.get("/api/admin/jobs", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  try {
    const [rows] = await db.query("SELECT * FROM jobs WHERE posted_by = ?", [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error("Admin Jobs Error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ---------------- APPLICATIONS ----------------

// ✅ User applies for a job
app.post("/api/apply", authenticateToken, upload.single("resume"), async (req, res) => {
  try {
    const { job_id, first_name, last_name, email, phone, city, position } = req.body;
    const user_id = req.user.id;
    const resume = req.file ? req.file.filename : null;

    if (!job_id || !user_id)
      return res.status(400).json({ message: "Missing job_id or user_id" });

    await db.query(
      `INSERT INTO applications 
        (user_id, job_id, first_name, last_name, email, phone, city, position, resume, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [user_id, job_id, first_name, last_name, email, phone, city, position, resume]
    );

    res.json({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error("Error submitting application:", err);
    res.status(500).json({ message: "Server error while applying." });
  }
});

// ✅ User - View their applications
app.get("/api/applications", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, j.title AS job_title, a.status, 
              COALESCE(DATE_FORMAT(a.interview_date, '%Y-%m-%d'), 'Pending') AS interview_date
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Server error fetching applications" });
  }
});

// ✅ Admin - View only applications for their own jobs
app.get("/api/admin/applications", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.email,
        j.title AS job_title,
        a.status,
        COALESCE(DATE_FORMAT(a.interview_date, '%Y-%m-%d'), '') AS interview_date
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.posted_by = ?  -- ✅ Only jobs created by this admin
      ORDER BY a.id DESC
    `, [req.user.id]);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching admin applications:", err);
    res.status(500).json({ message: "Server error fetching applications" });
  }
});


// ✅ Admin - Update application status
app.put("/api/admin/applications/:id/status", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  const { id } = req.params;
  let { status } = req.body;

  if (!status) return res.status(400).json({ message: "Status is required" });
  status = status.trim();

  const allowed = ["Pending", "Accepted", "Rejected"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status value" });

  try {
    const [result] = await db.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Application not found" });

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Server error while updating status" });
  }
});

// ✅ Admin - Update interview date
app.put("/api/admin/applications/:id/interview-date", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  const { interview_date } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE applications SET interview_date = ? WHERE id = ?`,
      [interview_date, id]
    );
    res.json({ message: "Interview date updated successfully" });
  } catch (err) {
    console.error("Error updating interview date:", err);
    res.status(500).json({ message: "Server error while updating interview date." });
  }
});

// ---------------- Frontend Serve ----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// ---------------- Error Handler ----------------
app.use(/^\/api\//, (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// ---------------- Server Start ----------------
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
