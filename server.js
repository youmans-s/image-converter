const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Setup Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Static files (optional)
app.use(express.static("public"));

// POST /convert?format=jpg|png|webp|avif|tiff
app.post("/convert", upload.single("image"), async (req, res) => {
  const targetFormat = req.query.format;
  const inputPath = req.file.path;
  const outputFilename = `converted-${Date.now()}.${targetFormat}`;
  const outputPath = path.join("output", outputFilename);

  try {
    await sharp(inputPath)
      .toFormat(targetFormat)
      .toFile(outputPath);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Disposition", `attachment; filename="${outputFilename}"`);
      res.sendFile(path.resolve(outputPath), () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).send("Conversion failed.");
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
