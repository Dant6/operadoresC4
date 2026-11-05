# operadoresC4 — Plataforma de Capacitación Psicosocial

Plataforma estática para GitHub Pages con el contenido del documento Word `Capacitacion Psicosocial Personal Nuevo` incorporado en su totalidad (192 párrafos no vacíos), conservando el texto y el orden de los módulos. Se agregan navegación por páginas, tres recursos de YouTube, dos evaluaciones de 10 preguntas y panel administrativo privado.

## Estructura

- `index.html`: inicio, presentación, módulos, evaluaciones y panel administrativo.
- `css/styles.css`: diseño adaptable.
- `js/questions.js`: banco de preguntas y claves de respuesta.
- `js/app.js`: navegación, evaluación, cálculo de notas, registro y panel.
- `js/supabase-config.js`: URL del proyecto y clave anon/public.
- `supabase/schema.sql`: tablas, permisos y políticas RLS.

## Importante: configurar Supabase antes de publicar

1. Crea un proyecto en Supabase.
2. En el proyecto abre **SQL Editor → New query**.
3. Copia y ejecuta todo el contenido de `supabase/schema.sql`.
4. En **Project Settings → API** copia la **Project URL** y la clave **anon / publishable**.
5. Abre `js/supabase-config.js` y reemplaza los dos valores de ejemplo:
   - `PEGA_AQUI_LA_URL_DE_TU_PROYECTO`
   - `PEGA_AQUI_TU_CLAVE_ANON_PUBLIC`
6. Guarda el archivo.

**Nunca incluyas la clave `service_role` o una clave secreta en este repositorio público.** La clave anon/public está diseñada para usarse desde el navegador junto con las políticas RLS.

## Crear la cuenta administrativa

1. En Supabase abre **Authentication → Users**.
2. Crea o invita la cuenta que utilizará el administrador.
3. Confirma el correo si Supabase lo solicita.
4. En **SQL Editor**, ejecuta esta consulta reemplazando el correo por el correo real de esa cuenta:

```sql
insert into public.c4_admin_users (user_id)
select id from auth.users
where email = 'CORREO_ADMIN@DOMINIO.COM'
on conflict (user_id) do nothing;
```

5. En la plataforma, abre **Panel administrativo** e inicia sesión con ese correo y contraseña.

Solo las cuentas registradas en `c4_admin_users` pueden consultar resultados. Los participantes pueden enviar evaluaciones, pero no consultar la tabla de resultados.

## Publicar en GitHub Pages

Sube a la raíz del repositorio todos los elementos de esta carpeta, incluyendo `css/`, `js/` y `supabase/`. Mantén la rama `main` y la carpeta `/(root)` en **Settings → Pages**.

## Funcionamiento de las evaluaciones

- Módulo 1: 10 preguntas de habilidades emocionales.
- Módulo 2: 10 preguntas de habilidades comunicativas.
- Cada respuesta correcta vale 0,5 puntos; nota máxima 5,0.
- Se solicita nombre y correo para asociar el resultado al participante.
- El sistema guarda módulo, aciertos, nota, respuestas y fecha/hora.
- El panel permite consultar resultados y exportarlos a CSV.

## Seguridad y privacidad

La lectura de resultados está restringida mediante Row Level Security (RLS) a usuarios incluidos en `c4_admin_users`. La inserción de resultados está habilitada para los participantes mediante la clave pública y las políticas RLS. Para un despliegue institucional de alta exposición, se recomienda añadir un servicio de backend/Edge Function con validación y controles antiabuso antes de abrir el formulario a un público amplio.

Los datos de nombre y correo son datos personales. La entidad debe definir aviso de privacidad, finalidad, periodo de conservación y autorización de tratamiento antes de recolectarlos. Limita el acceso al panel a personal autorizado.
