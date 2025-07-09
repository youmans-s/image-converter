const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const formatSelect = document.getElementById("formatSelect");
const downloadLink = document.getElementById("downloadLink");
const previewImage = document.getElementById("previewImage");
const dropText = document.getElementById("dropText");

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
  const format = formatSelect.value.split("/").pop(); // e.g. 'jpeg' or 'avif'

  const reader = new FileReader();
  reader.onload = function (e) {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
    dropText.style.display = "none";
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append("image", file);

  fetch(`/convert?format=${format}`, {
    method: "POST",
    body: formData
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = `converted.${format}`;
      downloadLink.style.display = "inline-block";
    })
    .catch((err) => {
      alert("Conversion failed.");
      console.error(err);
    });
}
