# Quick Setup Guide

## ✅ Completed
- Convex backend set up and running
- All functions migrated to proper Convex syntax
- Frontend starts without errors
- Auth0 integration ready

## 🚀 Next Steps

### 1. Set Up Auth0 (5 minutes)
1. Go to [Auth0 Dashboard](https://dashboard.auth0.com/)
2. Create a new application → Single Page Application
3. Add Google social connection
4. Get your **Domain** and **Client ID**
5. Update `.env.local`:
   ```
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   ```

### 2. Deploy to Vercel (2 minutes)
```bash
# Create GitHub repo
git init
git add .
git commit -m "Migrate to Convex + Auth0"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main

# Deploy to Vercel
vercel --prod
```

### 3. Update Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- `CONVEX_DEPLOYMENT`: `dev:precious-bullfrog-835`
- `VITE_CONVEX_URL`: `https://precious-bullfrog-835.eu-west-1.convex.cloud`
- `VITE_AUTH0_DOMAIN`: Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID

### 4. Test Everything
- Visit your Vercel URL
- Try Google sign-in
- Create some exercises and lifts
- Verify real-time sync works

## 🎯 Architecture Summary
```
Frontend (Vite + React) 
    ↓
Auth0 (Authentication)
    ↓  
Convex (Database + Functions)
    ↓
Vercel (Hosting)
```

## 🔧 Troubleshooting
- **Auth0 errors**: Check domain and client ID in env vars
- **Convex errors**: Run `npx convex dev` to restart backend
- **Build errors**: Make sure all env vars are set in Vercel

Your app is now fully migrated and ready for production! 🚀
