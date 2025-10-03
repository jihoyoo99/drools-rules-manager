# Drools Rules Manager - Frontend Setup Guide

## Overview

Angular 17+ frontend application for managing Drools Decision Table rules with Git integration and spreadsheet editing capabilities.

## Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+
- Backend server running on `http://localhost:3000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. The following key dependencies are included:
   - Angular 17+ with Material Design
   - ag-Grid Community Edition for spreadsheet interface
   - RxJS for reactive state management

## Configuration

### Backend Proxy

The frontend uses a proxy configuration to communicate with the backend API. The proxy is configured in `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

This forwards all `/api/*` requests to the backend server.

## Running the Application

Start the development server:
```bash
npm start
```

Or using Angular CLI directly:
```bash
ng serve --proxy-config proxy.conf.json
```

The application will be available at `http://localhost:4200/`

## Application Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/           # Navigation header
│   │   ├── home/             # Main landing page with Git fetch form
│   │   ├── rule-editor/      # ag-Grid spreadsheet editor
│   │   └── dialogs/          # Commit and PR dialogs
│   ├── services/
│   │   ├── excel.service.ts       # Backend Excel API integration
│   │   ├── git.service.ts         # Backend Git API integration
│   │   ├── rules-data.service.ts  # In-memory rule data management
│   │   └── notification.service.ts # User feedback (snackbars, loading)
│   ├── models/
│   │   ├── drools-table.model.ts  # Drools table data structures
│   │   └── git.model.ts           # Git operation models
│   ├── app.routes.ts         # Route configuration
│   └── app.config.ts         # App configuration with providers
└── styles.scss               # Global styles (Material + ag-Grid themes)
```

## Features

### Primary Workflow: Fetch from Git

1. **Home Page** - Enter repository details:
   - Repository Owner (e.g., `jihoyoo99`)
   - Repository Name (e.g., `drools-rules-manager`)
   - File Path (e.g., `backend/test-data/sample-drools-table.xlsx`)
   - Branch (default: `main`)
   - GitHub Token (optional if set in backend `.env`)

2. **Fetch File** - Click "Fetch from Git":
   - Fetches file from GitHub via backend API
   - Parses Excel into Drools table structure
   - Navigates to Rule Editor

3. **Edit Rules** - ag-Grid spreadsheet interface:
   - Dynamic columns based on parsed data (NAME, CONDITION, ACTION types)
   - Inline cell editing
   - Visual indicators for column types (color-coded)
   - Tracks unsaved changes

4. **Commit Changes** - Save & Commit dialog:
   - Select existing branch or create new one
   - Enter commit message
   - Author name and email
   - Commits file to GitHub via backend API

5. **Create PR** - Pull Request dialog:
   - PR title and description
   - Source and target branches
   - Creates PR on GitHub via backend API
   - Returns PR URL

### Alternative Workflow: Upload Local File

1. **Upload** - Choose file from computer
2. **Parse** - Parses Excel into Drools table structure
3. **Edit** - Same ag-Grid editor as primary workflow
4. **Save to Git** - Prompts for Git repository info, then commits

## GitHub Authentication

The application requires a GitHub Personal Access Token for Git operations:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Either:
   - Enter token in the "GitHub Token" field on the fetch form (per-request)
   - Set `GITHUB_TOKEN` in backend `.env` file (default for all requests)

## API Integration

The frontend communicates with these backend endpoints:

### Excel API (`/api/excel`)
- `POST /upload` - Upload Excel file
- `POST /parse` - Parse uploaded Excel file
- `POST /generate` - Generate Excel from rule data

### Git API (`/api/git`)
- `GET /fetch-file` - Fetch file from GitHub
- `POST /commit-file` - Commit file to GitHub
- `POST /create-branch` - Create new branch on GitHub
- `POST /create-pr` - Create Pull Request on GitHub

## Development

### Building for Production

```bash
npm run build
```

Production build will be in `dist/` directory.

### Code Structure Guidelines

- All components are standalone (no NgModules)
- Services use RxJS for reactive state management
- Material Design components for UI consistency
- ag-Grid for spreadsheet functionality
- No NgRx (simple service-based state management)

## Troubleshooting

### Backend Connection Issues

If you see "Internal Server Error" or connection errors:
1. Verify backend is running on port 3000
2. Check `proxy.conf.json` configuration
3. Check browser console for CORS errors

### GitHub Token Errors

If you see "GitHub token is required":
1. Ensure token has `repo` scope
2. Either enter token in UI or set in backend `.env`
3. Verify token is valid (not expired)

### ag-Grid Display Issues

If spreadsheet doesn't render properly:
1. Verify ag-Grid CSS is imported in `styles.scss`
2. Check browser console for errors
3. Ensure rule data structure matches expected format

## License

MIT
