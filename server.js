const express = require("express");
const cors = require("cors"); // <--- already here
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ Move this to very top (before anything else)

// Create output directory if missing
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// File upload middleware
const upload = multer({ dest: "uploads/" });

// Optional: serve static files
app.use(express.static("public"));

// Main route
app.post("/convert", upload.single("image"), async (req, res) => {
  const targetFormat = req.query.format;
  const inputPath = req.file.path;
  const outputFilename = `converted-${Date.now()}.${targetFormat}`;
  const outputPath = path.join("output", outputFilename);

  try {
    await sharp(inputPath).toFormat(targetFormat).toFile(outputPath);
    res.download(outputPath, outputFilename, () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).send("Conversion failed.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
