# Copilot Context Playbook
## Sweet Shop Management System (AI Kata – TDD)

---

## 1. Purpose of This Document

This document defines the **context, constraints, and operating rules** for using GitHub Copilot (Agent Mode) while developing the Sweet Shop Management System.

It ensures:
- Clean architecture
- Test-Driven Development (TDD)
- Predictable AI-assisted output
- Full compliance with the AI Kata requirements
- Transparency and interview defensibility

GitHub Copilot is used strictly as a **pair programmer**, not an autonomous builder.

---

## 2. Project Context

### Project Goal
Build an **interview-grade full-stack Sweet Shop Management System** demonstrating:
- Backend API design  
- Authentication and authorization  
- Inventory-based business logic  
- Modern frontend UI/UX  
- Test-driven development  
- Responsible AI usage  

(Req: full-stack application with backend API, frontend SPA, and database)

### Target Audience
- Technical interviewers and reviewers  
- Non-technical end users (sweet shop owners)

---

## 3. Locked Technology Stack

### Backend
- Language: Python  
- Framework: FastAPI (Req: modern backend framework)  
- ORM: SQLAlchemy  
- Authentication: JWT (Req: token-based authentication)  
- Database:
  - SQLite (local)
  - PostgreSQL (production) (Req: real database; in-memory not allowed)  
- Testing: Pytest (Req: TDD with meaningful tests)

### Frontend
- Framework: React (Vite) (Req: modern SPA framework)
- Styling: Tailwind CSS  
- API Client: Axios  
- Server State: React Query  
- Icons: Lucide / Heroicons  

### Tooling
- IDE: VS Code  
- Version Control: Git + GitHub (Req: frequent commits with clear messages)  
- AI Tools: GitHub Copilot (Agent Mode), ChatGPT (Req: AI usage encouraged with transparency)  
- Design: Figma, Excalidraw  
- Deployment: Render / Railway, Vercel / Netlify (Optional brownie points)

---

## 4. Core User Roles

### User
- Register and log in (Req: user registration and login)
- Browse available sweets
- Search and filter sweets (Req: search by name, category, price)
- Purchase sweets (Req: purchase decreases quantity)

### Admin
- All User permissions
- Add new sweets (Req: POST /api/sweets)
- Update sweet details
- Delete sweets (Req: admin-only delete)
- Restock inventory (Req: admin-only restock)

Role-based access control is mandatory at:
- Backend (security enforcement)
- Frontend (UX clarity)

(Req: protected endpoints and admin-only operations)

---

## 5. Development Principles

1. **Human-in-the-loop**
   - All AI output must be reviewed and understood.

2. **Incremental Development**
   - Work proceeds in small, testable steps (Req: frequent, meaningful commits).

3. **Explainability**
   - Every line of code must be explainable in an interview.

4. **No Scope Creep**
   - Only features defined in the kata are implemented.

5. **Transparency**
   - AI usage is disclosed in commits and README (Req: mandatory AI usage disclosure).

---

## 6. Copilot Scope Guardrails

### Copilot MAY:
- Generate boilerplate code
- Suggest unit and integration tests
- Assist with refactoring
- Propose UI components
- Help debug errors

### Copilot MAY NOT:
- Skip writing tests (Req: TDD expectation)
- Implement features not explicitly requested
- Jump ahead in the task sequence
- Introduce new frameworks or libraries
- Mix business logic into routes or UI components

Any violation must be corrected immediately.

---

## 7. Mandatory Task Sequence

Copilot must follow this exact order (Req: structured development and TDD evidence):

1. Define user roles and core user journeys  
2. Design UX screens and interaction flow  
3. Select backend architecture and database schema  
4. Implement authentication and role-based access  
5. Build core domain entities and business logic  
6. Apply test-driven development for backend features  
7. Initialize frontend project and design system  
8. Integrate frontend with secured backend APIs  
9. Enhance UI with responsive and accessible design  
10. Add user feedback, loading, and error handling  
11. Deploy backend, frontend, and database  
12. Document setup, features, tests, and AI usage  

Skipping or reordering steps is not allowed.

---

## 8. Architecture Quality Standards

### Backend
- Routes are thin (Req: clean coding practices)
- Business logic resides in service layer
- Models contain no business logic
- Schemas validate all input/output
- JWT handled via dependencies
- Authorization checks are explicit

(Req: clean, maintainable, well-structured backend code)

### Frontend
- Pages, components, and services are separated
- API calls do not live inside UI components
- Reusable UI primitives
- Admin features clearly isolated
- Disabled purchase button when quantity is zero (Req: UI rule)
- Loading and empty states included

(Req: visually appealing, responsive UI)

---

## 9. Test-Driven Development Rules

TDD is mandatory and follows **Red → Green → Refactor** (Req: explicit TDD expectation).

Rules:
- Write failing tests before implementation
- Implement minimal code to pass tests
- Refactor without changing behavior
- No behavior exists without test coverage

Tests must cover:
- Authentication and login
- Authorization and admin-only routes
- Sweet CRUD operations
- Search functionality
- Inventory purchase and restock
- Zero-stock and failure scenarios

---

## 10. Git & Commit Policy

### Commit Rules
- One logical change per commit
- Clear, descriptive messages
- Commit history narrates development journey

(Req: clear Git usage and commit hygiene)

### AI Co-authorship
All commits involving AI assistance must include:

