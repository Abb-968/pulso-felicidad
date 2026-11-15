# El pulso de la felicidad mundial

**Equipo 1** | **Proyecto 1** — Visualización de Datos (Universidad del Caribe)

## 👥 Integrantes
- Abigail Hernandez Contreras
- Jorge Enrique Soberanes Espinosa
- Diego Ángel Vázquez Contreras

## 📋 Descripción del proyecto
Dashboard interactivo de tipo **táctico** desarrollado en **React** (Vite + Recharts) para analizar el *World Happiness Report 2015-2024* (1,502 observaciones país-año en 165 países). El tablero permite explorar la evolución temporal del bienestar subjetivo y evaluar la relación entre el puntaje de felicidad y seis dimensiones socioeconómicas: PIB per cápita, apoyo social, esperanza de vida sana, libertad, generosidad y percepción de corrupción.

Incluye un pipeline reproducible de limpieza y auditoría en **Python**, almacenamiento relacional en **Supabase (PostgreSQL)** y despliegue web público.

## 📁 Estructura del repositorio
```text
pulso-felicidad/
├── README.md
├── data/
│   ├── raw/            # 10 archivos CSV originales (2015-2024)
│   └── clean/          # Dataset depurado (country_years_clean.csv)
├── analysis/           # Script ETL y análisis estadístico (analisis_fase1.py)
├── sql/                # Esquema de tablas para Supabase (schema.sql)
├── docs/               # Documentación del proyecto (fase1-justificacion.pdf)
└── src/                # Frontend en React (Fase 3)
