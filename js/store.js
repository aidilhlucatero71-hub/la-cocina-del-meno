// Capa de datos: usa Firebase si está configurado; si no, modo demostración (localStorage).
import { firebaseConfig, DOMINIO_USUARIOS, DEMO_USUARIO, DEMO_CONTRASENA, DUENOS_INICIALES } from "./config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const ordenar = (a, b) => (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(String(b.nombre));
export const USUARIO_OK = /^[a-z0-9._-]{3,20}$/;
export const limpiarUsuario = (u) => String(u || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
export const correoDe = (u) => (u.includes("@") ? u.trim() : `${limpiarUsuario(u)}@${DOMINIO_USUARIOS}`);
export const nuevoId = (txt = "item") =>
  txt.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) +
  "-" + Math.random().toString(36).slice(2, 6);

let _store;
export function getStore() {
  if (!_store) _store = firebaseConfig.apiKey ? crearFirebase() : crearDemo();
  return _store;
}

/* ---------------- MODO DEMOSTRACIÓN ---------------- */
async function crearDemo() {
  const KEY = "meno-demo-v1", SES = "meno-demo-sesion";
  const subs = new Set(), authSubs = new Set();
  let data;
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { throw new Error("El navegador no tiene espacio para guardar (prueba con fotos más ligeras)."); } };
  data = leer();
  if (!data) { const seed = (await import("./seed.js")).default; data = structuredClone(seed); guardar(); }
  const snap = () => ({ negocio: data.negocio, categorias: [...data.categorias].sort(ordenar), productos: [...data.productos].sort(ordenar) });
  const emitir = () => subs.forEach((cb) => cb(snap()));
  window.addEventListener("storage", (e) => { if (e.key === KEY) { data = leer() || data; emitir(); } });
  const UKEY = "meno-demo-usuarios";
  let usuarios;
  try { usuarios = JSON.parse(localStorage.getItem(UKEY) || "null"); } catch {}
  if (!usuarios) usuarios = [{ id: "u-admin", usuario: DEMO_USUARIO, nombre: "El Meño", rol: "dueno", activo: true, pass: DEMO_CONTRASENA, creado: Date.now() }];
  const uSubs = new Set();
  const uGuardar = () => { try { localStorage.setItem(UKEY, JSON.stringify(usuarios)); } catch {} uSubs.forEach((cb) => cb(uLista())); };
  const uLista = () => usuarios.map(({ pass, ...u }) => ({ ...u })).sort((a, b) => (a.creado || 0) - (b.creado || 0));
  const sesion = () => { try { return sessionStorage.getItem(SES); } catch { return null; } };
  const perfil = () => { const u = usuarios.find((x) => x.id === sesion()); if (!u || !u.activo) return null; const { pass, ...p } = u; return p; };
  const avisarAuth = () => { const p = perfil(); authSubs.forEach((cb) => cb(p)); };
  window.addEventListener("storage", (e) => { if (e.key === UKEY) { try { usuarios = JSON.parse(e.newValue) || usuarios; } catch {} uSubs.forEach((cb) => cb(uLista())); avisarAuth(); } });
  const up = (lista, id, obj) => { const i = data[lista].findIndex((x) => x.id === id); if (i >= 0) data[lista][i] = { ...data[lista][i], ...obj, id }; else data[lista].push({ ...obj, id }); };
  const cambio = () => { guardar(); emitir(); };
  return {
    modo: "demo",
    watch(cb) { subs.add(cb); queueMicrotask(() => cb(snap())); return () => subs.delete(cb); },
    onAuth(cb) { authSubs.add(cb); queueMicrotask(() => cb(perfil())); return () => authSubs.delete(cb); },
    async login(usuario, pass) {
      await new Promise((r) => setTimeout(r, 450));
      const u = usuarios.find((x) => x.usuario === limpiarUsuario(usuario));
      if (!u || u.pass !== pass) throw new Error("Usuario o contraseña incorrectos.");
      if (!u.activo) throw new Error("Tu usuario está suspendido. Pide al dueño que lo active.");
      try { sessionStorage.setItem(SES, u.id); } catch {}
      avisarAuth();
    },
    async logout() { try { sessionStorage.removeItem(SES); } catch {} avisarAuth(); },
    async recuperar() { throw new Error("En modo demostración no se envían correos de recuperación."); },
    watchUsuarios(cb) { uSubs.add(cb); queueMicrotask(() => cb(uLista())); return () => uSubs.delete(cb); },
    async crearUsuario({ usuario, nombre, rol, pass }) {
      usuario = limpiarUsuario(usuario);
      if (usuarios.some((x) => x.usuario === usuario)) throw new Error("Ese usuario ya existe. Elige otro nombre de usuario.");
      usuarios.push({ id: "u-" + Math.random().toString(36).slice(2, 9), usuario, nombre, rol, activo: true, pass, creado: Date.now(), creadoPor: perfil()?.usuario || "" });
      uGuardar();
    },
    async actualizarUsuario(id, obj) { const u = usuarios.find((x) => x.id === id); if (!u) return; Object.assign(u, obj); uGuardar(); },
    async borrarUsuario(id) { usuarios = usuarios.filter((x) => x.id !== id); uGuardar(); },
    async cambiarMiContrasena(actual, nueva) {
      const u = usuarios.find((x) => x.id === sesion());
      if (!u || u.pass !== actual) throw new Error("La contraseña actual no es correcta.");
      u.pass = nueva; uGuardar();
    },
    async guardarNegocio(obj) { data.negocio = { ...data.negocio, ...obj }; cambio(); },
    async guardarCategoria(id, obj) { up("categorias", id, obj); cambio(); },
    async borrarCategoria(id) { data.categorias = data.categorias.filter((c) => c.id !== id); cambio(); },
    async guardarProducto(id, obj) { up("productos", id, obj); cambio(); },
    async borrarProducto(id) { data.productos = data.productos.filter((p) => p.id !== id); cambio(); },
    async disponibles(ids, valor) { data.productos.forEach((p) => { if (ids.includes(p.id)) p.disponible = valor; }); cambio(); },
    async cargarInicial() { const seed = (await import("./seed.js")).default; data = structuredClone(seed); cambio(); },
  };
}

