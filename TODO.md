# TODO - Nuevos accesos y vista ServicioMDA

- [ ] Agregar cuentas ServicioMDA y SuperAdmin en `src/config/accessControl.ts`.
- [ ] Extender tipos de sesión para diferenciar ServicioMDA (general sin exportación).
- [ ] Ajustar auth mapping en `src/services/authService.ts`.
- [ ] Ajustar `App.tsx` para comportamiento ServicioMDA (vista general, sin exportación, sin upload).
- [ ] Ajustar `Charts.tsx` para ocultar gráficos solicitados a ServicioMDA.
- [ ] Extender parsing Excel para marcar equipos "no atender" por fila en rojo.
- [ ] Extender tipos de datos para flag `noAtender`.
- [ ] Ajustar `Tables.tsx` con búsqueda global y alerta de no atención para ServicioMDA.
- [ ] Ejecutar build y validar.
