## KPI Dashboard

**KPI Dashboard** (formerly *Dynamic Chart Builder*) is a data analytics application that helps visualize industrial safety and performance metrics from raw detection data. It allows users to define flexible KPIs, apply filters, and view results in interactive charts and tables.

The system processes CSV files containing detections of humans, vehicles, pallet trucks, and AGVs. It computes and visualizes insights such as:

* Human–vehicle close calls within a defined distance
* Overspeeding events by class, area, or time range
* Vest violations by class or zone
* Dwell time and risky areas based on near-miss density

Users can:

* Select metrics (e.g., count, unique IDs, average speed)
* Apply filters (time, class, vest, speed, heading, zones)
* Group results (by time bucket, class, zone, or ID)
* Choose chart types (bar, line, area, heatmap, etc.)
* Save and share KPI presets


This is a full-stack web application with a React frontend and Django backend, containerized using Docker. The application features data visualization, form handling, and PDF generation capabilities.

## Technology Stack

### Frontend Technologies
- **React 19.2.0** - UI framework
- **TypeScript 4.9.5** - Type safety
- **Material-UI (MUI) v7** - Component library
- **Charting & Visualization**
  - Chart.js 4.5.1 with react-chartjs-2
  - D3.js (d3-array, d3-scale, d3-shape)





### Backend Technologies
- **Django** - Python web framework
- **PostgreSQL 15** - Database
- **Redis 7** - Caching
- **PgAdmin 8** - Database management

### Development & Deployment
- **Docker & Docker Compose** - Containerization
- **React Scripts 5.0.1** - Build tools
- **Create React App** - Project setup

## Prerequisites

Before starting, ensure you have the following installed:

### Required Tools
1. **Docker** (version 20.10+ recommended)
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
2. **Docker Compose** (usually included with Docker Desktop)
3. **Node.js** (version 18+ for local development) - *Optional*
4. **Git** - for version control

### Verify Installation
```bash
docker --version
docker-compose --version
git --version
```

## Project Setup

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd <project-directory>
```

### Step 2: Environment Configuration


### Step 3: Start the Application

#### Option A: Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option B: Local Development (Frontend Only)
```bash
cd frontend
npm install
npm run dev
```

## Accessing Services

After starting the application, access these services:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main React application |
| **Backend API** | http://localhost:8000 | Django REST API |
| **PgAdmin** | http://localhost:5050 | Database management |
| **PostgreSQL** | localhost:5432 | Database server |
| **Redis** | localhost:6379 | Caching service |

## Development Workflow

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Backend Development
The Django backend automatically handles migrations and starts the development server when using Docker Compose.

### Database Management
1. Access PgAdmin at http://localhost:5050
2. Login with credentials from your `.env` file

## Useful Docker Commands

```bash
# Check running containers
docker ps

# View logs for specific service
docker-compose logs frontend
docker-compose logs web

# Restart specific service
docker-compose restart frontend

# Rebuild containers (after dependency changes)
docker-compose up --build

# Stop and remove containers, networks
docker-compose down

# Remove volumes (warning: deletes data)
docker-compose down -v
```


```




