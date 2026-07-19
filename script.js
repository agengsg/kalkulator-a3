const AREAS = {
  a3plus: { w: 31, h: 47 },
  kiscut: { w: 30, h: 46 },
};

// ================= DARK MODE =================
const body = document.body;

document.querySelector(".nav-toggle")?.addEventListener("click", () => {
  body.classList.toggle("dark");
});

// ================= NUMBER PARSING (terima "," atau ".") =================
function parseNum(value) {
  if (typeof value !== "string") return NaN;

  // ganti koma jadi titik supaya bisa dibaca parseFloat
  const normalized = value.trim().replace(",", ".");

  return parseFloat(normalized);
}

// ================= HELPER =================
function maxItems(areaDim, objDim, spacing) {
  if (spacing === 0) return Math.floor(areaDim / objDim);

  const effectiveCell = objDim + spacing;
  return Math.floor((areaDim + spacing) / effectiveCell);
}

function gridPlacements(
  areaW,
  areaH,
  cellW,
  cellH,
  spacing,
  rotated,
  cols,
  rows
) {
  const arr = [];

  const stepX = cellW + spacing;
  const stepY = cellH + spacing;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      arr.push({
        x: c * stepX,
        y: r * stepY,
        w: cellW,
        h: cellH,
        rotated,
      });
    }
  }

  return arr;
}

// ================= OPTIMAL FIT =================
function maxFitDetailed(areaW, areaH, objW, objH, spacing) {
  let best = {
    total: 0,
    placements: [],
    method: "none",
  };

  // ===== PURE NORMAL =====
  const normalCols = maxItems(areaW, objW, spacing);
  const normalRows = maxItems(areaH, objH, spacing);

  const normalTotal = normalCols * normalRows;

  if (normalTotal > best.total) {
    best = {
      total: normalTotal,
      placements: gridPlacements(
        areaW,
        areaH,
        objW,
        objH,
        spacing,
        false,
        normalCols,
        normalRows
      ),
      method: "pure_normal",
    };
  }

  // ===== PURE ROTATED =====
  const rotCols = maxItems(areaW, objH, spacing);
  const rotRows = maxItems(areaH, objW, spacing);

  const rotTotal = rotCols * rotRows;

  if (rotTotal > best.total) {
    best = {
      total: rotTotal,
      placements: gridPlacements(
        areaW,
        areaH,
        objH,
        objW,
        spacing,
        true,
        rotCols,
        rotRows
      ),
      method: "pure_rotated",
    };
  }

  // ===== MIX COLUMNS =====
  const maxA = maxItems(areaW, objW, spacing);

  for (let a = 0; a <= maxA; a++) {
    const normalWidth = a > 0 ? a * objW + (a - 1) * spacing : 0;

    const remW = areaW - normalWidth;

    const b = maxItems(remW, objH, spacing);

    const normalRowsHere = maxItems(areaH, objH, spacing);
    const rotRowsHere = maxItems(areaH, objW, spacing);

    const count = a * normalRowsHere + b * rotRowsHere;

    if (count > best.total) {
      const placements = [];

      // normal kiri
      for (let c = 0; c < a; c++) {
        for (let r = 0; r < normalRowsHere; r++) {
          placements.push({
            x: c * (objW + spacing),
            y: r * (objH + spacing),
            w: objW,
            h: objH,
            rotated: false,
          });
        }
      }

      // rotated kanan
      const startX = normalWidth;

      for (let c = 0; c < b; c++) {
        for (let r = 0; r < rotRowsHere; r++) {
          placements.push({
            x: startX + c * (objH + spacing),
            y: r * (objW + spacing),
            w: objH,
            h: objW,
            rotated: true,
          });
        }
      }

      best = {
        total: count,
        placements,
        method: "mix_columns",
      };
    }
  }

  return best;
}

// ================= DRAW PREVIEW =================
function drawPreview(previewId, area, placements, maxWidthPx) {
  const preview = document.getElementById(previewId);

  if (!preview) return;

  preview.innerHTML = "";

  const scale = maxWidthPx / area.w;

  preview.style.width = area.w * scale + "px";
  preview.style.height = area.h * scale + "px";

  let maxX = 0;
  let maxY = 0;

  placements.forEach((p) => {
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.h);
  });

  const offsetX = (area.w - maxX) / 2;
  const offsetY = (area.h - maxY) / 2;

  placements.forEach((p) => {
    const d = document.createElement("div");

    d.className = "rect";

    if (p.rotated) {
      d.classList.add("rot");
    }

    d.style.left = (p.x + offsetX) * scale + "px";
    d.style.top = (p.y + offsetY) * scale + "px";
    d.style.width = p.w * scale + "px";
    d.style.height = p.h * scale + "px";

    preview.appendChild(d);
  });
}

