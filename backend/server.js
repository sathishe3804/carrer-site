const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 2000;
const JWT_SECRET = "mysecretkey";

// ================= JWT AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sathish@3804",
  database: "career_site",
});

db.connect((err) => {
  if (err) console.log(err);
  else console.log("✅ MySQL Connected!");
});

// Sanitizer
function sanitize(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ================= JOB ROUTES =================

// Get all jobs
app.get("/api/jobs", (req, res) => {
  db.query("SELECT * FROM jobs", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Get job by id
app.get("/api/jobs/:id", (req, res) => {
  const jobId = parseInt(req.params.id);
  db.query("SELECT * FROM jobs WHERE id = ?", [jobId], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0)
      res.status(404).json({ error: "Job not found" });
    else res.json(results[0]);
  });
});

// ================= APPLY ROUTE =================
app.post("/api/apply", authenticateToken, (req, res) => {
  const {
    jobId,
    firstName,
    lastName,
    email,
    phone,
    gender,
    city,
    position,
    startDate,
    interviewDate,
    interviewSlot,
    resume,
  } = req.body;

  const userId = req.user?.id;

  if (!jobId) {
    return res.status(400).json({ success: false, message: "Job ID required" });
  }

  const query = `
    INSERT INTO applications 
    (job_id, user_id, first_name, last_name, email, phone, gender, city, position, start_date, interview_date, interview_slot, resume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    jobId,
    userId,
    sanitize(firstName),
    sanitize(lastName),
    sanitize(email),
    sanitize(phone),
    sanitize(gender),
    sanitize(city),
    sanitize(position),
    startDate || null,
    interviewDate || null,
    sanitize(interviewSlot),
    sanitize(resume),
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("❌ DB Insert Error:", err);
      return res.status(400).json({ success: false, message: "Something went wrong" });
    }
    res.json({ success: true, message: "Application submitted successfully!" });
  });
});

// ================= APPLICATIONS ROUTE =================
app.get("/api/applications", authenticateToken, (req, res) => {
  const query = `
    SELECT a.*, j.title AS job_title 
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.user_id = ?
    ORDER BY a.id DESC
  `;
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error("❌ Fetch Applications Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ================= AUTH ROUTES =================

// Signup
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  db.query(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, password_hash],
    (err, result) => {
      if (err) {
        console.error("SQL Error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already registered" });
        }
        return res.status(500).json({ message: "Error registering user" });
      }
      res.json({ message: "User registered successfully!" });
    }
  );
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Error logging in" });
    if (results.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
  message: "Login successful",
  token,
  user: { id: user.id, name: user.name, email: user.email, role: user.role }
});

  });
});

// ================= START SERVER =================
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
