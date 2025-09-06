const apiUrl = "https://image-converter-api-8pkv.onrender.com";
const els = {
  zone: document.getElementById("dropZone"),
  file: document.getElementById("file"),
  w: document.getElementById("w"),
  h: document.getElementById("h"),
  fmt: document.getElementById("fmt"),
  out: document.getElementById("out"),
  dropText: document.getElementById("dropText"),
  doResize: document.getElementById("doResize"),
};
let chosenFile = null;

["dragover","dragleave","drop"].forEach(evt=>{
  els.zone.addEventListener(evt,(e)=>{ e.preventDefault(); els.zone.classList.toggle("dragover", evt==="dragover");});
});
els.zone.addEventListener("click", ()=> els.file.click());
els.zone.addEventListener("drop", (e)=> { chosenFile = e.dataTransfer.files[0]; showPicked(); });
els.file.addEventListener("change", ()=> { chosenFile = els.file.files[0]; showPicked(); });
els.doResize.addEventListener("click", ()=> chosenFile && process(chosenFile));

function showPicked(){ els.dropText.style.display="none"; }

function needsServer(file){
  const t = (file.type||"").toLowerCase();
  const n = (file.name||"").toLowerCase();
  return /heic|heif|tiff|tif/.test(t) || /\.(heic|heif|tiff|tif)$/.test(n);
}

async function process(file){
  const width = parseInt(els.w.value,10) || 0;
  const height = parseInt(els.h.value,10) || 0;
  const choice = els.fmt.value;
  let outMime = choice==="same" ? (file.type || "image/jpeg") : choice;

  const card = document.createElement("div");
  card.className = "card"; card.innerHTML = `<h3>${file.name}</h3><div class="meta">Resizing…</div>`;
  els.out.innerHTML = ""; els.out.appendChild(card);

  try{
    let blob;
    if(needsServer(file)){
      // Server fallback to JPEG (keeps code simple)
      const fd = new FormData(); fd.append("image", file);
      const res = await fetch(`${apiUrl}/convert?format=jpeg`, { method:"POST", body:fd });
      if(!res.ok) throw new Error("Server conversion failed");
      const jpegBlob = await res.blob();
      // resize client-side from the returned JPEG
      blob = await resizeClient(jpegBlob, "image/jpeg", width, height);
      outMime = "image/jpeg";
    }else{
      blob = await resizeClient(file, outMime, width, height);
    }
    const url = URL.createObjectURL(blob);
    const outName = file.name.replace(/\.[^.]+$/, "") + "." + ext(outMime);
    card.innerHTML = `
      <h3>${file.name} → ${outName}</h3>
      <img class="preview" loading="lazy" src="${url}" alt="Preview"/>
      <div class="meta">${Math.round(blob.size/1024)} KB</div>
      <p><a download="${outName}" href="${url}">Download</a></p>
    `;
    gtag?.("event","conversion_done",{feature:"resize",format:ext(outMime)});
  }catch(err){
    card.querySelector(".meta").textContent = "Error: " + (err?.message||err);
  }
}

async function resizeClient(fileOrBlob, outMime, w, h){
  const dataUrl = await blobToDataURL(fileOrBlob);
  const img = await loadImg(dataUrl);
  let W = img.width, H = img.height;
  if(w && !h){ H = Math.round((img.height / img.width) * w); W = w; }
  else if(!w && h){ W = Math.round((img.width / img.height) * h); H = h; }
  else if(w && h){ W = w; H = h; } // caller can force exact dims
  const canvas = document.createElement("canvas"); canvas.width=W; canvas.height=H;
  const ctx = canvas.getContext("2d"); ctx.drawImage(img,0,0,W,H);
  const blob = await new Promise(res=> canvas.toBlob(res, outMime, outMime==="image/png" ? undefined : 0.9));
  if(!blob) throw new Error("Canvas export failed");
  return blob;
}
function blobToDataURL(b){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b); }); }
function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
function ext(mime){ return ({ "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp" }[mime]) || "jpg"; }
