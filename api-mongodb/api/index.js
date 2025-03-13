const express = require("express");
const Redis = require("ioredis");
const mongoose = require("mongoose");
const compression = require("compression");

const app = express();

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => {
  console.log("Connected to Redis");
});

// Enable trust proxy for rate limiting
// app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(compression());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB Schema
const urlSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["safe", "malicious", "unknown"],
    default: "unknown",
  },
  lastChecked: { type: Date, default: Date.now },
});
const Url = mongoose.model("Url", urlSchema);

/**
 * @route GET /status
 * @description Checks if the server is running.
 * @returns {Object} JSON response with server status
 * @example
 * // Response
 * { "status": "ok" }
 */
app.get("/status", (req, res) => res.json({ status: "ok" }));

/**
 * @route POST /check-url
 * @description Checks the safety status of a URL. Uses Redis cache first, falls back to MongoDB if not cached.
 *              Does not update the `lastChecked` field in the database.
 * @param {Object} req.body - Request body
 * @param {string} req.body.url - The URL to check
 * @returns {Object} JSON response with the URL's status
 * @throws {400} If URL is missing in the request body
 * @example
 * // Request
 * POST /check-url
 * { "url": "https://example.com" }
 *
 * // Response (cached)
 * { "status": "malicious" }
 *
 * // Response (not in DB)
 * { "status": "unknown" }
 */
app.post("/check-url", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Check Redis cache
  const cachedStatus = await redis.get(url);
  if (cachedStatus) {
    return res.json({ status: cachedStatus });
  }

  // Fallback to MongoDB (read-only, no update)
  const dbResult = await Url.findOne({ url }).lean();
  const status = dbResult ? dbResult.status : "unknown";

  // Cache in Redis (1-hour TTL)
  await redis.set(url, status, "EX", 3600);
  res.json({ status });
});

/**
 * @route POST /add-url
 * @description Adds or updates a URL's status in MongoDB and Redis. Updates the `lastChecked` field.
 * @param {Object} req.body - Request body
 * @param {string} req.body.url - The URL to add or update
 * @param {string} req.body.status - The safety status ("safe", "malicious", or "unknown")
 * @returns {Object} JSON response with the updated status
 * @throws {400} If URL or status is invalid
 * @example
 * // Request
 * POST /add-url
 * { "url": "https://example.com", "status": "malicious" }
 *
 * // Response
 * { "status": "malicious" }
 */
app.post("/add-url", async (req, res) => {
  const { url, status } = req.body;

  if (!url || !["safe", "malicious", "unknown"].includes(status)) {
    return res.status(400).json({ error: "Invalid URL or status" });
  }

  // Update MongoDB (upsert with lastChecked)
  const updated = await Url.findOneAndUpdate(
    { url },
    { status, lastChecked: new Date() },
    { upsert: true, new: true, lean: true }
  );

  // Update Redis cache
  await redis.set(url, updated.status, "EX", 3600);
  res.json({ status: updated.status });
});

/**
 * @route GET /urls
 * @description Retrieves all URLs stored in MongoDB.
 * @returns {Array} JSON array of URL objects
 * @example
 * // Response
 * [
 *   { "_id": "...", "url": "https://example.com", "status": "malicious", "lastChecked": "2025-03-12T..." },
 *   { "_id": "...", "url": "https://safe-site.com", "status": "safe", "lastChecked": "2025-03-12T..." }
 * ]
 */
app.get("/urls", async (req, res) => {
  const urls = await Url.find().lean();
  res.json(urls);
});

// Start server
app.listen(3000, () => console.log(`Server running on port ${3000}`));

// Hosting
module.exports = app;
