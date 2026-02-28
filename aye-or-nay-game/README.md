# 🏴‍☠️ Aye or Nay

A social party game about discovering friends and foes. Roll the dice, name names, and let the crew decide if you're telling the truth!

## 🎮 What is Aye or Nay?

Aye or Nay is a drinking game that reveals social dynamics within a group. Each turn:

1. **Roll** - Flip a coin (Friend/Enemy) and roll a dice (1-6 for closeness levels)
2. **Reveal** - Name a person who fits the description and explain why
3. **Vote** - The crew votes AYE (agree) or NAY (disagree)
4. **Consequences** - If rejected, drink or recruit a stranger who agrees with you!

Perfect for parties, gatherings, or getting to know your friends better.

## 🌍 Languages Supported

- 🇬🇧 English
- 🇫🇷 French (Français)
- 🇹🇷 Turkish (Türkçe)
- 🇵🇱 Polish (Polski)

## 🚀 Quick Start

### Prerequisites

- Node.js (v22 or higher recommended)

### Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Build for Production

Build the app to the `aye-or-nay` folder:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🎯 Features

- **Multi-language support** - Instantly switch between English, French, Turkish, and Polish
- **Responsive design** - Works on desktop, tablet, and mobile
- **Detailed player statistics** - Track 4 different outcomes for each player:
  - 👍 **Reveals** - Successfully named someone and crew voted AYE
  - 💀 **Rejections** - Named someone but crew voted NAY
  - 🍺 **Drinks** - Chose to drink instead of naming
  - 👥 **Secrets** - Chose to share a secret instead of naming
- **Animated UI** - Smooth transitions and engaging animations
- **Player management** - Add/remove players at any time during the game
- **Custom forfeit options** - Choose between drinking or sharing secrets
- **Progressive Web App (PWA)** - Install on any device and play offline

## 📱 PWA Features

The game is a fully-featured Progressive Web App:

- **📲 Installable** - Add to home screen on iOS, Android, and desktop
- **🔌 Offline support** - Play anywhere, even without internet connection
- **⚡ Fast loading** - Service worker caches assets for instant startup
- **🎯 App-like experience** - Runs in standalone mode without browser UI
- **💾 Lightweight** - ~500KB total size for the entire app

### Installing as PWA

**On Mobile (iOS/Android):**

1. Open the game in Safari (iOS) or Chrome (Android)
2. Tap the share button or browser menu
3. Select "Add to Home Screen"
4. The game icon will appear on your home screen

**On Desktop (Chrome/Edge):**

1. Look for the install icon (⊕) in the address bar
2. Click "Install" when prompted
3. The game opens as a standalone app

Once installed, the game works completely offline - perfect for parties in basements, remote locations, or anywhere with spotty WiFi!

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Styling
- **Motion** - Animations
- **i18next** - Internationalization
- **Lucide React** - Icons
- **PWA** - Service Worker + Web App Manifest for offline support and installability

## 📁 Project Structure

```
src/
├── App.tsx           # Main game component
├── main.tsx          # Entry point
├── i18n.ts           # i18n configuration
├── locales/          # Translation files
│   ├── en.json
│   ├── fr.json
│   ├── tr.json
│   └── pl.json
└── index.css         # Global styles

public/
├── manifest.json     # PWA manifest
├── sw.js             # Service worker
├── icon-192.svg      # App icon (192x192)
└── icon-512.svg      # App icon (512x512)
```

## 🎲 Game Rules

### The Goal

Reveal your friends and foes. Discover common allies and enemies within the crew.

### The Roll

Every turn, flip a coin and roll a dice:

- **Heads** = Friend, **Tails** = Enemy
- **Dice (1-6)** determines closeness:
  1. Closest (best friend, sibling, daily person)
  2. Tight circle (core friends/family weekly)
  3. Regular circle (good friends, work crew)
  4. Loose associates (gym, neighbours, old classmates)
  5. Distant network (online, mutuals)
  6. Public/Celebrity (influencers, famous people)

### The Reveal

Name a person who fits the description and explain why.

- Can't answer? **Drink** or **Share a Secret**!

### The Vote

The crew votes **AYE** (agree) or **NAY** (disagree).

- If **AYEs** win: You're accepted! ✅ **+1 Reveal**
- If **NAYs** win: You're rejected! ❌ **+1 Rejection** - Drink or recruit a random stranger who agrees with you.

### Player Statistics

Each player's performance is tracked with color-coded badges:

- 👍 **Reveals** (green) - Successful answers accepted by the crew
- 💀 **Rejections** (red) - Answers rejected by the crew
- 🍺 **Drinks** (amber) - Times the player chose to drink instead of answering
- 👥 **Secrets** (purple) - Times the player chose to share a secret instead of answering

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Type check with TypeScript

---

**Ready to play?** Visit: <https://julienreszka.github.io/aye-or-nay/>
