🍬 Sweet Shop Management System

A full-stack Sweet Shop Management System built with FastAPI + React (Vite) that allows customers to browse and purchase sweets, and enables admins to manage inventory entirely from the frontend.

This project was designed, implemented, tested, and deployed as a production-ready system, with clear role separation, authentication, admin controls, and real-world deployment practices.

🔗 Live Deployments
🌐 Frontend (Vercel)

👉 Live App:
https://sweet-shop-management-system-psi.vercel.app

⚙️ Backend API (Render)

👉 API Base URL:
https://sweet-shop-management-system-6tyn.onrender.com

👉 Swagger Docs:
https://sweet-shop-management-system-6tyn.onrender.com/docs

📸 Screenshots (Add Here)

Add screenshots directly in this section for GitHub preview

![Home Page](screenshots/home.png)
![Dashboard](screenshots/dashboard.png)
![Admin Panel](screenshots/admin.png)
![Login Page](screenshots/login.png)


(Create a /screenshots folder in the repo and drop images there.)

🚀 Features
👥 User Features

Browse available sweets

Search sweets by name

View prices in ₹ INR

Purchase sweets (stock-aware)

Authentication (login & register)

🛠️ Admin Features (Frontend Only)

Add new sweets

Restock existing sweets

Update prices of sweets

Delete sweets from inventory

All admin actions protected by role-based access

⚠️ Admins do not need backend access — everything is handled via UI.

🧱 Tech Stack
Frontend

React (Vite)

Axios

Tailwind CSS

Role-based routing

Deployed on Vercel

Backend

FastAPI

SQLAlchemy

PostgreSQL (Render)

JWT Authentication

Pytest (unit & integration tests)

Deployed on Render

📂 Project Structure
sweet-shop-management-system/
│
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entrypoint
│   │   ├── crud.py          # Database operations
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py          # JWT & auth logic
│   │   ├── seed.py          # Deployment-safe seed data
│   │   └── tests/           # Pytest test cases
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Home, Dashboard, Admin, Auth
│   │   ├── services/        # API service layer
│   │   ├── components/
│   │   ├── utils/
│   │   └── styles/
│   └── vite.config.js
│
└── README.md

🔐 Authentication & Roles

JWT-based authentication

Roles:

user → browse & purchase

admin → full inventory control

Role enforcement on backend + UI guards on frontend

🧪 Testing

Backend is fully tested using pytest:

Auth flows

Inventory operations

Admin-only permissions

Price update & delete behavior

Run locally:

pytest app/tests -v

🌱 Deployment-Safe Seed Data

Initial sweets are seeded automatically on first deploy

Seed logic:

Runs once

Skips if data already exists

Safe for Render redeployments

This ensures the dashboard is never empty in production.

🤖 AI Involvement (Transparency)

AI tools (ChatGPT + GitHub Copilot) were used as engineering assistants, not as code generators.

How AI Was Used

Architectural guidance (FastAPI + React separation)

Debugging deployment issues (Render, Vercel, CORS)

Generating test case ideas

Refining prompts and workflows

How AI Was NOT Used

No blind copy-paste

No auto-generated business logic

All final decisions, fixes, and integrations were manually reviewed and implemented

This project reflects human-led engineering with AI assistance, similar to modern industry workflows.

📌 Production Notes

Proper CORS handling for Vercel ↔ Render

Environment-safe configuration

Backend exposed only via API

Frontend handles all admin operations securely

👤 Author

Mrityunjay Chauhan
Computer Science & Engineering (AI & ML)
Full-Stack | FastAPI | React | SQL | Cloud Deployment

📬 Feedback / Improvements

If you’re a recruiter or reviewer and have feedback, suggestions, or questions — feel free to raise an issue or reach out.