// ================= TEMPLATE =================
function renderMode(title, data, area) {
  const id = `preview-${title.toLowerCase()}`;

  return `
    <div class="result-card">
      <div class="title-result">
        <p>${title}</p>

        <p>
          ${data.total} pcs
          (${area.w} × ${area.h} cm)
        </p>
      </div>

      <div class="preview-box">
        <div id="${id}" class="preview"></div>
      </div>
    </div>
  `;
}

// ================= MAIN =================
function calculate() {
  const w = parseNum(document.getElementById("w").value);
  const h = parseNum(document.getElementById("h").value);

  const areaKey = document.getElementById("area").value;

  const spacing = parseNum(document.getElementById("spacing").value) || 0;

  if (!w || !h || w <= 0 || h <= 0) {
    document.getElementById("results").innerHTML =
      '<p class="empty-state">Masukkan ukuran objek yang valid untuk melihat hasil.</p>';
    return;
  }

  const area = AREAS[areaKey];

  // ================= PORTRAIT =================
  const portraitCols = maxItems(area.w, w, spacing);
  const portraitRows = maxItems(area.h, h, spacing);

  const portrait = {
    total: portraitCols * portraitRows,

    placements: gridPlacements(
      area.w,
      area.h,
      w,
      h,
      spacing,
      false,
      portraitCols,
      portraitRows
    ),
  };

  // ================= LANDSCAPE =================
  const rotW = h;
  const rotH = w;

  const landscapeCols = maxItems(area.w, rotW, spacing);
  const landscapeRows = maxItems(area.h, rotH, spacing);

  const landscape = {
    total: landscapeCols * landscapeRows,

    placements: gridPlacements(
      area.w,
      area.h,
      rotW,
      rotH,
      spacing,
      true,
      landscapeCols,
      landscapeRows
    ),
  };

  // ================= OPTIMAL =================
  const optimal = maxFitDetailed(area.w, area.h, w, h, spacing);

  // ================= RENDER HTML =================
  document.getElementById("results").innerHTML = `
    ${renderMode("Portrait", portrait, area)}
    ${renderMode("Landscape", landscape, area)}
    ${renderMode("Optimal", optimal, area)}
  `;

  // ================= DRAW =================
  // Ukur lebar kartu sesungguhnya (setelah dirender) supaya preview
  // selalu pas dengan lebar kolom grid, tidak pernah mendorong layout keluar.
  const previewMaxWidth = getPreviewMaxWidth();

  drawPreview("preview-portrait", area, portrait.placements, previewMaxWidth);

  drawPreview("preview-landscape", area, landscape.placements, previewMaxWidth);

  drawPreview("preview-optimal", area, optimal.placements, previewMaxWidth);
}

function getPreviewMaxWidth() {
  const sampleBox = document.querySelector(".preview-box");

  if (!sampleBox) return 240;

  const boxWidth = sampleBox.getBoundingClientRect().width;

  return boxWidth > 0 ? boxWidth : 240;
}

// ================= AUTO REFRESH =================
document.getElementById("area").addEventListener("change", calculate);

// ================= BATASI INPUT (angka, "," atau ".") + HITUNG =================
["w", "h", "spacing"].forEach((id) => {
  const el = document.getElementById(id);

  if (!el) return;

  el.addEventListener("input", () => {
    let val = el.value;

    // buang semua karakter selain angka, koma, titik
    val = val.replace(/[^0-9.,]/g, "");

    // cuma boleh 1 tanda desimal (koma atau titik), sisanya dibuang
    const firstSepMatch = val.match(/[.,]/);

    if (firstSepMatch) {
      const sepIndex = firstSepMatch.index;

      val =
        val.slice(0, sepIndex + 1) +
        val.slice(sepIndex + 1).replace(/[.,]/g, "");
    }

    if (val !== el.value) {
      el.value = val;
    }

    // hitung pakai value yang sudah difilter, bukan value mentah
    calculate();
  });

  el.addEventListener("change", calculate);
});

// ================= RESIZE =================
let resizeTimer = null;
let lastPreviewWidth = getPreviewMaxWidth();

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    // Di HP, address bar yang nongol/ilang pas scroll juga memicu event
    // "resize" (cuma tinggi viewport yang berubah, lebar tetap sama).
    // Kalau kita calculate() ulang tiap saat itu, section hasil jadi
    // ke-render ulang terus dan keliatan seperti "refresh sendiri".
    // Makanya cuma recalculate kalau lebar kolom preview beneran berubah.
    const currentWidth = getPreviewMaxWidth();

    if (currentWidth !== lastPreviewWidth) {
      lastPreviewWidth = currentWidth;
      calculate();
    }
  }, 120);
});

// ================= INITIAL =================
calculate();
