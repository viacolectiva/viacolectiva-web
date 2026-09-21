# viacolectiva — landing

En línea: https://viacolectiva.com

Sitio estático (HTML + CSS + JS), sin build. **Lo que se sube a GitHub es el contenido de la carpeta `web/`**: el archivo `wrangler.jsonc` (configuración de Cloudflare) y la carpeta `public/` (el sitio). Este README queda afuera a propósito.

## Ver en local

```bash
cd web/public && python3 -m http.server 4173
```

Abrir http://localhost:4173

## Estructura (dentro de `web/public/`)

- `index.html`: contenido y textos en inglés
- `js/i18n.js`: textos en español
- `css/styles.css`: estilos (colores de marca en `:root`)
- `js/main.js`: animaciones e interacciones
- `assets/fonts/`: Alte Haas Grotesk (freeware; su licencia debe viajar con la fuente)
- `assets/img/`: imagotipo, favicon e imagen para compartir en redes (og-image)

## Idiomas (inglés por defecto, español segundo)

- El **inglés** está escrito directamente en `index.html`.
- El **español** está en `js/i18n.js`. Cada texto traducible del HTML tiene un atributo `data-i18n="clave"` (o `data-i18n-aria` para textos de accesibilidad) y en `i18n.js` está la misma clave con su versión en español.
- Para cambiar un texto: en inglés, editarlo en el HTML; en español, editar la clave en `i18n.js`.
- La elección del visitante se recuerda en su navegador. También se puede forzar por URL: `?lang=es` o `?lang=en`.

Librerías por CDN: GSAP + ScrollTrigger (animaciones) y Lenis (scroll suave). Si no cargan, el sitio se ve completo, sólo que sin animaciones.

## Publicar (GitHub + Cloudflare Worker)

- Repositorio: github.com/viacolectiva/viacolectiva-web (rama `main`). Contiene la carpeta **`web/`** entera (`web/wrangler.jsonc` + `web/public/`).
- Cloudflare: Worker `viacolectiva-web` conectado a ese repositorio. En **Settings → Build → Root directory** tiene que decir **`web`**. Deploy command: `npx wrangler deploy`, sin build.
- Para actualizar: en GitHub, **Add file → Upload files**, arrastrar la carpeta `web` entera → **Commit changes**. Cloudflare publica solo.
- El `name` de `wrangler.jsonc` tiene que coincidir con el nombre del Worker.
- Dominio: en el Worker, pestaña **Domains → Add → Custom domain** → `viacolectiva.com` y `www.viacolectiva.com`.

## Email

`contact@viacolectiva.com` está activo con **Email Routing** de Cloudflare: los mensajes se reenvían a `viacolectiva.producciones@gmail.com`. Los demás correos al dominio se descartan (regla catch-all = Drop).

El formulario abre el cliente de correo del visitante con el mensaje armado. Para recibirlo directo sin que se abra el correo, crear un formulario en Formspree (o similar) y pegar su URL en `data-endpoint` del `<form>`.

## Colores

| Área | Color |
|---|---|
| Productos digitales | `#C5F82A` lima |
| Música & audio | `#2C3E8E` azul |
| Foto & imagen | `#8B35A2` violeta |
| Video | `#EC173C` rojo |
