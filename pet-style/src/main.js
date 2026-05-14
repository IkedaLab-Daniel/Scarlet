const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 200;
  const windowHeight = 500;
  const edgeGap = 20;
  const bottomGap = 30;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: windowWidth,
    minHeight: windowHeight,
    x: width - (windowWidth + edgeGap),
    y: height - (windowHeight + bottomGap),
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

function openMacApp(appNames) {
  const names = Array.isArray(appNames) ? appNames : [appNames];

  return new Promise((resolve, reject) => {
    const tryNext = (index) => {
      execFile('open', ['-a', names[index]], (err) => {
        if (!err) {
          resolve();
          return;
        }
        if (index < names.length - 1) {
          tryNext(index + 1);
          return;
        }
        reject(err);
      });
    };

    // Try a few common app names to reduce false negatives.
    tryNext(0);
  });
}

function getRunningAppsMac() {
  const script = `
    set appList to {}
    tell application "System Events"
      repeat with p in (application processes where background only is false)
        set appName to name of p
        set appFile to ""
        try
          set appFile to POSIX path of (file of p)
        end try
        set end of appList to appName & "||" & appFile
      end repeat
    end tell
    set AppleScript's text item delimiters to (ASCII character 10)
    set output to appList as text
    set AppleScript's text item delimiters to ""
    return output
  `;

  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = String(stdout || '').trim().split('\n').filter(Boolean);
      const items = lines.map((line) => {
        const [name, filePath] = line.split('||');
        return { name: (name || '').trim(), path: (filePath || '').trim() };
      }).filter((item) => item.name.length > 0);

      resolve(items);
    });
  });
}

async function getRunningAppsWithIcons() {
  const apps = await getRunningAppsMac();
  const results = [];

  for (const item of apps) {
    let iconDataUrl = null;
    if (item.path && fs.existsSync(item.path)) {
      try {
        const icon = await app.getFileIcon(item.path, { size: 'small' });
        if (icon && !icon.isEmpty()) {
          iconDataUrl = icon.toDataURL();
        }
      } catch (error) {
        // Ignore icon failures and continue without an icon.
      }
    }
    results.push({ name: item.name, iconDataUrl });
  }

  return results;
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

// IPC: Open native app shortcuts
ipcMain.handle('open-app', async (event, appKey) => {
  if (process.platform !== 'darwin') {
    return { ok: false, message: 'This command currently works on macOS only.' };
  }

  const appNamesByKey = {
    teams: ['Microsoft Teams', 'Microsoft Teams (work or school)']
  };

  const appNames = appNamesByKey[appKey];
  if (!appNames) {
    return { ok: false, message: 'Unknown app request.' };
  }

  try {
    await openMacApp(appNames);
    return { ok: true };
  } catch (error) {
    console.error('Open app error:', error);
    return { ok: false, message: 'I could not open Microsoft Teams. Is it installed?' };
  }
});

ipcMain.handle('get-running-apps', async () => {
  if (process.platform !== 'darwin') {
    return { ok: false, message: 'This command currently works on macOS only.' };
  }

  try {
    const apps = await getRunningAppsWithIcons();
    return { ok: true, apps };
  } catch (error) {
    console.error('Get running apps error:', error);
    return { ok: false, message: 'I could not read running apps.' };
  }
});

// IPC: Start drag
ipcMain.handle('start-drag', () => {
  // handled in renderer via -webkit-app-region
});
