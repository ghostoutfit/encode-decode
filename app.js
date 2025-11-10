console.log("app.js loaded");

import { ascii7BitsForText } from "./ascii.js";

let noiseInterval = null;


// map bit → physical level
function bitToLevel(b) {
  return b === "1" ? "8.0" : "2.0";
}

// clamp helper
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// apply noise U[-Δ, +Δ]
function addNoise(levelString, amp) {
  if (!levelString.trim()) return "";

  // split into lines first
  const lines = levelString.trim().split(/\n+/);

  return lines.map(line => {
    const nums = line.trim().split(/\s+/).map(parseFloat);
    const noisy = nums.map(x => {
      const jitter = (Math.random() * 2 - 1) * amp;   // U[-amp, +amp]
      const y = clamp(x + jitter, 0.0, 9.9);
      return y.toFixed(1);
    });
    return noisy.join(" ");
  }).join("\n");   // <-- put the newline back
}

function parseLevels(s) {
  if (!s || !s.trim()) return [];
  return s.trim().split(/\s+/).map(Number).filter(n => Number.isFinite(n));
}

// repeat each symbol K times (for a longer horizontal hold on the graph)
function repeatEach(arr, K) {
  const out = [];
  for (const v of arr) for (let i = 0; i < K; i++) out.push(v);
  return out;
}

// fast noise that changes every sub-sample (K times per symbol)
function makeFastNoiseTrace(symbolLevels, amp, K) {
  const out = [];
  for (const v of symbolLevels) {
    for (let i = 0; i < K; i++) {
      const jitter = (Math.random() * 2 - 1) * amp; // U[-amp,+amp]
      const y = clamp(v + jitter, 0.0, 9.9);
      out.push(Number(y.toFixed(1)));
    }
  }
  return out;
}



function drawSignal(canvas, cleanArr, noisyArr) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const mL = 40, mR = 10, mT = 10, mB = 25;
  const w = W - mL - mR, h = H - mT - mB;

  ctx.clearRect(0,0,W,H);

  // axes
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mL, mT); ctx.lineTo(mL, mT + h); ctx.lineTo(mL + w, mT + h);
  ctx.stroke();

  // value→y map (0..9.9)
  const yOf = v => mT + h - (v / 9.9) * h;

  // reference lines: 2, 5, 8
  [[2,'#e6e6e6'], [5,'#ffd6d6'], [8,'#e6e6e6']].forEach(([v,col])=>{
    const y = yOf(v);
    ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(mL + w, y); ctx.stroke();
    ctx.fillStyle = '#777';
    ctx.font = '11px sans-serif';
    ctx.fillText(v.toString(), 6, y - 2);
  });

  // choose x scale based on the longer of the two arrays
  const n = Math.max(cleanArr.length, noisyArr.length);
  if (n < 2) return;
  const xOfIndex = i => mL + (i/(n-1)) * w;


  // plot helper
  function plotStep(arr, style) {
    if (arr.length === 0) return;
    ctx.strokeStyle = style;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // start at first sample
    let xPrev = xOfIndex(0);
    let yPrev = yOf(arr[0]);
    ctx.moveTo(xPrev, yPrev);

    for (let i = 0; i < arr.length - 1; i++) {
      const xNext = xOfIndex(i + 1);
      const yLevel = yOf(arr[i]);       // stay at current value
      const yJump  = yOf(arr[i + 1]);   // next value

      // horizontal segment (hold value)
      ctx.lineTo(xNext, yLevel);
      // vertical jump to next value
      ctx.lineTo(xNext, yJump);

      xPrev = xNext;
      yPrev = yJump;
    }
    ctx.stroke();
  }


  // clean = gray, noisy = black
  plotStep(cleanArr, '#999'); // clean in gray
  plotStep(noisyArr, '#000'); // noisy in black
}