/* ---------------- FIREBASE ---------------- */
async function crearFirebase() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js"),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const col = (n) => F.collection(db, n);
  // Segunda instancia solo para dar de alta usuarios sin cerrar la sesión del dueño.
  const alta = initializeApp(firebaseConfig, "alta-usuarios");
  const altaAuth = A.getAuth(alta);
  A.setPersistence(altaAuth, A.inMemoryPersistence).catch(() => {});
  const duenoInicial = (email) => (DUENOS_INICIALES || []).map((x) => correoDe(x)).includes(String(email || "").toLowerCase());
  async function perfilDe(u) {
    if (!u) return { p: null };
    const ref = F.doc(db, "usuarios", u.uid);
    let d = await F.getDoc(ref);
    if (!d.exists() && duenoInicial(u.email)) {
      await F.setDoc(ref, { usuario: u.email.split("@")[0], nombre: u.email.split("@")[0], rol: "dueno", activo: true, creado: Date.now(), creadoPor: "inicial" });
      d = await F.getDoc(ref);
    }
    if (!d.exists()) return { p: null, err: "Tu usuario no tiene acceso al panel." };
    const p = { ...d.data(), id: u.uid };
    if (!p.activo) return { p: null, err: "Tu usuario está suspendido. Pide al dueño que lo active." };
    return { p };
  }
  return {
    modo: "firebase",
    watch(cb) {
      const st = { negocio: null, categorias: [], productos: [] }, listo = { n: false, c: false, p: false };
      const emit = () => { if (listo.n && listo.c && listo.p) cb({ negocio: st.negocio, categorias: [...st.categorias].sort(ordenar), productos: [...st.productos].sort(ordenar) }); };
      const err = (e) => cb({ error: e.message || String(e) });
      const u1 = F.onSnapshot(F.doc(db, "config", "negocio"), (d) => { st.negocio = d.exists() ? d.data() : null; listo.n = true; emit(); }, err);
      const u2 = F.onSnapshot(col("categorias"), (q) => { st.categorias = q.docs.map((d) => ({ ...d.data(), id: d.id })); listo.c = true; emit(); }, err);
      const u3 = F.onSnapshot(col("productos"), (q) => { st.productos = q.docs.map((d) => ({ ...d.data(), id: d.id })); listo.p = true; emit(); }, err);
      return () => { u1(); u2(); u3(); };
    },
    onAuth(cb) {
      return A.onAuthStateChanged(auth, async (u) => {
        try {
          const { p } = await perfilDe(u);
          if (u && !p) { await A.signOut(auth); return; }
          cb(p);
        } catch { cb(null); }
      });
    },
    async login(usuario, pass) {
      try { await A.signInWithEmailAndPassword(auth, correoDe(usuario), pass); }
      catch (e) {
        const c = e.code || "";
        if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)) throw new Error("Usuario o contraseña incorrectos.");
        if (/too-many-requests/.test(c)) throw new Error("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
        if (/network/.test(c)) throw new Error("Sin conexión a internet.");
        throw new Error("No se pudo entrar (" + c + ").");
      }
      const { err } = await perfilDe(auth.currentUser);
      if (err) { await A.signOut(auth); throw new Error(err); }
    },
    watchUsuarios(cb) {
      return F.onSnapshot(col("usuarios"), (q) => cb(q.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (a.creado || 0) - (b.creado || 0))), () => cb([]));
    },
    async crearUsuario({ usuario, nombre, rol, pass }) {
      let cred;
      try { cred = await A.createUserWithEmailAndPassword(altaAuth, correoDe(usuario), pass); }
      catch (e) {
        const c = e.code || "";
        if (/email-already-in-use/.test(c)) throw new Error("Ese usuario ya existe o existió antes. Elige otro nombre de usuario.");
        if (/weak-password/.test(c)) throw new Error("La contraseña es muy débil. Usa al menos 8 caracteres.");
        if (/operation-not-allowed/.test(c)) throw new Error("Activa 'Correo/contraseña' en Firebase Authentication.");
        throw new Error("No se pudo crear el usuario (" + c + ").");
      } finally { A.signOut(altaAuth).catch(() => {}); }
      await F.setDoc(F.doc(db, "usuarios", cred.user.uid), { usuario: usuario.trim().toLowerCase(), nombre, rol, activo: true, creado: Date.now(), creadoPor: auth.currentUser?.email?.split("@")[0] || "" });
    },
    async actualizarUsuario(id, obj) { await F.updateDoc(F.doc(db, "usuarios", id), obj); },
    async borrarUsuario(id) { await F.deleteDoc(F.doc(db, "usuarios", id)); },
    async cambiarMiContrasena(actual, nueva) {
      const u = auth.currentUser; if (!u) throw new Error("Vuelve a iniciar sesión.");
      try { await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, actual)); }
      catch { throw new Error("La contraseña actual no es correcta."); }
      try { await A.updatePassword(u, nueva); }
      catch (e) { throw new Error(/weak/.test(e.code || "") ? "La contraseña nueva es muy débil." : "No se pudo cambiar (" + (e.code || e.message) + ")."); }
    },
    async logout() { await A.signOut(auth); },
    async recuperar(usuario) {
      if (!String(usuario || "").includes("@")) throw new Error("Para recuperar tu contraseña escribe tu correo en Usuario. Si entras con un usuario sin @, pide al dueño que te restablezca la contraseña.");
      const correo = correoDe(usuario);
      auth.languageCode = "es";
      try { await A.sendPasswordResetEmail(auth, correo); }
      catch (e) {
        const c = e.code || "";
        if (/invalid-email|missing-email/.test(c)) throw new Error("Ese correo no es válido. Revísalo e intenta de nuevo.");
        if (/too-many-requests/.test(c)) throw new Error("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
        if (/network/.test(c)) throw new Error("Sin conexión a internet.");
        throw new Error("No se pudo enviar el correo (" + c + ").");
      }
      return correo;
    },
    async guardarNegocio(obj) { await F.setDoc(F.doc(db, "config", "negocio"), obj, { merge: true }); },
    async guardarCategoria(id, obj) { const { id: _, ...o } = obj; await F.setDoc(F.doc(db, "categorias", id), o, { merge: true }); },
    async borrarCategoria(id) { await F.deleteDoc(F.doc(db, "categorias", id)); },
    async guardarProducto(id, obj) { const { id: _, ...o } = obj; await F.setDoc(F.doc(db, "productos", id), o, { merge: true }); },
    async borrarProducto(id) { await F.deleteDoc(F.doc(db, "productos", id)); },
    async disponibles(ids, valor) {
      for (let i = 0; i < ids.length; i += 400) {
        const b = F.writeBatch(db);
        ids.slice(i, i + 400).forEach((id) => b.update(F.doc(db, "productos", id), { disponible: valor }));
        await b.commit();
      }
    },
    async cargarInicial() {
      const seed = (await import("./seed.js")).default;
      for (const n of ["productos", "categorias"]) {
        const q = await F.getDocs(col(n));
        for (const d of q.docs) await F.deleteDoc(d.ref);
      }
      await F.setDoc(F.doc(db, "config", "negocio"), seed.negocio);
      for (const c of seed.categorias) { const { id, ...o } = c; await F.setDoc(F.doc(db, "categorias", id), o); }
      for (const p of seed.productos) { const { id, ...o } = p; await F.setDoc(F.doc(db, "productos", id), o); }
    },
  };
}

/* ---------------- Utilidades compartidas ---------------- */
export const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DIAS_LARGO = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export function textoDias(d) {
  if (!d || !d.length || d.length === 7) return "Todos los días";
  const s = [...d].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const k = s.map((x) => (x + 6) % 7);
  const seguidos = k.every((x, i) => i === 0 || x === k[i - 1] + 1);
  if (seguidos && s.length > 2) return `${DIAS_LARGO[s[0]][0].toUpperCase() + DIAS_LARGO[s[0]].slice(1)} a ${DIAS_LARGO[s[s.length - 1]]}`;
  return s.map((x) => DIAS[x]).join(", ");
}
export function ahoraTijuana() {
  const n = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Tijuana" }));
  return { dia: n.getDay(), min: n.getHours() * 60 + n.getMinutes() };
}
export const aMin = (hhmm) => { const [h, m] = String(hhmm || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
export const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-MX");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
