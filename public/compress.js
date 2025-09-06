const apiUrl = "https://image-converter-api-8pkv.onrender.com"; // your Render backend
const els = {
  zone: document.getElementById("dropZone"),
  files: document.getElementById("files"),
  out: document.getElementById("outFormat"),
  q: document.getElementById("quality"),
  qv: document.getElementById("qv"),
  maxW: document.getElementById("maxW"),
  maxH: document.getElementById("maxH"),
  list: document.getElementById("list"),
  dropText: document.getElementById("dropText"),
};

els.zone.addEventListener("click", ()=> els.files.click());
["dragover","dragleave","drop"].forEach(evt=>{
  els.zone.addEventListener(evt,(e)=>{ e.preventDefault(); els.zone.classList.toggle("dragover", evt==="dragover");});
});
els.zone.addEventListener("drop",(e)=> handle(Array.from(e.dataTransfer.files)));
els.files.addEventListener("change",()=> handle(Array.from(els.files.files)));
els.q.addEventListener("input",()=> els.qv.textContent = `(${els.q.value})`);

function needsServer(file){
  const t = (file.type||"").toLowerCase();
  const n = (file.name||"").toLowerCase();
  return /heic|heif|tiff|tif/.test(t) || /\.(heic|heif|tiff|tif)$/.test(n);
}

async function handle(files){
  if(!files.length) return;
  els.dropText.style.display = "none";
  for(const file of files){
    const row = document.createElement("div");
    row.className = "card";
    row.innerHTML = `<h3>${file.name}</h3><div class="meta">Processing…</div>`;
    els.list.prepend(row);
    try{
      const outMime = chooseMime(file, els.out.value);
      const quality = Number(els.q.value)/100;
      const maxW = parseInt(els.maxW.value,10) || 0;
      const maxH = parseInt(els.maxH.value,10) || 0;

      let blob;
      if(needsServer(file)){
        // Fallback: convert to JPEG via backend (quality/dim params are backend-dependent; keeping it simple)
        const fd = new FormData(); fd.append("image", file);
        const res = await fetch(`${apiUrl}/convert?format=jpeg`, { method:"POST", body:fd });
        if(!res.ok) throw new Error("Server conversion failed");
        blob = await res.blob();
      } else {
        blob = await compressClient(file, outMime, quality, maxW, maxH);
      }
      const url = URL.createObjectURL(blob);
      const outName = file.name.replace(/\.[^.]+$/, "") + "." + ext(outMime);
      row.innerHTML = `
        <h3>${file.name} → ${outName}</h3>
        <img class="preview" src="${url}" alt="Preview"/>
        <div class="meta">${Math.round(blob.size/1024)} KB</div>
        <p><a download="${outName}" href="${url}">Download</a></p>
      `;
      gtag?.("event","conversion_done",{feature:"compress",format:ext(outMime)});
    }catch(err){
      row.querySelector(".meta").textContent = "Error: " + (err?.message||err);
    }
  }
}

function chooseMime(file, choice){
  if(choice!=="auto") return choice;
  const t = (file.type||"").toLowerCase();
  if(t.includes("png")) return "image/webp"; // big reduction
  if(t.includes("jpeg")||t.includes("jpg")) return "image/jpeg";
  if(t.includes("webp")) return "image/webp";
  return "image/jpeg";
}
function ext(mime){ return ({ "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp"}[mime]) || "jpg"; }

async function compressClient(file, outMime, q, maxW, maxH){
  const dataUrl = await fileToDataURL(file);
  const img = await loadImg(dataUrl);
  const size = getTargetSize(img.width, img.height, maxW, maxH);
  const canvas = document.createElement("canvas");
  canvas.width = size.w; canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size.w, size.h);
  const blob = await new Promise(res=> canvas.toBlob(res, outMime, outMime==="image/png" ? undefined : q));
  if(!blob) throw new Error("Canvas export failed");
  return blob;
}
function getTargetSize(w,h,maxW,maxH){
  if(!maxW && !maxH) return {w,h};
  if(maxW && !maxH){ const r = Math.min(1, maxW/w); return { w:Math.round(w*r), h:Math.round(h*r) }; }
  if(!maxW && maxH){ const r = Math.min(1, maxH/h); return { w:Math.round(w*r), h:Math.round(h*r) }; }
  const r = Math.min(1, maxW/w, maxH/h); return { w:Math.round(w*r), h:Math.round(h*r) };
}
function fileToDataURL(file){
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}
function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
