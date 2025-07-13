# Cool Track - Inventory Management System

A full-stack inventory management system for tracking items across refrigerators and freezers with expiration date monitoring and dashboard analytics.

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, shadcn/ui components, Tailwind CSS
- **Backend**: Express.js with TypeScript, Drizzle ORM
- **Database**: PostgreSQL with abstracted storage layer
- **Internationalization**: i18next with RTL support for Arabic, English, and Spanish
- **Testing**: Vitest with isolated test database infrastructure

## ✨ Features

- 📦 Track inventory items across multiple devices (refrigerators/freezers)
- 📅 Expiration date monitoring with smart alerts
- 📊 Dashboard analytics with visual charts
- 🌍 Multi-language support (EN, ES, AR) with RTL layouts
- 📱 Responsive design for mobile and desktop
- 🧪 Comprehensive testing with isolated test database

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm

### 1. Install PostgreSQL

Using Docker (recommended):
```bash
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=cool_track \
  -p 5432:5432 \
  -d postgres:15
```

Install PostgreSQL CLI tools:
```bash
brew install libpq
```
*Note: You may need to add libpq to your PATH*

### 2. Clone and Install Dependencies

```bash
git clone <repository-url>
cd cool_track2
npm install
```

### 3. Set up Test Database

```bash
npm run test:db:setup
npm run db:push:test
npm test
```

### 4. Configure Environment

Create a `.env` file in the project root:
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/cool_track
```

### 5. Initialize Database and Start Development

```bash
npm run db:push
npm run db:reset
npm run dev
```

### 6. Open Application

Navigate to [http://localhost:3000](http://localhost:3000) to access the application.

## 🎮 Demo Credentials

The seeding script creates a demo user with sample data for easy testing:

- **Email**: `user@example.com`
- **Password**: `demo123`
- **Sample Data**: ~50 inventory items across multiple categories with realistic expiration dates

This demo user is automatically created when you run `npm run db:reset` or `npm run db:seed`. New users who register through the UI will start with empty households.

## 📜 Available Scripts

- `npm run dev` - Start development server with live reloading
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run db:push` - Push database schema changes
- `npm run db:seed` - Populate with sample data
- `npm run db:reset` - Reset database with fresh sample data

## 🗄️ Database Schema

- **devices** - Refrigerators and freezers
- **inventory_items** - Items with categories, quantities, expiration dates
- **settings** - Application configuration

## 🧪 Testing

The project includes comprehensive testing with an isolated test database:
- Unit tests for components and utilities
- Integration tests for API endpoints
- Automatic test database setup and teardown
- Complete data isolation from development database

## 📝 License

MIT
