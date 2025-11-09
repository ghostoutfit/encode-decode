import { ascii7BitsForText } from "./ascii.js";

// Tab switcher (keep whatever you already had)
document.getElementById('tab-encode').onclick = () => {
  document.getElementById('encode-view').classList.remove('hidden');
  document.getElementById('decode-view').classList.add('hidden');
};
document.getElementById('tab-decode').onclick = () => {
  document.getElementById('decode-view').classList.remove('hidden');
  document.getElementById('encode-view').classList.add('hidden');
};

// Map bit -> physical number on 0..9 with one decimal
function bitToLevel(b) {
  return b === "1" ? "9.0" : "0.0";
}

document.getElementById('encode-btn').onclick = () => {
  const inputs = Array.from(document.querySelectorAll('#char-grid .char'));
  const rawText = inputs.map(i => (i.value || "").slice(0, 1)).join("");
  // Encode only the characters actually entered
  const bitGroups = ascii7BitsForText(rawText);

  // Convert bits to numbers; separate characters with a pipe
  const encoded = bitGroups
    .map(bits => bits.split("").map(bitToLevel).join(" "))
    .join(" | ");

  document.getElementById('encode-output').textContent = encoded || "(no input)";
};
