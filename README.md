# LiftLogPAW

A progressive web application for tracking workouts, now powered by Convex and Vite.

## 🚀 Features

- **Real-time Sync**: Automatic data synchronization across devices
- **PWA Support**: Installable on mobile devices with offline capabilities
- **Simple Authentication**: Secure username/password login
- **Exercise Tracking**: Log lifts, cardio sessions, and progress
- **Data Visualization**: Charts and progress tracking
- **Modern Stack**: React + TypeScript + Vite + Convex

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Convex (real-time database + functions)
- **UI**: Material-UI (MUI)
- **Authentication**: Simple username/password system
- **Deployment**: Vercel
- **PWA**: Service Worker with offline support

## 📱 Quick Start

### Prerequisites
- Node.js 18+
- Convex account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/LiftLogPAW.git
   cd LiftLogPAW
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your credentials:
   ```env
   VITE_CONVEX_URL=your-convex-url.convex.cloud
   VITE_APP_USERNAME=your-username
   VITE_APP_PASSWORD=your-password
   ```

4. **Start Convex backend**
   ```bash
   npx convex dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173)

## 🔐 Authentication

The app uses a simple username/password system:

- **Default credentials**: 
  - Username: `emmett`
  - Password: `workout`

Login sessions are persisted in localStorage for PWA compatibility.

## 📊 Database Schema

The Convex database includes:

- **Users**: User profiles and authentication
- **Categories**: Main and sub-categories for exercises
- **Exercises**: Custom exercise definitions
- **Lifts**: Weight training records (sets, reps, weight)
- **Cardio Sessions**: Cardio activity tracking
- **Time Goals**: Weekly cardio goals

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Set environment variables in Vercel**
   - `CONVEX_DEPLOYMENT`: Your Convex deployment name
   - `VITE_CONVEX_URL`: Your Convex URL
   - `VITE_APP_USERNAME`: Your username
   - `VITE_APP_PASSWORD`: Your password

## 📱 PWA Features

- **Offline Support**: Works without internet connection
- **Installable**: Add to home screen on mobile devices
- **Background Sync**: Automatic data sync when online
- **Push Notifications**: Future feature for workout reminders

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
npx convex dev       # Start Convex backend
npx convex dashboard # Open Convex dashboard
```

### Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/      # React contexts (Auth, etc.)
├── pages/         # Page components
├── services/      # API services and utilities
├── utils/         # Helper functions
└── types/         # TypeScript type definitions

convex/
├── schema.ts      # Database schema
├── users.ts       # User functions
├── exercises.ts   # Exercise management
├── lifts.ts       # Lift tracking
├── cardio.ts      # Cardio sessions
└── files.ts       # File uploads
```

## 🔄 Migration from Firebase

This project was migrated from Firebase to Convex for better performance and simpler architecture. See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private. All rights reserved.

## 🆘 Support

If you run into issues:

1. Check the [Convex Dashboard](https://dashboard.convex.dev)
2. Review the [Convex Documentation](https://docs.convex.dev)
3. Open an issue in this repository

---

Built with ❤️ using Convex, React, and Vite
