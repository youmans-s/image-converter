const apiUrl = "https://image-converter-api.onrender.com"; // ← your live Render link

fetch(`${apiUrl}/convert?format=${format}`, {
  method: "POST",
  body: formData
})
  .then((res) => res.blob())
  .then((blob) => {
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `converted.${format}`;
    downloadLink.style.display = "inline-block";
  });
