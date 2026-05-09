# 🌸 Chibi Desktop Pet

A transparent, always-on-top chibi desktop assistant powered by Groq.

## ✨ Features

- **Transparent window** — only the character is visible, no background chrome
- **Always on top** — sits above all your windows
- **Click to chat** — chat bubble pops up with a typewriter effect
- **Drag to move** — drag the character anywhere on your screen
- **Groq AI powered** — real responses from Llama 3.3 70B
- **Idle animations** — gentle floating & occasional peeking messages
- **Sparkle effects** — stars burst on click

## 🚀 Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer
- A [Groq API key](https://console.groq.com/)

### 2. Install dependencies
```bash
npm install
```

### 3. Add your character image
Place your chibi character PNG as:
```
src/character.png
```
- Use a PNG with a **transparent background**
- Recommended size: ~400×500px

### 4. Set your API key

**macOS / Linux:**
```bash
export GROQ_API_KEY=gsk_xxxxxxxxxx
npm start
```

**Windows (PowerShell):**
```powershell
$env:GROQ_API_KEY="gsk_xxxxxxxxxx"
npm start
```

**Windows (Command Prompt):**
```cmd
set GROQ_API_KEY=gsk_xxxxxxxxxx
npm start
```

### 5. Run
```bash
npm start
```

---

## 🖱️ Usage

| Action | Result |
|--------|--------|
| **Click character** | Opens/closes chat bubble |
| **Type + Enter** | Sends message to Groq |
| **Drag character** | Moves window around screen |
| **Hover → ✕ button** | Quits the app |

---

## 📁 Project Structure

```
chibi-pet/
├── package.json
├── src/
│   ├── main.js        # Electron main process
│   ├── preload.js     # Secure IPC bridge
│   ├── index.html     # UI renderer
│   └── character.png  # ← ADD YOUR IMAGE HERE
└── README.md
```

---

## 🔧 Customization

**Change window size** — edit `width`/`height` in `src/main.js`  
**Change starting position** — edit `x`/`y` in `src/main.js`  
**Change personality** — edit the `system` prompt in `main.js`  
**Change idle messages** — edit the `idleMessages` array in `index.html`

---

## 💡 Tips

- Works on **Windows, macOS, and Linux**
- The window is **click-through transparent** except on the character itself
- On **macOS**, you may need to grant screen recording/accessibility permissions
- Build a distributable with `npx electron-builder` (add electron-builder to devDependencies)
