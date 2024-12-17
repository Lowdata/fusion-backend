const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON body

// MongoDB Connection String
const mongoURI =
  "mongodb+srv://ayush:k6qjbAkiTRu4yYWK@cluster0.3gorv.mongodb.net/pre-registration?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("[INFO] Connected to MongoDB"))
  .catch((err) => console.error("[ERROR] Failed to connect to MongoDB:", err));

// Define a Mongoose Schema and Model for Emails
const EmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation regex
    },
  },
  { timestamps: true }
);

const EmailModel = mongoose.model("emails", EmailSchema); // Collection name: 'emails'

// POST Endpoint to Save Email to MongoDB
app.post("/pre-register", async (req, res) => {
  console.log("[INFO] Received request to /pre-register");
  console.log("[INFO] Request body:", req.body);

  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      console.warn("[WARN] Email is missing in the request body");
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("[INFO] Email to save:", email);
    const newEmail = new EmailModel({ email });

    // Save the email to MongoDB
    const savedEmail = await newEmail.save();
    console.log("[INFO] Email saved successfully:", savedEmail);

    res
      .status(201)
      .json({ message: "Email saved successfully", data: savedEmail });
  } catch (error) {
    console.error("[ERROR] Error occurred while saving email:", error);

    if (error.code === 11000) {
      console.warn("[WARN] Duplicate email detected:", error.keyValue);
      res.status(400).json({ message: "Email already exists", error });
    } else {
      res.status(500).json({ message: "Error saving email", error });
    }
  }
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("[ERROR] Uncaught error:", err);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[INFO] Server is running on port ${PORT}`);
});