function renderGraph() {
  const canvas = document.getElementById('signal');
  if (!canvas) return;

  const cleanText = document.getElementById('encode-output').textContent;
  const noisyText = document.getElementById('encode-output-noisy').textContent;
  const amp = Number(document.getElementById('noise')?.value || 0);

  // parse the **symbol-rate** sequences (one value per bit)
  const cleanSymbols = parseLevels(cleanText);

  // oversample factor: fast noise updates within each symbol
  const K = 24; // noise changes 8× faster than symbol steps

  // clean step trace: repeat each symbol K times so it looks like a square hold
  const cleanTrace = repeatEach(cleanSymbols, K);

  // noisy fast trace: add new noise every sub-sample
  const noisyTrace = makeFastNoiseTrace(cleanSymbols, amp, K);

  drawSignal(canvas, cleanTrace, noisyTrace);
}





// Tab switcher (keep whatever you already had)
document.getElementById('tab-encode').onclick = () => {
  document.getElementById('encode-view').classList.remove('hidden');
  document.getElementById('decode-view').classList.add('hidden');
};
document.getElementById('tab-decode').onclick = () => {
  document.getElementById('decode-view').classList.remove('hidden');
  document.getElementById('encode-view').classList.add('hidden');
};


document.getElementById('encode-btn').onclick = () => {
  const inputs = Array.from(document.querySelectorAll('#char-grid .char'));
  const rawText = inputs.map(i => (i.value || "").slice(0,1)).join("");

  const bits = ascii7BitsForText(rawText);
  const clean = bits.map(b => b.split("").map(bitToLevel).join(" ")).join("\n"); // keep per-char lines
  document.getElementById('encode-output').textContent = clean || "(no input)";

  const amp = Number(document.getElementById("noise").value);
  document.getElementById('encode-output-noisy').textContent =
    clean ? addNoise(clean, amp) : "";

  renderGraph(); // ← draw after encoding
};


const noiseSlider = document.getElementById("noise");

noiseSlider.addEventListener("input", () => {
  const amp = Number(noiseSlider.value);
  const clean = document.getElementById('encode-output').textContent;
  document.getElementById('encode-output-noisy').textContent =
    clean ? addNoise(clean, amp) : "";
  renderGraph();

  // stop previous animation if running
  if (noiseInterval) clearInterval(noiseInterval);

  // if amp = 0, do not animate
  if (amp === 0) return;

  // animation: re-apply noise every 0.2 seconds
  noiseInterval = setInterval(() => {
    const cleanNow = document.getElementById('encode-output').textContent;
    document.getElementById('encode-output-noisy').textContent =
      cleanNow ? addNoise(cleanNow, Number(noiseSlider.value)) : "";
    renderGraph();
  }, 200); // 200 ms
});

// restart animation to respect any existing slider value
const amp = Number(noiseSlider.value);
if (noiseInterval) clearInterval(noiseInterval);
if (amp > 0) {
  noiseInterval = setInterval(() => {
    const cleanNow = document.getElementById('encode-output').textContent;
    document.getElementById('encode-output-noisy').textContent =
      cleanNow ? addNoise(cleanNow, amp) : "";
  }, 200);
}




function decodeLevelsToText(input) {
  // 1. split on any whitespace
  const nums = input.trim().split(/\s+/);

  // 2. convert each number → bit
  const bits = nums.map(n => {
    const value = parseFloat(n);
    return value >= 5 ? "1" : "0";   // fixed threshold
  });

  // 3. group into chunks of 7
  const chars = [];
  for (let i = 0; i < bits.length; i += 7) {
    const chunk = bits.slice(i, i + 7).join("");
    if (chunk.length < 7) break; // ignore incomplete tail

    // 4. convert each 7-bit chunk → ASCII char
    const code = parseInt(chunk, 2);
    chars.push(String.fromCharCode(code));
  }

  return chars.join("");
}

document.getElementById('decode-btn').onclick = () => {
  const raw = document.getElementById('decode-input').value;
  const decoded = decodeLevelsToText(raw);
  document.getElementById('decode-output').textContent = decoded || "(no output)";
};
