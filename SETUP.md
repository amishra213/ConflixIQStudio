# Local Development Setup - Windows

This guide will help you run the Conductor Designer application locally on Windows.

## Prerequisites

1. **Node.js and npm** - Download and install from [https://nodejs.org/](https://nodejs.org/)
   - Recommended: LTS version (v18+)
   - Verify installation: `node --version` and `npm --version`

2. **Git** (optional, for version control) - Download from [https://git-scm.com/](https://git-scm.com/)

## Installation Steps

### 1. Install Dependencies

Open PowerShell or Command Prompt and navigate to the project directory:

```powershell
cd d:\Projects\ConductorDesigner
npm install
```

### 2. Run Development Server

You have two options:

**Option A: Frontend Only (Recommended for UI Development)**
```powershell
npm run dev:frontend
```
The application will start at `http://localhost:5173/`

**Option B: Full Stack (Frontend + Backend Server)**
```powershell
npm run dev:full
```
This runs both the frontend (port 5173) and backend GraphQL server simultaneously.

**Option C: Backend Server Only**
```powershell
npm run dev:server
```

### 3. Build for Production

To create an optimized production build:

```powershell
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Port Already in Use
If port 5173 is already in use:
- Close other applications using the port
- Or modify `vite.config.ts` to use a different port

### Node Modules Issues
If you encounter module-related errors:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Permission Errors
If you get permission denied errors, try running PowerShell as Administrator.

## Available Scripts

- `npm run dev:frontend` - Start development frontend only
- `npm run dev:server` - Start development backend server only
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Environment Configuration

Create a `.env` file in the project root if needed for environment-specific settings.

## Additional Resources

- Vite Documentation: https://vitejs.dev/
- React Documentation: https://react.dev/
- Apollo Client: https://www.apollographql.com/docs/react/
- Tailwind CSS: https://tailwindcss.com/
