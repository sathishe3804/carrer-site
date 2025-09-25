const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 2000;



// Secret key (later move to .env file)
const JWT_SECRET = "mysecretkey";

// http://localhost:2000/api/signup
// ================= JWT AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
  // Get token from headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect: "Bearer <token>"

  if (!token) return res.status(401).json({ message: "Access denied" });

  // Verify token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user; // Save token payload (id, role) in request
    next(); // continue to route
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
  password: "Sathish@3804", // your password
  database: "career_site"
});

db.connect(err => {
  if (err) console.log(err);
  else console.log("✅ MySQL Connected!");
});

// Simple sanitizer
function sanitize(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;")
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
    if (results.length === 0) res.status(404).json({ error: "Job not found" });
    else res.json(results[0]);
  });
});

// Apply for a job
app.post("/api/apply", authenticateToken, (req, res) => {
  const { firstName, lastName, email, phone, gender, city, position, startDate, interviewDate, interviewSlot, resume } = req.body;

  const query = `
    INSERT INTO applications 
    (first_name, last_name, email, phone, gender, city, position, start_date, interview_date, interview_slot, resume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    sanitize(firstName),
    sanitize(lastName),
    sanitize(email),
    sanitize(phone),
    sanitize(gender),
    sanitize(city),
    sanitize(position),
    startDate || null,
    interviewDate || null,
    interviewSlot || null,
    sanitize(resume)
  ];

  db.execute(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Application submitted successfully!" });
  });
});

// ================= AUTH ROUTES =================

// Signup
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
        console.error("SQL Error:", err); // Debug
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

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Error logging in" });
    if (results.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  });
});

// ================= START SERVER =================
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
