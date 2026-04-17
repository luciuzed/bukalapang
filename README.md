# MainYuk!

Sports field booking platform with two roles:
- User: browse venues, book slots, pay, and track booking status.
- Business/Admin: manage venues, courts, slots, and monitor bookings/revenue.

<a id="readme-top"></a>

## About The Project

![MainYuk Header](front-end/src/assets/header.png)

MainYuk! is a full-stack web app for sports venue reservations.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built With

### Frontend

[![React][React.js]][React-url]
[![Vite][Vite.js]][Vite-url]
[![TailwindCSS][TailwindCSS]][TailwindCSS-url]
[![React Router][ReactRouter]][ReactRouter-url]

### Backend

[![Node.js][Node.js]][Node-url]
[![Express][Express.js]][Express-url]
[![MySQL][MySQL]][MySQL-url]
[![Resend][Resend]][Resend-url]

### Infrastructure

[![Docker][Docker]][Docker-url]
[![Nginx][Nginx]][Nginx-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Structure

```text
.
|- docker-compose.yml
|- back-end/
|  |- server.js
|  |- config/database.js
|  |- routes/
|  |  |- auth.js
|  |  |- booking.js
|  |  |- court.js
|  |  |- field.js
|  |  |- upload.js
|  |- utils/otp.js
|- front-end/
|  |- src/
|  |  |- App.jsx
|  |  |- config/api.js
|  |  |- page/
|- dev-storage/
|  |- uploads/
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop (optional, for containerized run)

### Environment Variables

Create a root `.env` file (same level as `docker-compose.yml`) and configure:

```env
# Backend
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

# Optional if you run backend in Docker without this compose file
DB_HOST_DOCKER=host.docker.internal

# Upload storage path (optional)
UPLOADS_DIR=

# Required for OTP email sending
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=verified_sender@yourdomain.com

# Optional contact form receiver (defaults to mainyuk@gmail.com)
CONTACT_TO=mainyuk@gmail.com

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

Notes:
- OTP sending depends on `RESEND_API_KEY` and `RESEND_FROM`.
- Uploaded images are served from `/uploads` and stored in `dev-storage/uploads` by default.

### Database Requirements

This repository does not include migration/seed SQL files. The app expects these tables to exist:
- `user`
- `admin`
- `field`
- `court`
- `field_slot`
- `booking`
- `booking_slot`
- `payment`

You can create all required tables with one command (run this after the database container is up):

```bash
docker compose exec backend npm run db:setup
```

Alternative from host machine (outside containers):

```bash
cd back-end
npm run db:setup
```

The setup script is in `back-end/setup-database.js` and is manual-only (it is not run automatically by `npm start` or `npm run dev`).

### Local Development

1. Install backend dependencies
	```bash
	cd back-end
	npm install
	```
2. Install frontend dependencies
	```bash
	cd ../front-end
	npm install
	```
3. Run backend (dev mode)
	```bash
	cd ../back-end
	npm run dev
	```
4. Run frontend
	```bash
	cd ../front-end
	npm run dev
	```
5. Open the frontend URL shown by Vite (default: `http://localhost:5173`)

### Run with Docker Compose

From repository root:

```bash
docker compose up --build
```

This starts frontend, backend, and a local MySQL container for contributor convenience. The MySQL container is intended for local/dev usage only, not as a production deployment database.

If your database schema has not been initialized yet, run:

```bash
docker compose exec backend npm run db:setup
```

Default exposed ports:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000`
- MySQL: `localhost:3306`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## API Overview

Base URL:
- Local: `http://localhost:5000/api`
- Docker: `http://localhost:5000/api` (host machine access)

Main route groups currently used by frontend:
- Auth: `/register`, `/register-business`, `/login`, `/login-business`, `/resend-otp`, `/verify-otp`
- Fields public/admin: `/fields-public`, `/fields`, `/field`
- Courts: `/courts/:fieldId`
- Bookings/payments: `/bookings/*`
- Uploads: `/uploads`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Frontend Routes

Public/user-facing routes currently defined:
- `/venue`, `/venues`
- `/venue/:id`, `/venues/:id`
- `/login`
- `/payment/:paymentId` (user protected)
- `/booking-history` (user protected)
- `/user/security-info` (user protected)

Admin routes currently defined:
- `/dashboard` (admin protected)
- `/field` (admin protected)
- `/booking` (admin protected)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Scripts

### Backend (`back-end/package.json`)

- `npm start` - run with Node
- `npm run dev` - run with Nodemon
- `npm run db:setup` - create required MySQL tables

### Frontend (`front-end/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Credits

- Best README template inspiration: Othneil Drew
- Shields badges: https://shields.io

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[ReactRouter]: https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white
[ReactRouter-url]: https://reactrouter.com/

[Node.js]: https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[Express.js]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[MySQL]: https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white
[MySQL-url]: https://www.mysql.com/
[Resend]: https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white
[Resend-url]: https://resend.com/

[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
[Nginx]: https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white
[Nginx-url]: https://nginx.org/
