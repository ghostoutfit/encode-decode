import { asciiEncode, asciiDecode } from "./ascii.js";

document.getElementById('tab-encode').onclick = () => {
  document.getElementById('encode-view').classList.remove('hidden');
  document.getElementById('decode-view').classList.add('hidden');
};
document.getElementById('tab-decode').onclick = () => {
  document.getElementById('decode-view').classList.remove('hidden');
  document.getElementById('encode-view').classList.add('hidden');
};

document.getElementById('encode-btn').onclick = () => {
  const text = document.getElementById('encode-input').value;
  const encoded = asciiEncode(text);
  document.getElementById('encode-output').textContent = encoded;
};

document.getElementById('decode-btn').onclick = () => {
  const bits = document.getElementById('decode-input').value;
  const decoded = asciiDecode(bits);
  document.getElementById('decode-output').textContent = decoded;
};

