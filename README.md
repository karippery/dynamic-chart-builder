# KPI Dashboard - Industrial Safety Analytics Platform

## Overview

**KPI Dashboard** is a comprehensive data analytics application that visualizes industrial safety and performance metrics from raw detection data. This Dockerized solution processes CSV files containing detections of humans, vehicles, pallet trucks, and AGVs to compute and visualize critical safety insights through an intuitive single-page application.

### Key Features
- **Interactive Dashboard** with multiple chart types and data visualizations
- **Advanced Filtering** with preset saving capabilities
- **Data Export** - CSV export from tables
- **Live Mode** for real-time data monitoring
- **Local Storage** for dashboard presets and configurations
- **Pagination** for efficient data browsing
- **Summary Cards** for quick metric overview

### Safety Metrics & Insights
- **Human–vehicle close calls** within defined distances
- **Overspeeding events** by class, area, or time range
- **Vest violations** by class or zone
- **Dwell time analysis** and risky area identification
- **Near-miss density** heatmaps

### User Capabilities
- Select metrics (count, unique IDs, average speed, etc.)
- Apply flexible filters (time, class, vest, speed, heading, zones)
- Group results by time bucket, class, zone, or ID
- Choose from various chart types (bar, line, area, heatmap)
- Save and share KPI presets

## Technology Stack

### Backend Services
- **Django & Django REST Framework** - Python web framework & API
- **Poetry** - Python dependency management
- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching and session storage
- **PgAdmin 8** - Database administration
- **Swagger/OpenAPI** - API documentation

### Frontend Application
- **React 19.2.0** - Modern UI framework
- **TypeScript 4.9.5** - Type safety and development experience
- **Material-UI (MUI) v7** - Comprehensive component library
- **Chart.js 4.5.1 + react-chartjs-2** - Data visualization
- **npm** - Package management

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **React Scripts 5.0.1** - Build tools and development server

## Prerequisites

### Required Tools
1. **Docker** (version 20.10+ recommended)
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
2. **Docker Compose** (usually included with Docker Desktop)
3. **Git** - for version control

### Verification
```bash
docker --version
docker-compose --version
git --version
```

## Quick Start

### Step 1: Clone & Setup
```bash
git clone <your-repository-url>
cd <project-directory>
```

### Step 2: Environment Configuration
Create a `.env` file in the root directory use .env.sample both backend and frontend:

```bash
.env
frontend\.env
```

### Step 3: Launch Application
```bash
# Start all services
docker-compose up -d

# Monitor logs
docker-compose logs -f
```

### Step 4: Access Services
| Service | URL | Purpose |
|---------|-----|---------|
| **Dashboard** | http://localhost:3000 | Main KPI Dashboard |
| **Backend API** | http://localhost:8000 | Django REST API |
| **API Docs** | http://localhost:8000/api/swagger/ | Interactive API Documentation |
| **Database Admin** | http://localhost:5050 | PgAdmin Management |
| **PostgreSQL** | localhost:5432 | Database Server |
| **Redis** | localhost:6379 | Caching Service |

## Data Population

### Import Real Detection Data
```bash
# Import from CSV file (located at csv_file/work-package-raw-data.csv)
docker-compose exec web python manage.py import_detections
```

### Generate Test Data
```bash
# Create synthetic close-call data for testing
docker-compose exec web python manage.py generate_fake_close_calls
```
##### (Recommended) Run both commands for comprehensive dataset


## API Endpoints

### Core Dashboard APIs
- `GET /api/aggregate/` - Overall KPI aggregates and summary statistics
- `GET /api/close-calls/` - Close-call specific metrics and trends
- `GET /api/overspeed-events/` - Overspeed violation analytics
- `GET /api/vest-violations/` - PPE compliance data

### API Documentation
- **Swagger UI**: http://localhost:8000/api/swagger/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## Dashboard Features

### Visualization Components
- **Summary Cards**: Key metrics at a glance
- **Interactive Charts**: Bar and line visualizations
- **Data Tables**: Paginated results with filtering
- **Export Functionality**: CSV export for all table data

### Filtering & Presets
- **Live Filtering**: Real-time data filtering
- **Preset Management**: Save and load filter configurations
- **Local Storage**: Automatic saving of dashboard state
- **Multi-dimensional Filtering**: Time, class, location, and behavioral filters


## Demo


