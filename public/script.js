const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const formatSelect = document.getElementById("formatSelect");
const downloadLink = document.getElementById("downloadLink");
const previewImage = document.getElementById("previewImage");
const dropText = document.getElementById("dropText");

const loadingText = document.createElement("p");
loadingText.textContent = "⏳ Converting image, please wait...";
loadingText.style.display = "none";
loadingText.style.color = "#555";
loadingText.style.marginTop = "10px";
dropZone.appendChild(loadingText);

let selectedFile = null;

dropZone.addEventListener("click", () => imageInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  selectedFile = e.dataTransfer.files[0];
  handleConversion(selectedFile);
});

imageInput.addEventListener("change", () => {
  selectedFile = imageInput.files[0];
  handleConversion(selectedFile);
});

formatSelect.addEventListener("change", () => {
  if (selectedFile) handleConversion(selectedFile);
});

function handleConversion(file) {
  const format = formatSelect.value.split("/").pop(); // e.g., "jpg"

  // Show preview
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
    dropText.style.display = "none";
  };
  reader.readAsDataURL(file);

  // Show loading
  loadingText.style.display = "block";
  downloadLink.style.display = "none";

  const formData = new FormData();
  formData.append("image", file);

  const apiUrl = "https://image-converter-api-8pkv.onrender.com"; // your actual Render backend URL

  fetch(`${apiUrl}/convert?format=${format}`, {
    method: "POST",
    body: formData
  })
    .then((res) => {
      if (!res.ok) throw new Error("Conversion failed");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = `converted.${format}`;
      downloadLink.style.display = "inline-block";
    })
    .catch((err) => {
      console.error(err);
      alert("⚠️ Conversion failed. Please try another file or format.");
    })
    .finally(() => {
      loadingText.style.display = "none";
    });
}
