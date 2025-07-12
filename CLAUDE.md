# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with live reloading (both frontend and backend)
- `npm run dev:server` - Start only the backend server with live reloading
- `npm run dev:client` - Start only the frontend client with Vite dev server
- `npm run build` - Build for production (frontend with Vite, backend with esbuild)
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

### Database
- `npm run db:push` - Push database schema changes using Drizzle Kit
- `npm run db:seed` - Populate database with realistic sample data (~50 items)
- `npm run db:reset` - Clear database and reload with fresh sample data
- `npm run db:fresh` - Reset database and start development server
- Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Environment Setup
- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (defaults to 3000 in dev, 5000 in prod)
- `HOST` - Server host (defaults to localhost in dev, 0.0.0.0 in prod)
- `REUSE_PORT` - Set to 'false' to disable reusePort in production

## Architecture Overview

### Full-Stack Structure
This is a monorepo with three main directories:
- `client/` - React frontend with TypeScript, Vite, TanStack Query, shadcn/ui
- `server/` - Express.js backend with TypeScript, Drizzle ORM
- `shared/` - Common TypeScript types and Zod schemas

### Key Technologies
- **Frontend**: React 18, Wouter routing, TanStack Query, shadcn/ui components, Tailwind CSS
- **Backend**: Express.js, Drizzle ORM, Zod validation
- **Database**: PostgreSQL (Neon Database serverless)
- **Build**: Vite (frontend), esbuild (backend), tsx (development)

### Storage Layer Architecture
The backend uses an abstracted storage interface (`IStorage`) with:
- Current implementation: `MemStorage` (in-memory with default data)
- Designed for easy database integration via Drizzle ORM
- All data operations go through the storage layer for consistency

### Database Schema
Three main tables managed by Drizzle ORM:
- `devices` - Refrigerators and freezers
- `inventory_items` - Items with categories, quantities, expiration dates
- `settings` - Application configuration

### API Structure
RESTful API with `/api` prefix:
- `/api/devices` - Device management (CRUD)
- `/api/inventory` - Inventory item management (CRUD)  
- `/api/settings` - Application settings (read/write)
- All routes use Zod validation for request/response data

### Frontend State Management
- TanStack Query handles all server state and caching
- React Hook Form with Zod validation for form handling
- No global client state management beyond query cache

### Development Environment
- **Frontend HMR**: Vite provides instant hot module replacement for React components
- **Backend Live Reload**: tsx --watch automatically restarts server on file changes
- **API Logging**: Request logging middleware for debugging
- **Error Overlay**: Custom error modal for runtime errors
- **Replit Integration**: Specialized plugins for Replit development environment

### Component Structure
- `components/ui/` - shadcn/ui component library (30+ components)
- Custom components: Dashboard, AddItemModal, SettingsModal, InventoryTable
- All components use TypeScript with strict typing from shared schemas

### Path Aliases
- `@/` - Points to `client/src/`
- `@shared/` - Points to `shared/`
- `@assets/` - Points to `attached_assets/`

### Production Deployment
- Frontend builds to `dist/public/`
- Backend compiles to `dist/index.js`
- Single server serves both API and static files on port 5000
- Database migrations handled by Drizzle Kit

This is an inventory management system for tracking items across refrigerators and freezers with expiration date monitoring and dashboard analytics.

## Sample Data

The application includes realistic sample data for development:
- **~50 inventory items** across meat, fruits/vegetables, prepared meals, and cocktail categories
- **Smart device distribution** - frozen items in freezer, fresh items in refrigerator
- **Realistic expiration dates** - some items expire in 1-3 days, others in months/years
- **Date-aware generation** - calculates expiration dates from current date
- **Easy reset** - `npm run db:reset` clears and reloads fresh sample data

Sample data includes items like ground beef, chicken breasts, frozen vegetables, leftover meals, craft beer, and more with appropriate quantities and expiration windows.