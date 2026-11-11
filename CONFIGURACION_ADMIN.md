# Módulo de administración C4

## Qué incluye
- Apartado Administración dentro de la navegación original.
- Inicio de sesión con Supabase Auth (correo y contraseña).
- Comprobación de autorización contra `c4_admin_users`.
- Consulta de `c4_assessment_results`, búsqueda y filtros.
- Exportación de los registros visibles a CSV y Excel (.xlsx).

## Configuración necesaria antes de publicar
1. Abre `js/config.js`.
2. Conserva la URL del proyecto Supabase y reemplaza `PEGA_AQUI_TU_CLAVE_PUBLISHABLE_O_ANON` por la clave pública publishable/anon del proyecto.
3. No uses nunca `service_role`, secret keys ni credenciales privadas en GitHub Pages.
4. Crea los usuarios administrativos en Supabase Authentication y autorízalos en `c4_admin_users`.
5. Configura RLS para que el usuario autenticado pueda verificar únicamente su propio permiso administrativo y para que solo administradores autorizados puedan leer `c4_assessment_results`.

## Compatibilidad de esquema
El panel intenta reconocer en `c4_admin_users` los campos `user_id`, `auth_user_id` o `uid`, o alternativamente `email`/`user_email`. Para estado activo reconoce `is_active`, `active` o `enabled` (si no existe ninguno, la fila se considera activa).
La tabla de resultados se representa dinámicamente con las columnas devueltas por Supabase, por lo que no exige nombres fijos para mostrar y exportar. Los filtros de módulo y aprobación reconocen campos habituales (`module`, `module_id`, `assessment_type`, `status`, `passed`, `approved`, etc.).

## Nota importante
La interfaz administrativa queda incorporada, pero no se considera operativa hasta configurar la clave pública, usuarios y políticas RLS. Las evaluaciones actuales de la versión previa guardan resultados en `localStorage`; este panel solo mostrará registros que realmente estén almacenados en `c4_assessment_results`. Será necesario conectar el envío de cada evaluación a Supabase para que los nuevos intentos aparezcan aquí.
