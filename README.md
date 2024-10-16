# Caddy Web UI

> [!IMPORTANT]
> This repo is currently in a heavy WIP. Application still not working properly, but I am on my way to give it a proper life.
>
> Thank you for the attention.
>
> Best,
> Artem 🫶

A web-based UI to manage multiple [Caddy](https://caddyserver.com/) instances using a modern stack, including:

- **Backend**: Go (Golang) with Gin, and BadgerDB as the NoSQL key-value store.
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui.
- **Database**: Embedded BadgerDB for lightweight NoSQL storage.
- **Deployment**: Docker, Docker Compose, GitHub Package Registry.

## Features

- Manage multiple Caddy instances via the Caddy Admin API.
- Add, list, and delete Caddy instances.
- View real-time status of Caddy instances.
- Fully containerized with Docker for easy deployment.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Frontend Overview](#frontend-overview)
- [Contributing](#contributing)

---

## Tech Stack

| Technology    | Description                                    |
| ------------- | ---------------------------------------------- |
| **Go**        | Backend API, uses Gin for routing              |
| **BadgerDB**  | Key-value NoSQL database for storing instances |
| **React**     | Frontend, UI built with Vite and TailwindCSS   |
| **shadcn/ui** | Modern UI component library for React          |
| **Docker**    | Containerized backend and frontend             |
| **Caddy**     | Reverse proxy and web server                   |

---

## Prerequisites

Before you can run the project, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)
- [Go](https://golang.org/doc/install) (for local development)

For development on your MacBook Pro (M3 Pro), ensure you have:

- [Homebrew](https://brew.sh/) installed.
- [Vite](https://vitejs.dev/) (for frontend) and [Node.js](https://nodejs.org/en/) for package management.

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/caddy-web-ui.git
cd caddy-web-ui
```

### Backend Setup

1. **Install Go Modules**:

   ```bash
   cd backend
   go mod tidy
   ```

2. **Run the Backend** (for local development):

   ```bash
   go run main.go
   ```

   This will start the backend server on `http://localhost:8080`.

### Frontend Setup

1. **Install Frontend Dependencies**:

   Via npm (you should already have Node.js installed):

   ```bash
   cd frontend
   npm install
   ```

2. **Run the Frontend** (for local development):

   ```bash
   npm run dev
   ```

   This will start the frontend on `http://localhost:3000`.

### Docker Setup

1. **Build Docker Images**:

   ```bash
   docker-compose build
   ```

2. **Run the Application**:

   ```bash
   docker-compose up
   ```

   This will start both the backend and frontend, accessible at:

   - **Frontend**: `http://localhost:3000`
   - **Backend**: `http://localhost:8080`

---

## Running the Project

### Running with Docker Compose

```bash
docker-compose up --build
```

- The frontend runs by default on `http://localhost:3000`.
- The backend API is available at `http://localhost:8080`.

You can modify the `docker-compose.yml` file to suit your needs (e.g., change ports or add services).

---

## API Endpoints

### List of Available API Endpoints:

| Method | Endpoint                | Description                       |
| ------ | ----------------------- | --------------------------------- |
| GET    | `/instances`            | Get list of all Caddy instances   |
| POST   | `/instances`            | Add a new Caddy instance          |
| DELETE | `/instances/:id`        | Remove a Caddy instance           |
| GET    | `/instances/:id/status` | Get status of a specific instance |

### Example: Add a New Caddy Instance

```bash
POST /instances
```

**Request Body**:

```json
{
  "name": "contabo-main",
  "url": "http://contabo-main:2019"
}
```

---

## Frontend Overview

The frontend is built using React, Vite, TailwindCSS, and shadcn/ui for UI components.

### Key Features:

- **Dashboard**: Displays a list of all connected Caddy instances.
- **Add Caddy Instance**: Form to add a new instance with its URL and name.
- **Instance Status**: View real-time status (online/offline) of each instance.

### Available Scripts

In the `frontend` directory, you can run:

- **`npm run dev`**: Runs the app in development mode.
- **`npm run build`**: Builds the app for production.
- **`npm run preview`**: Preview the build of the app.

---

## Contributing

Contributions are welcome! If you'd like to contribute, please follow the steps below:

1. **Fork the repository**.
2. **Create a new branch** (e.g., `feature/new-feature`).
3. **Commit your changes**.
4. **Push to your branch**.
5. **Open a pull request**.

Please make sure to follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
