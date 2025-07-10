# Inventory Management System

## Overview

This is a full-stack inventory management system built with React, Express, and PostgreSQL. The application helps users track inventory items across different devices (refrigerators and freezers), managing expiration dates, categories, and quantities. It features a modern UI built with shadcn/ui components and provides real-time inventory tracking with dashboard analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas for request/response validation
- **Storage**: Abstracted storage interface with both in-memory and database implementations
- **Development**: Hot module replacement and error overlay via Vite integration

### Database Schema
The application uses three main tables:
- `devices`: Stores refrigerator/freezer information
- `inventory_items`: Tracks individual inventory items with expiration dates
- `settings`: Stores application configuration

## Key Components

### Frontend Components
- **Dashboard**: Main interface showing inventory statistics and item management
- **Add Item Modal**: Form for adding new inventory items
- **Settings Modal**: Device management interface
- **Inventory Table**: Displays and manages inventory items with filtering
- **Search Section**: Search and filter inventory items

### Backend Components
- **Storage Layer**: Abstracted interface supporting both in-memory and database storage
- **Route Handlers**: RESTful API endpoints for devices, inventory, and settings
- **Schema Validation**: Zod schemas ensuring data integrity
- **Database Migrations**: Drizzle-based schema management

### Shared Components
- **Schema Definitions**: Shared TypeScript types and Zod schemas
- **Database Models**: Drizzle ORM table definitions

## Data Flow

1. **Client Requests**: Frontend makes API calls using TanStack Query
2. **API Routing**: Express routes handle requests and validate data
3. **Database Operations**: Storage layer abstracts database interactions
4. **Response Handling**: Validated responses sent back to client
5. **State Updates**: TanStack Query manages cache invalidation and updates

The application follows a typical client-server pattern with real-time updates through query invalidation rather than WebSockets.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@radix-ui/***: Unstyled UI primitives

### Development Dependencies
- **@replit/vite-plugin-***: Replit-specific development tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Mode
- Frontend served via Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database schema managed with Drizzle migrations
- Replit-specific plugins for development environment

### Production Build
- Frontend built with Vite and output to `dist/public`
- Backend compiled with esbuild to `dist/index.js`
- Static files served by Express in production
- Database migrations applied via `drizzle-kit push`

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- Database credentials managed through environment variables

The application is designed to run seamlessly in both development and production environments, with the storage layer automatically adapting based on database availability.