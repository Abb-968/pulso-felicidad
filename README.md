# El pulso de la felicidad mundial

**Proyecto 1** — Visualización de Datos (Universidad del Caribe)

## 👥 Integrantes
- Abigail Hernandez Contreras
- Jorge Enrique Soberanes Espinosa
- Diego Ángel Vázquez Contreras

## 📋 Descripción del proyecto
Dashboard interactivo de tipo **táctico** desarrollado en **React** (Vite + Recharts + React-Leaflet) para analizar el *World Happiness Report 2015-2024* (1,502 observaciones país-año en 165 países y 10 regiones). El tablero permite explorar la evolución temporal del bienestar subjetivo (escala de Cantril 0–10) y evaluar la relación entre el puntaje de felicidad y seis dimensiones socioeconómicas: PIB per cápita, apoyo social, esperanza de vida sana, libertad, generosidad y percepción de corrupción.

Incluye un pipeline reproducible de limpieza y auditoría en **Python**, almacenamiento relacional en **Supabase (PostgreSQL)**, scripts automatizados de verificación de métricas y despliegue continuo en **GitHub Pages**.

🌐 **Dashboard en vivo:** [https://abb-968.github.io/pulso-felicidad/](https://abb-968.github.io/pulso-felicidad/)  
📝 **Encuesta de evaluación (Fase 4):** [Formulario de usabilidad](https://forms.gle/ZhmzYXrwg6MtB6zo7)

## 📄 Documentación y entregables
- **Fase 1 — Limpieza, auditoría y análisis exploratorio:** [`docs/fase1-justificacion.pdf`](docs/fase1-justificacion.pdf)
- **Fase 2 — Diseño del dashboard, KPIs, paleta y wireframes:** [`docs/fase2-justificacion.pdf`](docs/fase2-justificacion.pdf)
- **Fase 3 — Implementación funcional y arquitectura del dashboard:** [`docs/Fase3_Implementacion_Dashboard_Pulso_Felicidad.pdf`](docs/Fase3_Implementacion_Dashboard_Pulso_Felicidad.pdf)
- **Wireframes (baja y alta fidelidad):** [`docs/wireframes/`](docs/wireframes/) · [Prototipo interactivo en Figma](https://www.figma.com/design/5NYMm1rg8w5NMPPhFDwA35/wireframe_baja_fidelidad?node-id=0-1&t=SpvozdMFPId6RJAj-1)

## 📁 Estructura del repositorio
```text
pulso-felicidad/
├── .github/workflows/
│   └── deploy.yml                                          # Despliegue automático a GitHub Pages
├── README.md
├── analysis/
│   └── analisis_fase1.py                                   # Pipeline ETL y auditoría estadística (Python)
├── data/
│   ├── raw/                                                # 10 CSV originales (2015–2024) + combinado
│   └── clean/
│       └── country_years_clean.csv                         # Dataset depurado con banderas de auditoría
├── docs/
│   ├── fase1-justificacion.pdf                             # Reporte técnico de la Fase 1
│   ├── fase2-justificacion.pdf                             # Documento de diseño y KPIs de la Fase 2
│   ├── Fase3_Implementacion_Dashboard_Pulso_Felicidad.pdf  # Documentación técnica de la Fase 3
│   └── wireframes/                                         # 10 vistas en baja y alta fidelidad (.png)
├── scripts/
│   ├── generate-happiness-json.py                          # Generador de dataset optimizado para frontend
│   ├── verify-metrics.mjs                                  # Validación automatizada de KPIs y modelos
│   └── verify-phase1-phase2.mjs                            # Pruebas de integridad de datos
├── sql/
│   └── schema.sql                                          # Esquema relacional para Supabase (PostgreSQL)
├── src/
│   ├── components/                                         # Vistas y gráficos (Panorama, Factors, CountryView, DataNotes, MapChart, etc.)
│   ├── data/happiness.json                                 # Datos procesados consumidos por React
│   ├── utils/                                              # Catálogo ISO en español, formateo y cálculos métricos
│   ├── App.jsx                                             # Enrutamiento de vistas y estado global de filtros
│   └── dashboard.css                                       # Estilos y tokens de la paleta «Sol y Horizonte»
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Ejecución local
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```
