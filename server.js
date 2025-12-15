/**
 * PDF Parser Microservice
 * Accepts raw PDF bytes and returns parsed JSON
 */

const express = require("express");
const bodyParser = require("body-parser");
const { parsePDFBuffer } = require("./parser");

const app = express();

/**
 * Accept raw PDF data sent with:
 * Content-Type: application/pdf
 */
app.use(
  bodyParser.raw({
    type: "application/pdf",
    limit: "5mb"
  })
);

/**
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.send("PDF Parser Service is running");
});

/**
 * Main PDF parsing endpoint
 */
app.post("/parse", async (req, res) => {
  try {
    // Validate PDF body
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({
        error: "No PDF received"
      });
    }

    // PDF data as Buffer
    const pdfBuffer = req.body;

    // Parse PDF
    const result = await parsePDFBuffer(pdfBuffer);

    // Send parsed JSON
    res.json(result);

  } catch (error) {
    console.error("PARSER ERROR:", error.message);
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * Start server
 * Render provides PORT via environment variable
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`PDF Parser running on port ${PORT}`);
});
