# CloudHDL

CloudHDL is a web-based Verilog development and simulation environment that runs hardware designs in isolated Docker containers and visualizes digital waveforms directly in the browser.

---

## Key Features

- **JWT Authentication**: User signup and login with hashed passwords (`bcrypt`) and token-based API authentication (`jsonwebtoken`).
- **Project Management**: Create, list, and open HDL projects with associated metadata.
- **Multi-File Verilog Editor**: Browser-based Monaco code editor supporting tabbed navigation between design (`design.v`) and testbench (`testbench.v`) files.
- **File Persistence**: Create and save file updates to the database with dirty state tracking and `Ctrl+S` keyboard shortcuts.
- **Docker-Isolated Simulation**: Runs simulations in sandboxed Docker containers running Icarus Verilog (`iverilog` and `vvp`) with bounded memory (`128MB`), CPU limits (`0.5`), and disabled network access (`--network none`).
- **Real VCD Output & Parsing**: Captures actual Value Change Dump (VCD) output from the simulation run and parses signal definitions, timestamps, and state transitions.
- **Interactive Waveform Viewer**: Custom SVG-based digital waveform viewer rendering square-wave transitions across time axes with time-hover indicators.
- **Simulation Console & Error Reporting**: Displays compiler (`iverilog`) stdout/stderr and runtime diagnostics when simulations succeed or encounter errors.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                │
│   (Auth, Dashboard, Monaco Editor, SVG Waveform Viewer) │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / JSON (Axios)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Express.js REST API                   │
│         (/api/auth, /api/projects, /api/simulate)       │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────┐ ┌─────────────────────────┐
│      Prisma ORM (v7)        │ │    Docker Container     │
│   PostgreSQL Database       │ │  (Icarus Verilog + VVP) │
│ (Users, Projects, Files,    │ │  Isolated temp mounts,  │
│      Simulation Runs)       │ │  output.vcd generation  │
└─────────────────────────────┘ └─────────────────────────┘
```

1. **Client Layer**: A single-page React application built with Vite that manages authentication state, project files, editor tabs, and waveform rendering.
2. **API Layer**: An Express.js backend handling user authentication, project/file CRUD operations, and simulation orchestration.
3. **Database Layer**: PostgreSQL managed through Prisma ORM using `@prisma/adapter-pg` storing user records, project files, and historical simulation runs.
4. **Execution Layer**: Isolated ephemeral Docker containers running `iverilog` and `vvp` on mounted temporary scratch directories to compile and execute Verilog code safely without network access.

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite
- **Routing**: React Router DOM (v7)
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **HTTP Client**: Axios
- **Visualization**: Custom SVG digital waveform renderer

### Backend
- **Runtime**: Node.js (v24 LTS / ES modules & CommonJS)
- **Web Framework**: Express.js
- **ORM & Database**: Prisma ORM (v7), PostgreSQL (Neon) with `@prisma/adapter-pg`
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcrypt`
- **Simulation Sandbox**: Docker, Icarus Verilog (`iverilog`, `vvp`)

---

## Project Structure

```
WAVEFORGE/
├── cloudhdl-backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js       # Signup and login logic
│   │   │   ├── fileController.js       # File CRUD and ownership verification
│   │   │   ├── projectController.js    # Project CRUD and file inclusion
│   │   │   └── simulateController.js   # Simulation flow and result recording
│   │   ├── middleware/
│   │   │   └── authMiddleware.js       # JWT validation middleware
│   │   ├── routes/
│   │   │   ├── auth.js                 # /api/auth routes
│   │   │   ├── projects.js             # /api/projects routes
│   │   │   └── simulate.js             # /api/simulate route
│   │   ├── utils/
│   │   │   ├── fileHelpers.js          # Temporary directory creation and cleanup
│   │   │   ├── prismaClient.js         # Prisma client instance with pg adapter
│   │   │   └── simulator.js            # Docker command execution and VCD extraction
│   │   ├── app.js                      # Express app and route configuration
│   │   └── server.js                   # Server entry point
│   ├── prisma/
│   │   └── schema.prisma               # Prisma data models
│   ├── dockerfile                      # Ubuntu-based Icarus Verilog container
│   ├── prisma.config.ts                # Prisma 7 configuration
│   └── package.json
│
├── cloudhdl-frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js               # Axios client with auth interceptor
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx          # Monaco editor wrapper
│   │   │   ├── FileTabs.jsx            # Multi-file tab selector
│   │   │   ├── ProjectList.jsx         # Project grid cards
│   │   │   ├── RunButton.jsx           # Simulation trigger button
│   │   │   └── WaveformViewer.jsx      # SVG waveform renderer
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # React authentication state context
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx       # Project listing and creation modal
│   │   │   ├── EditorPage.jsx          # Main IDE workspace
│   │   │   ├── LoginPage.jsx           # Sign in page
│   │   │   └── SignupPage.jsx          # Account registration page
│   │   ├── utils/
│   │   │   └── vcdParser.js            # VCD parser for digital signal transitions
│   │   ├── App.jsx                     # Application routes
│   │   ├── index.css                   # Global styles
│   │   └── main.jsx                    # React root entry point
│   └── package.json
│
└── README.md
```

---

## Local Setup Instructions

### Prerequisites
- **Node.js**: v24 (LTS)
- **WSL2 / Linux environment**: Ubuntu (recommended for Windows users)
- **Docker Desktop**: Running with WSL2 integration enabled
- **PostgreSQL Database**: Accessible PostgreSQL instance (e.g. Neon)

### 1. Build the Docker Simulator Image

From the `cloudhdl-backend` directory, build the sandbox Docker image:

```bash
cd cloudhdl-backend
docker build -t cloudhdl-simulator .
```

### 2. Backend Setup

1. Install dependencies:
   ```bash
   cd cloudhdl-backend
   npm install
   ```
2. Create a `.env` file in `cloudhdl-backend/` with your environment variables:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
   JWT_SECRET="your-jwt-secret"
   PORT=5000
   ```
3. Push the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```

### 3. Frontend Setup

Install frontend dependencies:

```bash
cd ../cloudhdl-frontend
npm install
```

---

## Running the Application

### Start Backend Server

From `cloudhdl-backend/`:

```bash
npm run dev
# or: node src/server.js
```
The API server starts on `http://localhost:5000`.

### Start Frontend Client

From `cloudhdl-frontend/`:

```bash
npm run dev
```
The Vite development server starts on `http://localhost:5173`.

---

## Demo User Flow

1. **Sign Up / Login**: Register a new user or log in to obtain a JWT session.
2. **Create Project**: On the dashboard, click **+ New Project** and enter a title. A starter `design.v` and `testbench.v` are created automatically.
3. **Edit Verilog**: In the IDE, switch between the `design.v` and `testbench.v` tabs and make code edits in the Monaco editor.
4. **Save**: Click **Save** (or press `Ctrl+S`) to persist changes to the database.
5. **Run Simulation**: Click **Run Simulation**.
6. **Docker Execution**: The backend saves the files into a temporary directory, runs `iverilog` and `vvp` inside the sandboxed `cloudhdl-simulator` Docker container, and cleans up the temporary directory.
7. **Waveform Visualization**: The real `output.vcd` generated by the testbench is parsed and rendered in the browser as interactive SVG digital waveforms alongside the simulation console output.

---

## Security & Configuration Note

Application secrets (such as `DATABASE_URL` and `JWT_SECRET`) are loaded at runtime through environment variables (`.env`) and are excluded from source control via `.gitignore`. Simulations execute inside isolated Docker containers with non-root user permissions, memory and CPU constraints, and disabled network access (`--network none`).