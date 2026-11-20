// ==========================================================
//  CONFIGURACIÓN — La Cocina del Meño
// ==========================================================
//  1) Pega aquí los datos de tu proyecto de Firebase
//     (Consola de Firebase → Configuración del proyecto → Tus apps → Web).
//  2) Mientras "apiKey" esté vacío, el sitio funciona en MODO DEMOSTRACIÓN:
//     todo se guarda solo en el navegador donde se usa.
// ==========================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAwfRQf6KcbJpklJngyxnQmgZ7380zEiHg",
  authDomain: "la-cocina-del-meno.firebaseapp.com",
  projectId: "la-cocina-del-meno",
  storageBucket: "la-cocina-del-meno.firebasestorage.app",
  messagingSenderId: "209756105443",
  appId: "1:209756105443:web:1e7bb8fd472d793505f3d6"
};

// Los usuarios del panel se escriben sin "@". Por dentro se convierten en
// usuario@DOMINIO_USUARIOS (por ejemplo: meno → meno@cocinadelmeno.app).
// Crea a tus usuarios en Firebase → Authentication con ese mismo formato.
export const DOMINIO_USUARIOS = "cocinadelmeno.app";

// Usuario(s) DUEÑO iniciales. Créalos en Firebase → Authentication y escríbelos
// aquí (y en firestore.rules). Al entrar por primera vez reciben el rol de Dueño
// y desde el panel pueden dar de alta a los demás usuarios.
export const DUENOS_INICIALES = ["meno", "aidilhlucatero71@gmail.com"];

// Solo para MODO DEMOSTRACIÓN (no aplica cuando conectas Firebase).
export const DEMO_USUARIO = "admin";
export const DEMO_CONTRASENA = "meno2026";
