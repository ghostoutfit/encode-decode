// Simple tab switcher
document.getElementById('tab-encode').onclick = () => {
  document.getElementById('encode-view').classList.remove('hidden');
  document.getElementById('decode-view').classList.add('hidden');
};
document.getElementById('tab-decode').onclick = () => {
  document.getElementById('decode-view').classList.remove('hidden');
  document.getElementById('encode-view').classList.add('hidden');
};

// Placeholder encode/decode logic (we will fill this in fully later)
document.getElementById('encode-btn').onclick = () => {
  const text = document.getElementById('encode-input').value.toUpperCase();
  document.getElementById('encode-output').textContent = "TODO: encode: " + text;
};

document.getElementById('decode-btn').onclick = () => {
  const code = document.getElementById('decode-input').value.trim();
  document.getElementById('decode-output').textContent = "TODO: decode: " + code;
};
