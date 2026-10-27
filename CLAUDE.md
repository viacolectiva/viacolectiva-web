# viacolectiva — guía para Claude

Landing bilingüe de viacolectiva (productora: video, imagen, audio + productos digitales).
En línea: https://viacolectiva.com · El detalle de estructura, idiomas y colores está en `README.md`.

## Reglas del proyecto

1. **El logo no se modifica nunca.** Ni recolorear sus líneas, ni separarlo, ni cambiar grosores, ni rehacer el wordmark. Las animaciones pueden mover, escalar o dibujar el logo entero, pero el estado final es el logo intacto en un solo color. Archivos oficiales en `Logo/` (el imagotipo se usa como máscara CSS; vectores exactos en `Logo/Editables/*.ai`, trazo 17 en caja de 400).

2. **Todo cambio de texto se hace en los dos idiomas.** El inglés (por defecto) está en `web/public/index.html`; el español en `web/public/js/i18n.js`, con la misma clave del atributo `data-i18n`. Si falta la clave en español, el texto queda en inglés.

3. **El email es `contact@viacolectiva.com` en ambos idiomas**, nunca se traduce ni se cambia.

4. **No borrar los bloques ocultos.** En la sección Digital, las tarjetas "What we build" y la franja de capacidades viven dentro de `.digital-more[hidden]`: están guardadas para usarlas más adelante. Los pasos "How we work" sí están visibles y se quedan.

5. **Alcance deliberadamente chico:** servicios y contacto. No agregar portafolio, "sobre nosotros" ni secciones nuevas salvo que la usuaria lo pida.

## Publicar un cambio

La carpeta del proyecto es una copia local del repositorio.

```bash
cd web/public && python3 -m http.server 4173   # ver en local: http://localhost:4173
```

```bash
git add -A && git commit -m "..." && git push   # publica: Cloudflare compila solo en ~1 minuto
```

- Solo se sube lo que permite `.gitignore`: `web/`, `README.md`, `CLAUDE.md` y `.gitignore`. El PSD, `Logo/` y el PDF se quedan fuera a propósito.
- El push usa la deploy key `~/.ssh/viacolectiva_web` (configurada en el repo con `core.sshCommand`), que solo tiene acceso a este repositorio.
- Hosting: Cloudflare Worker `viacolectiva-web`, con **Root directory `/web`** y deploy command `npx wrangler deploy`. El `name` de `web/wrangler.jsonc` debe coincidir con el nombre del Worker.

## Verificar que quedó publicado

El DNS local a veces no resuelve el dominio aunque el sitio esté bien. Conviene comprobar así:

```bash
curl -sI --resolve viacolectiva.com:443:$(dig +short @1.1.1.1 viacolectiva.com A | head -1) https://viacolectiva.com/ | head -1
```
