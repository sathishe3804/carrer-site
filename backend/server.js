// Only load .env when running locally (not in Railway)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
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

const SECRET_KEY = "career_site_secret_key";

// ---------------- MySQL Connection ----------------
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
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

// ---------------- APPLICATIONS ----------------
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

// ---------------- Error Handler ----------------
app.use(/^\/api\//, (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// ---------------- Server Start ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
