const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 200,
    height: 340,
    minWidth: 200,
    minHeight: 340,
    x: width - 220,
    y: height - 370,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setIgnoreMouseEvents(false);

  // Allow dragging through transparent areas
  mainWindow.on('will-move', () => {});

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Groq AI chat
ipcMain.handle('ask-groq', async (event, userMessage) => {
  try {
    const Groq = require('groq-sdk');
    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are a cute, cheerful chibi desktop assistant character with passive aggresive tone. You give short, friendly, helpful responses (1-3 sentences max) with passive aggresive tone for funnier conversation. 
          Use playful language and occasionally add expressions like "~", "!" or cute emoticons. 
          Be genuinely helpful but keep responses very brief since you appear in a small chat bubble.`
        },
        { role: 'user', content: userMessage }
      ]
    });

    return response.choices?.[0]?.message?.content?.trim() || "Ahh, I couldn't think of a reply just now~ (｡•́︿•̀｡)";
  } catch (error) {
    console.error('Groq API error:', error);
    if (error.message?.includes('API key')) {
      return "Oops! I need an API key to chat~ Set GROQ_API_KEY in your environment! 🔑";
    }
    return "Ahh, something went wrong! Try again? (⌯˃̶᷄ ﹏ ˂̶᷄⌯)";
  }
});

// IPC: Window position for manual dragging
ipcMain.handle('get-window-position', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { x: 0, y: 0 };
  const [x, y] = win.getPosition();
  return { x, y };
});

ipcMain.on('set-window-position', (event, position) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !position) return;
  const x = Number(position.x);
  const y = Number(position.y);
  if (Number.isFinite(x) && Number.isFinite(y)) {
    win.setPosition(Math.round(x), Math.round(y));
  }
});

// IPC: Quit app
ipcMain.handle('quit-app', () => {
  app.quit();
});

// IPC: Start drag
ipcMain.handle('start-drag', () => {
  // handled in renderer via -webkit-app-region
});
