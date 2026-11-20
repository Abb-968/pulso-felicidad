# El pulso de la felicidad mundial

**Proyecto 1** — Visualización de Datos (Universidad del Caribe)

## 👥 Integrantes
- Abigail Hernandez Contreras
- Jorge Enrique Soberanes Espinosa
- Diego Ángel Vázquez Contreras

## 📋 Descripción del proyecto
Dashboard interactivo de tipo **táctico** desarrollado en **React** (Vite + Recharts + React-Leaflet) para analizar el *World Happiness Report 2015-2024* (1,502 observaciones país-año en 165 países). El tablero permite explorar la evolución temporal del bienestar subjetivo y evaluar la relación entre el puntaje de felicidad y seis dimensiones socioeconómicas: PIB per cápita, apoyo social, esperanza de vida sana, libertad, generosidad y percepción de corrupción.

Incluye un pipeline reproducible de limpieza y auditoría en **Python**, almacenamiento relacional en **Supabase (PostgreSQL)** y despliegue web público.

🌐 **Dashboard en vivo:** [https://abb-968.github.io/pulso-felicidad/](https://abb-968.github.io/pulso-felicidad/)

## 📄 Documentación y entregables
- **Fase 1 — Limpieza, auditoría y análisis exploratorio:** [`docs/fase1-justificacion.pdf`](docs/fase1-justificacion.pdf)
- **Fase 2 — Diseño del dashboard, KPIs, paleta y wireframes:** [`docs/fase2-justificacion.pdf`](docs/fase2-justificacion.pdf)
- **Wireframes (baja y alta fidelidad):** [`docs/wireframes/`](docs/wireframes/) · [Prototipo interactivo en Figma](https://www.figma.com/design/5NYMm1rg8w5NMPPhFDwA35/wireframe_baja_fidelidad?node-id=0-1&t=SpvozdMFPId6RJAj-1)

## 📁 Estructura del repositorio
```text
pulso-felicidad/
├── README.md
├── data/
│   ├── raw/                        # 10 archivos CSV originales (2015-2024)
│   └── clean/                      # Dataset depurado (country_years_clean.csv)
├── analysis/                       # Script ETL y análisis estadístico (analisis_fase1.py)
├── sql/                            # Esquema de tablas para Supabase (schema.sql)
├── docs/                           # Documentación y entregables del proyecto
│   ├── fase1-justificacion.pdf     # Reporte técnico de la Fase 1
│   ├── fase2-justificacion.pdf     # Documento de diseño y justificación de la Fase 2
│   └── wireframes/                 # 10 vistas de Figma en baja y alta fidelidad (.png)
└── src/                            # Frontend en React (Fase 3)
