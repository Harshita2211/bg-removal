# Backround Removal Saas Web App

A full-stack background removal app. Users sign in, upload an image, and get the background removed via the ClipDrop API. New users start with free credits and can buy more via Razorpay.

**Live app:** https://bg-removal-p9p4.vercel.app

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS
- Clerk (`@clerk/clerk-react`) for authentication
- React Router
- Axios

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- Clerk (`@clerk/backend`) for server-side token verification
- ClipDrop API for background removal
- Razorpay for payments
- Svix for verifying Clerk webhooks

**Deployment**
- Vercel (client and server deployed as separate projects)

## Project Structure

```
bg-removal/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── context/     # AppContext — global state, API calls
│   │   └── pages/
│   └── vercel.json
└── server/          # Express backend
    ├── controllers/
    ├── middlewares/  # auth.js — verifies Clerk session tokens
    ├── models/
    ├── routes/
    └── vercel.json
```

## How It Works

1. User signs in via Clerk on the frontend.
2. Clerk fires a `user.created` webhook to the backend, which creates a MongoDB user document with 5 free credits.
3. Every authenticated request sends the Clerk session token in a custom `token` header.
4. The backend's `authUser` middleware verifies the token against Clerk (using `@clerk/backend`'s `verifyToken`) and reads the user's ID from the token's `sub` claim.
5. Uploading an image calls ClipDrop's remove-background API and deducts one credit.
6. Running low on credits routes the user to the buy-credits page, which creates a Razorpay order; a webhook/verify step confirms payment and tops up the credit balance.

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster
- A Clerk application (Development instance is fine for local work)
- A ClipDrop API key
- A Razorpay account (test mode keys are fine for development)
- [ngrok](https://ngrok.com) (or similar) if you want Clerk webhooks to reach your local server

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bg-removal

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

**`server/.env`**
```
MONGODB_URI=
CLERK_WEBHOOK_SECRET=
CLERK_SECRET_KEY=
CLIPDROP_API=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CURRENCY=INR
```

**`client/.env`**
```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=
```

> Never commit `.env` files. Both are already covered by `.gitignore`.

### 3. Run the backend

```bash
cd server
npm run server
```

Runs on `http://localhost:4000` by default. You should see `Server Running on port 4000` and a MongoDB connection confirmation.

### 4. Run the frontend

```bash
cd client
npm run dev
```

Runs on `http://localhost:5173` by default.

### 5. Wire up the Clerk webhook (for local dev)

Clerk needs a public URL to send webhook events to, so `localhost` won't work directly:

```bash
ngrok http 4000
```

Copy the forwarding URL ngrok gives you and set it as your webhook endpoint in the Clerk dashboard:

```
https://<your-ngrok-subdomain>.ngrok-free.app/api/user/webhooks
```

Make sure the webhook signing secret shown in Clerk matches `CLERK_WEBHOOK_SECRET` in `server/.env`.

## Deployment (Vercel)

The client and server are deployed as **two separate Vercel projects** from the same repo:

| Project | Root Directory | Notes |
|---|---|---|
| Server | `server` | Framework preset: Other. Uses `@vercel/node` per `server/vercel.json`. |
| Client | `client` | Framework preset: Vite (auto-detected). |

Set the same environment variables listed above in each Vercel project's settings (with `VITE_BACKEND_URL` pointing at the deployed server's URL, not `localhost`).

After deploying the server, update the Clerk webhook URL to point at:
```
https://<your-server>.vercel.app/api/user/webhooks
```

Also add `0.0.0.0/0` to MongoDB Atlas's Network Access list, since Vercel functions don't have fixed IPs.

## Security Notes

- Server-side auth verifies Clerk session tokens using `@clerk/backend`'s `verifyToken` — never trust a decoded-but-unverified JWT.
- Rotate any credential immediately if it's ever committed to git history, even if later removed — old commits still contain it.
- Use test-mode keys (Clerk Development instance, Razorpay test keys) until you're ready to go live, then switch to production keys and set up a separate production webhook endpoint.

