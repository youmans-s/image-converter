const apiUrl = "https://image-converter-api-8pkv.onrender.com";
const zone = document.getElementById("dropZone");
const fileInput = document.getElementById("file");
const out = document.getElementById("out");
const dropText = document.getElementById("dropText");

["dragover","dragleave","drop"].forEach(evt=>{
  zone.addEventListener(evt,(e)=>{ e.preventDefault(); zone.classList.toggle("dragover", evt==="dragover");});
});
zone.addEventListener("click", ()=> fileInput.click());
zone.addEventListener("drop", (e)=> handle(e.dataTransfer.files[0]));
fileInput.addEventListener("change", ()=> handle(fileInput.files[0]));

async function handle(file){
  if(!file) return;
  if(!/\.heic$/i.test(file.name) && !(file.type||"").includes("heic")){
    alert("Please choose a .heic image."); return;
  }
  dropText.style.display="none";
  const card = document.createElement("div");
  card.className="card"; card.innerHTML = `<h3>${file.name}</h3><div class="meta">Converting… (waking server if idle)</div>`;
  out.innerHTML=""; out.appendChild(card);

  try{
    const fd = new FormData(); fd.append("image", file);
    const res = await fetch(`${apiUrl}/convert?format=jpeg`, { method:"POST", body:fd });
    if(!res.ok) throw new Error("Conversion failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const outName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    card.innerHTML = `
      <h3>${file.name} → ${outName}</h3>
      <img class="preview" loading="lazy" src="${url}" alt="Preview"/>
      <div class="meta">${Math.round(blob.size/1024)} KB</div>
      <p><a download="${outName}" href="${url}">Download JPG</a></p>
    `;
    gtag?.("event","conversion_done",{feature:"heic_to_jpg"});
  }catch(err){
    card.querySelector(".meta").textContent = "Error: " + (err?.message||err);
  }
}