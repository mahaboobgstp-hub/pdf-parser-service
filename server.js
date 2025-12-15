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
    type: "*/*",
    limit: "5mb"
  })
);

app.get("/parse", (req, res) => {
  res.send("PARSE ROUTE EXISTS");
});
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
    console.log(
      "RENDER /parse HIT | content-type:",
      req.headers["content-type"],
      "| bytes:",
      req.body ? req.body.length : "NO BODY"
    );

    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: "No PDF received" });
    }

    const buffer = req.body;
    const result = await parsePDFBuffer(buffer);

    res.json(result);
  } catch (err) {
    console.error("PARSER ERROR:", err);
    res.status(400).json({ error: err.message });
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
