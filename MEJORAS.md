# Plan de Mejoras del Dashboard Ivanti

## Problemas a Resolver

### 1. Formato de Datos
- **IP**: 172017044032 → formatear como 172.17.44.32 (agregar puntos)
- **Fecha**: 45000.69027777778 → formatear como fecha corta (dd/MM/yyyy)

### 2. PDF - Informe Semanal
- Actual: captura de pantalla con html2canvas (baja calidad, páginas en negro)
- Necesario: informe profesional de alta calidad
  - Portada con KPIs generales
  - Gráficos por región
  - Gráficos por año
  - Lista de equipos no reportados por región
  - Equipos con nombres incorrectos

### 3. Funcionalidades
- Agregar IP y usuario al Excel
- Equipos con errores identificables en export PDF/Excel
- Separación de equipos no reportados por región
- Click en equipos con errores para ver detalles

## Archivos a Modificar

1. **types/index.ts** - Agregar campos de IP y usuario
2. **excelService.ts** - Formateo de IPs y fechas
3. **pdfService.ts** - Generar PDF profesional
4. **Tables.tsx** - Mostrar errores con highlighting
5. **Charts.tsx** - Mejores visualizaciones

## Estado
- [x] Formateo de IP (172017044032 → formato IPv4 con puntos en app)
- [x] Formateo de fecha (serial Excel a dd/MM/yyyy)
- [x] Filtro por región y año con recálculo dinámico en KPIs/gráficos/tablas
- [x] Región vacía como "Sin Región"
- [x] KPI renombrado a "Equipos Conectados" y lógica alineada con estatus reales

---

## Publicación por Región en Vercel (Opción A)

### Objetivo
Publicar **una sola app** y compartir links regionales en modo lectura:
- General: `/`
- Regional: `/?region=<Nombre Región>`

Ejemplos:
- `/?region=Fiscalia%20Nacional`
- `/?region=RM%20Oriente`
- `/?region=Sin%20Región`

### Implementación aplicada
1. Se agregó script de generación de datos:
   - `scripts/generate-region-data.mjs`
2. Se agregó listado oficial de regiones + slug:
   - `src/constants/regions.ts`
3. App con carga automática de datasets publicados:
   - `src/App.tsx`
   - Si hay query `region`, intenta cargar `/data/regiones/<slug>.json`
   - Si no hay query o no existe regional, carga `/data/general.json`
   - Si no hay JSON, mantiene flujo manual de carga Excel
4. Modo regional lectura:
   - selector de región bloqueado en `Sidebar` si llega por URL

### Estructura generada
- `public/data/general.json`
- `public/data/regiones/<slug-region>.json`

### Comandos
1) Generar datasets:
```bash
npm run generate:data
```

2) Probar local:
```bash
npm run dev
```

3) Build producción:
```bash
npm run build
```

### Flujo GitHub + Vercel
1. Ejecutar `npm run generate:data`
2. Confirmar que existan JSON en `public/data/...`
3. Commit + push al repositorio
4. Importar proyecto en Vercel
5. Deploy
6. Compartir links:
   - General: `https://tu-app.vercel.app/`
   - Por región: `https://tu-app.vercel.app/?region=RM%20Oriente`
