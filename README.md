# Momentum Facilities Incident Hub

A React + TypeScript incident reporting application with a red and blue theme inspired by Momentum Group.

## What this version does

- Admin demo users can create and edit incidents.
- Viewer demo users can view incidents and add comments.
- Dashboard includes trend charts and a most-reported incident analysis.
- Local storage mode works immediately with no backend setup.
- Supabase placeholders are included so you can upgrade later.

## Stack

- React
- TypeScript
- Vite
- React Router
- Recharts
- Lucide React
- Supabase client placeholder

## Install

1. Install Node.js 20.19 or newer.
2. Open the project folder in your terminal.
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL shown by Vite.

## Demo login

Choose one of the two roles on the login screen:

- Admin
- Viewer

## Local mode

This starter app saves data in `localStorage`, so it works without a database.

## Supabase later

When you are ready for a real cloud database:

1. Copy `.env.example` to `.env`
2. Add your Supabase URL and anon key
3. Replace the local service methods in `src/services/incidentService.ts` with Supabase calls

## Suggested Supabase tables

- profiles
- incidents
- incident_comments
- incident_attachments
