# LineRunner

> A theatre-focused line-running app that makes script practice feel less like memorization and more like magic ✨

**Built by [Corey Loftus](https://github.com/coreyloftus)**

LineRunner is a modern web application designed specifically for actors who want to master their lines through interactive, intelligent practice sessions. Think of it as your personal scene partner that never gets tired of running lines.

## ✨ Current Features

### 🎭 **Four-Tab Interface**

- **Line Runner** — The main event: interactive line-by-line script practice with intelligent playback controls
- **Line Viewer** — Read through full scenes at your own pace (perfect for initial script familiarization)
- **Script Data** — Live-edit your scripts with drag-and-drop scene organization and mobile-friendly UX
- **Add Script** — Upload new scripts with smart file parsing or create them from scratch

### 🔐 **Smart Authentication & Data Management**

- Seamless login via Google and Apple (powered by NextAuth.js)
- Three data source types:
  - **Local** — Curated professional scripts (Shakespeare, contemporary works)
  - **Public** — Community-shared scripts available to all users
  - **Personal** — Your private script collection stored securely in the cloud

### 📱 **Mobile-First Design**

- Responsive interface that works beautifully on phones, tablets, and desktops
- Touch-friendly controls optimized for on-the-go rehearsal
- Thoughtful typography and spacing that's easy on the eyes during long practice sessions

### 🛠 **Professional-Grade Architecture**

- **Next.js 14** with App Router for lightning-fast performance
- **tRPC** for type-safe API calls (because nobody likes runtime errors during rehearsal)
- **Firebase/Firestore** for cloud script storage and sharing
- **Radix UI components** with **Tailwind CSS** for that polished, professional feel

## 🚀 Getting Started

```bash
# Clone and install
git clone [repository-url](https://github.com/coreyloftus/linerunner-t3)
cd linerunner
npm install

# Set up your database
./start-database.sh    # Starts local PostgreSQL container
npm run db:push       # Apply database schema

# Launch the app
npm run dev           # Starts development server with debugging

# Other useful commands
npm run build         # Build for production
npm run lint          # Keep the code tidy
```

## 📚 Sample Scripts

LineRunner comes loaded with a demo script to get you started:

- **The Importance of Being Earnest** — Classic Wilde comedy

## 🔧 Tech Stack Highlights

This isn't just another CRUD app — LineRunner leverages modern web technologies to create a genuinely useful tool for performers:

- **Framework**: Next.js 14 (App Router architecture)
- **Backend**: T3 Stack (tRPC + NextAuth + Prisma)
- **Database**: PostgreSQL with Prisma ORM
- **Cloud Storage**: Firebase/Firestore for script sharing
- **UI**: React with Radix UI primitives and Tailwind styling
- **Interactions**: @dnd-kit for smooth drag-and-drop script editing
- **State**: React Context for global app state management

## 📋 Recently Completed

- ✅ **User authentication** with Google/Apple SSO
- ✅ **Cloud script storage** with user-specific and shared collections
- ✅ **Live script editing** with drag-and-drop scene management
- ✅ **File upload system** for adding new scripts
- ✅ **Mobile UI improvements** for better touch interaction
- ✅ **Admin functions** for managing shared script collections

## 🎯 Future Vision

Here's where LineRunner could go next (in rough order of excitement):

### Near-Term Enhancements

- **AI Script Parser** — Upload raw text scripts and let AI transform them into our structured format
- **Character-Specific Practice** — Filter scripts to focus on your specific role
- **Performance Analytics** — Track which lines you struggle with and focus practice accordingly
- **Offline Mode** — Download scripts for practice without internet (great for backstage prep)

### Dream Features

- **Voice Recognition** — Speak your lines and get instant feedback on accuracy
- **Collaborative Sessions** — Practice scenes with scene partners remotely
- **Cue Integration** — Support for technical cues, blocking notes, and character motivations
- **Mobile App** — Native iOS/Android apps for even better mobile experience
- **Script Marketplace** — Browse and purchase professional scripts from publishers

### Power User Tools

- **Bulk Import** — Upload entire show scripts with automatic scene detection
- **Export Options** — Generate practice PDFs, cue sheets, or rehearsal schedules
- **Integration Hub** — Connect with stage management tools, casting platforms, or rehearsal apps

## 🤝 Contributing

Found a bug? Have a feature idea? This project thrives on feedback from the theatre community. Please [open an issue](https://github.com/coreyloftus/linerunner/issues) or submit a pull request.

## 📄 License

MIT License — Use it, love it, make theater better with it.

---
