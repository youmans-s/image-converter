document.getElementById("convertBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("imageInput");
  const format = document.getElementById("formatSelect").value;

  if (fileInput.files.length === 0) {
    alert("Please upload an image");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById("downloadLink");
        downloadLink.href = url;
        downloadLink.download = `converted.${format.split("/")[1]}`;
        downloadLink.style.display = "block";
      }, format, 0.92);
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

