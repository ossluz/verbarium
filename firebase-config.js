// ═══════════════════════════════════════════════════════════════════
//  VERBARIUM PRO — Configuração do Firebase
//  
//  INSTRUÇÕES:
//  1. Vá em console.firebase.google.com → seu projeto → Web App
//  2. Copie os valores do seu firebaseConfig
//  3. Cole cada valor no campo correspondente abaixo
//  4. Faça upload deste arquivo junto com o index.html no GitHub
//  5. Pronto! Todos que acessarem o link conectarão automaticamente.
// ═══════════════════════════════════════════════════════════════════

var VERBARIUM_FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA8AcvztTWjr3o5QeEKPNLZfiNgFY1gvtw",
  authDomain:        "verbarium-pro.firebaseapp.com",
  projectId:         "verbarium-pro",
  storageBucket:     "verbarium-pro.firebasestorage.app",
  messagingSenderId: "954538384293",
  appId:             "1:954538384293:web:cd7841fa58c2335198264c"
};

// NÃO EDITE ABAIXO DESTA LINHA
if (typeof window !== 'undefined') {
  window.VERBARIUM_FIREBASE_CONFIG = VERBARIUM_FIREBASE_CONFIG;
  // Auto-save to localStorage when loaded
  if (VERBARIUM_FIREBASE_CONFIG.apiKey && !VERBARIUM_FIREBASE_CONFIG.apiKey.startsWith("COLE")) {
    try {
      localStorage.setItem("vb_fb_config", JSON.stringify(VERBARIUM_FIREBASE_CONFIG));
      console.log("[Verbarium] Firebase config carregado do arquivo ✓");
    } catch(e) {}
  }
}
