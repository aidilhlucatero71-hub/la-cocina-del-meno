# La Cocina del Meño: menú digital y panel de cocina

## Qué incluye

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El menú que ven los clientes. Se actualiza solo, al momento, cuando cambias algo en el panel. |
| `admin.html` | El panel para editar el menú: entra con usuario y contraseña. |
| `js/config.js` | Aquí pegas los datos de tu proyecto de Firebase. |
| `js/store.js` | Conecta las páginas con la base de datos. No hace falta tocarlo. |
| `js/seed.js` | El menú inicial con todos los platillos, precios, fotos y el logo. |
| `firestore.rules` | La seguridad: quién puede leer y quién puede editar. |
| `firebase.json` | La configuración para publicar en Firebase Hosting. |

### Qué hace el panel
- **Usuarios (solo el dueño la ve):** dar de alta usuarios con nombre, usuario y contraseña (con ojito, medidor de seguridad y botón "Sugerir"), elegir su rol, suspenderlos o reactivarlos con un toque, cambiarles el rol y quitarles el acceso. Al dar de alta a alguien se arma un mensaje con sus datos para copiarlo y mandarlo por WhatsApp.
  - **Dueño:** puede hacer todo, incluido administrar usuarios.
  - **Encargado:** edita el menú y marca lo que se acabó, pero no ve la sección Usuarios.
- **Cambiar mi contraseña:** botón con una llave en la barra de arriba, para cualquier usuario.
- **Entrar con usuario y contraseña.** El campo de contraseña tiene un ojito para mostrarla u ocultarla, y avisa si están activadas las mayúsculas.
- **Letrero "¡Hay!" / "Se acabó"** en cada producto. Con un toque se voltea: el platillo sale en gris en el menú, tachado, con la etiqueta "Se acabó por hoy" y sin botón para pedir. El botón **"Ya hay de todo"** reactiva todos de una vez.
- **Editar cada producto por completo:** foto (se sube desde el celular y se ajusta sola), nombre, descripción, categoría, varios precios (orden, ½ orden, docena…), días en que hay, disponibilidad y posición. Arriba ves una **vista previa** de cómo quedará en el menú.
- **Agregar y eliminar** productos.
- **Categorías:** nombre, frase, nota, color y orden.
- **Mi negocio:** logo, nombre, frase, aviso destacado (sale como franja amarilla en el menú), horario, hora de abrir y cerrar (para el "Abierto ahora"), dirección, Google Maps, WhatsApp y teléfono.
- Funciona en celular y en computadora.

---

## Probarlo sin instalar nada (modo demostración)

Mientras `js/config.js` no tenga los datos de Firebase, todo funciona en **modo demostración**: los cambios se guardan solo en el navegador donde se hacen.

1. Abre una terminal en esta carpeta y ejecuta `npx serve .` (o `python3 -m http.server`).
   > Abrir los archivos con doble clic no funciona, porque el navegador bloquea los módulos.
2. Abre `http://localhost:3000/admin.html` (o el puerto que te indique).
3. Entra con usuario **admin** y contraseña **meno2026** (es el dueño de la demo).
4. En otra pestaña abre `index.html` y verás tus cambios al momento.

---

## Ponerlo en línea con Firebase (gratis para un negocio de este tamaño)

### 1. Crear el proyecto
1. Entra a <https://console.firebase.google.com> con una cuenta de Google y crea un proyecto (por ejemplo, `cocina-del-meno`). Google Analytics no hace falta.
2. En **Compilación → Firestore Database**, crea la base de datos en **modo de producción** y elige una región cercana (por ejemplo, `us-west2` o `northamerica-south1`).
3. En **Compilación → Authentication → Método de acceso**, activa **Correo electrónico/contraseña**.

### 2. Crear al dueño (solo una vez)
En **Authentication → Usuarios → Agregar usuario**, crea **solo al dueño** con el formato `usuario@cocinadelmeno.app`, por ejemplo:

- Correo: `meno@cocinadelmeno.app`
- Contraseña: una segura, de al menos 8 caracteres.

En el panel se escribe solo **meno**; el resto se agrega solo. Para usar otro dominio, cámbialo en `DOMINIO_USUARIOS` dentro de `js/config.js`.

### 3. Registrar al dueño inicial
Escribe ese mismo usuario en **dos lugares**:
- En `js/config.js`: `DUENOS_INICIALES = ["meno"]`
- En `firestore.rules`, dentro de `duenoInicial()`: `'meno@cocinadelmeno.app'`

Al entrar por primera vez, el dueño queda dado de alta automáticamente. **A partir de ahí, a los demás usuarios se les da de alta desde el panel, en la pestaña Usuarios.** Ya no hace falta volver a la consola de Firebase.

### 4. Conectar las páginas
En **Configuración del proyecto (engrane) → Tus apps → Web (`</>`)**, registra una app y copia el bloque `firebaseConfig`. Pégalo en `js/config.js`.

### 5. Publicar
Con [Node.js](https://nodejs.org) instalado, en una terminal dentro de esta carpeta:
```bash
npm install -g firebase-tools
firebase login
firebase use --add          # elige tu proyecto
firebase deploy             # publica las reglas y las páginas
```
Al terminar te da una dirección como `https://cocina-del-meno.web.app`:
- **Menú para clientes:** `https://cocina-del-meno.web.app`
- **Panel:** `https://cocina-del-meno.web.app/admin`

### 6. Cargar el menú la primera vez
Entra al panel con tu usuario. Como la base de datos está vacía, aparece el botón **"Cargar menú inicial"**: tócalo y se suben los 32 productos con sus fotos.

> Si prefieres otro hosting (Netlify, Hostinger, Vercel…), sube los archivos tal cual. Firebase se seguirá usando para la base de datos y el inicio de sesión; las reglas se publican con `firebase deploy --only firestore:rules`.

---

## Notas
- **Fotos:** se guardan dentro de la base de datos, reducidas automáticamente para que cada una pese menos de 700 KB (el límite de Firestore es 1 MB por producto). Para un menú de este tamaño es más que suficiente.
- **Contraseñas:** cada usuario cambia la suya desde el botón de la llave. Si alguien la olvida, el dueño puede suspenderlo y darle de alta con otro nombre de usuario, o restablecerla en Firebase → Authentication. Las contraseñas no se guardan en estos archivos ni en la base de datos.
- **Quitar acceso:** borra al usuario de la lista y ya no podrá editar nada. Su cuenta queda en Firebase Authentication, así que ese nombre de usuario no se puede reutilizar; si quieres, bórrala también desde la consola.
- **Seguridad:** las reglas de `firestore.rules` revisan el rol en el servidor, así que un encargado no puede administrar usuarios aunque modifique la página.
- **Costos:** el plan gratuito de Firebase (Spark) cubre miles de visitas diarias al menú.
- **Zona horaria:** el "Hoy hay" y el "Abierto ahora" usan la hora de Tijuana/Mexicali.
