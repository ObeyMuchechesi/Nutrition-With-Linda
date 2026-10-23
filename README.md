# Nutrition with Linda

A server-rendered React and Tailwind website with an Express and MongoDB booking API.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `MONGO_URI` to your MongoDB Atlas connection string.
3. Install packages with `npm install`.
4. Start the Next.js website and Express API together with `npm run dev`.

The site is available at `http://localhost:3000`. Next.js forwards `/api` requests to the Express server at `http://localhost:5000`. The homepage renders on the server from MongoDB for each request; if the database is unavailable, it renders its built-in default content.

## Deploy

The Next.js website and Express API are deployed together on Vercel. Set `MONGO_URI` in the Vercel project's Production environment, then deploy with `vercel --prod`. The API stores booking requests and editable homepage content in the `nutrition_db` database.

## Admin dashboard

Open `/admin` on the deployed site. The dashboard is protected by a single admin sign-in configured through server-side environment variables. Add these to the Vercel project's Production environment and mark each value as sensitive:

- `ADMIN_EMAIL`: the email used to sign in
- `ADMIN_PASSWORD`: a unique password with at least 12 characters
- `ADMIN_SESSION_SECRET`: a random secret with at least 32 characters; generate one with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`

Redeploy after setting the variables. The dashboard shows total and pending requests, upcoming consultations, requests this month, a six-month trend, and a searchable, paginated booking list. Admins can update request statuses. Existing bookings without a status appear as pending.

The dashboard's **Patients** section keeps a private patient register in MongoDB. Add a patient and record a dated visit with weight, BMI, body fat percentage, visceral fat, waist circumference, and optional notes. The patient view includes visit history and charts for comparing each measurement over time. Search the register by name or contact details. The **Website content** section lets the admin edit the public homepage, consultation details, service cards, price, booking messages, phone and address, and WhatsApp contact. This content is stored in MongoDB and appears in server-rendered HTML the next time a visitor opens the page, without a code change or redeployment. If the database is unavailable, the site can still render its built-in default content.

The admin API uses an HTTP-only, secure production session cookie. The password and session secret must stay in Vercel's sensitive environment settings and must never be committed to Git.

The public site's floating WhatsApp button opens a chat to `+263 78 490 9690`.

The database URI is a secret. Keep it in `.env` locally and in Vercel's environment settings; never commit it to Git.
