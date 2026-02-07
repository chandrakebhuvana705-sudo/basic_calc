# Shared Calculator

A React calculator that stores every calculation in a SQLite database and exposes a shared URL.

## Local development

1. Install dependencies
   - `npm install`
   - `cd server` then `npm install`
2. Start the API
   - `cd server` then `npm run dev`
3. Start the React app (in another terminal)
   - `npm run dev`

The frontend uses a proxy so `/api` calls go to `http://localhost:5174`.

## Production

Build the React app and let the API serve the static files:

1. `npm run build`
2. `cd server` then `npm start`

## Deploy

You can deploy the `server` folder to Render/Railway/Fly and set:
- `PORT` (provided by host)
- `NODE_ENV=production`

Then run build on the frontend and upload the `dist` folder next to `server` so Express can serve it.

If you deploy frontend separately, set `VITE_API_BASE` in the frontend environment to the API URL.
