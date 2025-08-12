# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LineRunner is a theatre/script line-running application built with Next.js 14 and the T3 stack. It helps actors practice their lines by providing an interactive script runner with multiple data sources and playback modes.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Backend**: tRPC for type-safe APIs
- **UI**: React with Tailwind CSS and Radix UI components
- **Cloud Storage**: Firebase/Firestore for user scripts
- **State Management**: React Context (ScriptContext)
- **Icons**: React Icons

## Development Commands

```bash
# Start development server with debugging
npm run dev

# Database operations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio
./start-database.sh      # Start local PostgreSQL container

# Build and deployment
npm run build
npm run start
npm run lint

# Install dependencies
npm install
```

## Architecture Overview

### Data Sources

The application supports three data sources:

- **local**: JSON files in `public/sceneData/`
- **public**: Shared scripts in Firestore public collection
- **firestore**: User-specific scripts requiring authentication

### Core Data Structure

Scripts follow this JSON schema:

```typescript
interface ProjectJSON {
  project: string;
  scenes: SceneJSON[];
}

interface SceneJSON {
  title: string;
  lines: {
    character: string;
    line: string;
    sung?: boolean;
  }[];
}
```

### Application Architecture

**Frontend Structure:**

- `src/app/page.tsx` - Main app with tabbed interface (Line Runner, Line Viewer, Script Data, Add Script)
- `src/app/context.tsx` - Global state management via React Context
- `src/components/` - Reusable UI components
- `src/hooks/useScriptData.ts` - Custom hook for data fetching with caching

**Backend Structure:**

- `src/server/api/routers/scriptData.ts` - tRPC router for script operations
- `src/server/scriptService.ts` - Business logic for script data management
- `src/server/firebase.ts` - Firestore integration
- `prisma/schema.prisma` - Database schema with NextAuth models

**Key Components:**

- `ScriptBox` - Main script runner with line-by-line playback
- `ScriptViewer` - Full script viewing mode
- `ScriptData` - Script editing interface with drag-and-drop
- `AddScriptDoc` - Interface for creating new scripts

### State Management

The `ScriptContext` manages:

- Script selection (project, scene, character)
- Playback state (current line, word index, playing status)
- User configuration (data source, playback settings)
- Script creation state

### Authentication & Data Access

- NextAuth.js handles user authentication
- Firestore access requires authenticated users
- Admin functions restricted to specific email (`coreyloftus@gmail.com`)
- Public scripts accessible without authentication

## Database Setup

1. Ensure Docker is installed
2. Run `./start-database.sh` to start PostgreSQL container
3. Set up `.env` file with `DATABASE_URL`
4. Run `npm run db:push` to apply schema

## Key Development Patterns

- Use tRPC procedures for all data operations
- Leverage the `useScriptData` hook for efficient data fetching
- Components should access global state via `ScriptContext`
- Follow existing TypeScript patterns and interfaces
- UI components built with Radix UI primitives and Tailwind styling

## Testing & Quality

Run linting before commits:

```bash
npm run lint
```

The codebase uses TypeScript strict mode and ESLint with Next.js configuration.
