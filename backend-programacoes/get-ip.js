// get-ip.js
const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    console.log('🌐 IP público do Render:', data.ip);
  } catch (e) {
    console.error('❌ Erro ao buscar IP:', e.message);
  }
})();
