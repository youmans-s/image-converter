const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.static("public")); // your frontend lives here

app.post("/convert", upload.single("image"), async (req, res) => {
  const targetFormat = req.query.format; // jpg, png, webp, avif, tiff, etc.
  const inputPath = req.file.path;
  const outputFilename = `converted-${Date.now()}.${targetFormat}`;
  const outputPath = path.join("output", outputFilename);

  try {
    await sharp(inputPath)
      .toFormat(targetFormat)
      .toFile(outputPath);

    res.download(outputPath, outputFilename, () => {
      fs.unlinkSync(inputPath); // delete temp input
      fs.unlinkSync(outputPath); // delete temp output
    });
  } catch (err) {
    console.error("Error during conversion:", err);
    res.status(500).send("Conversion failed.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
