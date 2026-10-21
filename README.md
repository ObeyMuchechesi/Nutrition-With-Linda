# Nutrition with Linda

A React and Tailwind landing page with an Express and MongoDB booking API.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `MONGO_URI` to your MongoDB Atlas connection string.
3. Install packages with `npm install`.
4. Start the API and Vite together with `npm run dev`.

The site is available at `http://localhost:5173`; Vite forwards `/api` requests to the Express server at `http://localhost:5000`.

## Deploy

The frontend and Express API are deployed together on Vercel. Set `MONGO_URI` in the Vercel project's Production environment, then deploy with `vercel --prod`. The API stores booking requests in the `nutrition_db` database.

The database URI is a secret. Keep it in `.env` locally and in Vercel's environment settings; never commit it to Git.
