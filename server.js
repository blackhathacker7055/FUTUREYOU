// -----------------------------
// FutureYou Backend (Single File)
// -----------------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// -----------------------------
// CONFIG
// -----------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Change these:
const MONGO_URI = "mongodb://localhost:27017/futureyou";
const JWT_SECRET = "your_jwt_secret_key";
const PORT = 5000;

// -----------------------------
// DATABASE CONNECTION
// -----------------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// -----------------------------
// MODELS
// -----------------------------

// User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
  })
);

// Goal model
const Goal = mongoose.model(
  "Goal",
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      title: String,
      description: String,
      deadline: Date,
      status: {
        type: String,
        enum: ["Active", "In Progress", "Completed"],
        default: "Active",
      },
    },
    { timestamps: true }
  )
);

// -----------------------------
// AUTH MIDDLEWARE
// -----------------------------
function auth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch {
    res.status(400).json({ msg: "Invalid token" });
  }
}

// -----------------------------
// AUTH ROUTES
// -----------------------------

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  let exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ msg: "User already exists" });

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, password: hash });

  const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET);

  res.json({ token, user });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  let match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Incorrect password" });

  const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET);

  res.json({ token, user });
});

// -----------------------------
// GOAL ROUTES
// -----------------------------

// Create goal
app.post("/api/goals", auth, async (req, res) => {
  const goal = await Goal.create({
    userId: req.user.id,
    ...req.body,
  });
  res.json(goal);
});

// Get goals
app.get("/api/goals", auth, async (req, res) => {
  const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(goals);
});

// Update goal
app.put("/api/goals/:id", auth, async (req, res) => {
  const updated = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete goal
app.delete("/api/goals/:id", auth, async (req, res) => {
  await Goal.findByIdAndDelete(req.params.id);
  res.json({ msg: "Goal deleted" });
});

// -----------------------------
// DASHBOARD STATS
// -----------------------------
app.get("/api/goals/stats", auth, async (req, res) => {
  const userId = req.user.id;

  const active = await Goal.countDocuments({ userId, status: "Active" });
  const completed = await Goal.countDocuments({ userId, status: "Completed" });
  const pending = await Goal.countDocuments({ userId, status: "In Progress" });

  res.json({ active, completed, pending });
});

// -----------------------------
// ROOT
// -----------------------------
app.get("/", (req, res) => {
  res.send("FutureYou backend running...");
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
