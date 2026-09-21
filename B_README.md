# Persona-Based Automation Platform

> **Enterprise-grade automation platform following High-Level Design (HLD) principles**

An advanced, persona-based automation system that streamlines the entire software engineering lifecycle from requirements analysis through deployment and closure. Built with production-ready architecture and industry best practices.

## 🏗️ Architecture Highlights

✅ **Layered Architecture** - Controllers → Services → Repositories → Database  
✅ **SOLID Principles** - Single responsibility, proper abstraction, dependency inversion  
✅ **Comprehensive Error Handling** - Custom error classes, global error middleware  
✅ **Security First** - Helmet, CORS, rate limiting, input validation  
✅ **Production Logging** - Winston with structured logs, file rotation  
✅ **Database Pooling** - PostgreSQL with transaction support  
✅ **API Versioning** - `/api/v1/*` with backward compatibility  
✅ **Type Safety** - Full TypeScript with strict mode  
✅ **Graceful Shutdown** - Clean connection management  

📖 **See [ARCHITECTURE.md](ARCHITECTURE.md) for complete technical documentation**

---

## 🎯 Project Overview

This project automates the software engineering process using a persona-based system. It covers:
- Requirement Analysis
- Development  
- Testing
- Deployment
- Closure

## Tech Stack
- **Frontend**: Next.js (React, TypeScript, Tailwind CSS)
- **Backend**: Node.js (TypeScript, Express)
- **Database**: PostgreSQL with connection pooling
- **AI Integration**: GitHub Copilot (via GitHub CLI)
- **GitHub Operations**: GitHub CLI (`gh`)
- **Automation**: Open-source AI/ML libraries
- **Orchestration**: Docker
- **Logging**: Winston with structured logging
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, rate limiting

## Enterprise Integrations
✅ **Azure DevOps (ADO)** - Pre-configured for P&G (`https://dev.azure.com/pg-consumer`)  
✅ **GitHub** - Pre-configured for P&G (`https://github.com/procter-gamble/`)  
✅ **Jira** - Optional integration for agile teams  
✅ **Figma** - Design collaboration for UI/UX persona  

**📘 See [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) for complete P&G setup instructions**

## Key Features
✅ **9 Specialized AI Personas** (Analyst, PM, Architect, Dev, QA, Sprint Master, Designer, Code Reviewer, Brainstormer)  
✅ **GitHub Automation** - Dev agent creates branches, files, and PRs automatically  
✅ **GitHub CLI Integration** - All GitHub operations use native CLI  
✅ **Real-time AI Chat** - Powered by GitHub Copilot CLI  
✅ **Automated Testing** - Playwright/Cypress integration for QA  
✅ **Dynamic Workflows** - Configure ADO, Jira, GitHub, Figma at runtime  
✅ **RESTful API** - Versioned endpoints with comprehensive error handling  
✅ **Health Monitoring** - Kubernetes-ready health check endpoints  
✅ **Request Retry Logic** - Automatic retry with exponential backoff  
✅ **Production Security** - Multiple layers of security middleware  

## Prerequisites
1. **Node.js** (v18+)
2. **PostgreSQL** (v13+) - Optional, in-memory store available for development
3. **GitHub CLI** - [Install](https://cli.github.com/)
4. **GitHub Copilot Extension** - `gh extension install github/gh-copilot`
5. **GitHub Authentication** - `gh auth login`

## Project Structure
```
persona-based-automation/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Configuration (env, database)
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Error, validation, security
│   │   ├── models/         # Data models & types
│   │   ├── routes/         # API routing
│   │   ├── utils/          # Utilities (logger)
│   │   └── index.ts        # Application entry point
│   ├── .env.example        # Environment template
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── pages/              # Next.js pages
│   ├── components/         # Reusable components
│   ├── lib/                # API client with retry logic
│   ├── types/              # TypeScript definitions
│   └── package.json
├── database/               # SQL scripts & migrations
│   └── schema.sql
├── ARCHITECTURE.md         # Detailed architecture documentation
├── .gitignore
└── README.md
```

## Getting Started

### 1. Environment Configuration
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**
```bash
# Server
PORT=4100
NODE_ENV=development

# Database (optional for development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=persona_automation
DB_USER=postgres
DB_PASSWORD=your_password

# GitHub (optional)
GITHUB_TOKEN=your_github_token
GITHUB_ORG=your_org
GITHUB_REPO=your_repo

# Security
CORS_ORIGIN=http://localhost:3000
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Setup GitHub CLI
```bash
# Install GitHub CLI (if not installed)
gh --version

# Install Copilot extension
gh extension install github/gh-copilot

# Authenticate
gh auth login
```

### 3. Start Servers
```bash
# Backend (from backend folder)
npx ts-node src/index.ts
# Server runs on http://localhost:4100

# Frontend (from frontend folder)
npm run dev
# App runs on http://localhost:3000
```

### 4. Configure Integrations
Navigate to the app and configure your integrations (ADO, Jira, GitHub, Figma) through the UI.

## GitHub CLI Integration
See [GITHUB_CLI_INTEGRATION.md](./GITHUB_CLI_INTEGRATION.md) for:
- Setup instructions
- API endpoints
- Usage examples
- Troubleshooting

## Note
All tools and libraries used are free and open-source.
