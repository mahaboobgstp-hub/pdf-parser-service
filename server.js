const express = require("express");
const multer = require("multer");
const fs = require("fs");
const parsePDF = require("./parser");

const app = express();

// Multer config: store uploaded PDFs temporarily
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Health check (optional but useful)
app.get("/", (req, res) => {
  res.send("PDF Parser Service is running");
});

// Main PDF parsing endpoint
app.post("/parse", upload.single("statement"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const filePath = req.file.path;

    const result = await parsePDF(filePath);

    // Delete PDF after parsing
    fs.unlinkSync(filePath);

    res.json(result);
  } catch (err) {
    console.error("PARSER ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF Parser running on port ${PORT}`);
});
