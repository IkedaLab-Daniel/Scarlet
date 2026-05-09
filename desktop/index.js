const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const PROTOCOL = 'scarlet';
const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_SERVER_URL = 'http://localhost:8000/api/scans/';
const PYTHON_BIN = process.env.SCARLET_PYTHON || 'python3';
const SERVER_URL = process.env.SCARLET_SERVER_URL || DEFAULT_SERVER_URL;
const SCAN_TIMEOUT_MS = Number(process.env.SCARLET_SCAN_TIMEOUT_MS || 120000);

let mainWindow;
let pendingDeepLink = null;

function getDeepLinkFromArgs(argv) {
    return argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
}

function parseDeepLink(urlString) {
    try {
        const url = new URL(urlString);
        if (url.protocol !== `${PROTOCOL}:`) {
            return null;
        }

        return {
            target: url.searchParams.get('target') || '',
            ports: url.searchParams.get('ports') || '1-1024',
            rawUrl: urlString,
        };
    } catch (error) {
        return null;
    }
}

function sendDeepLink(payload) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('deep-link', payload);
    } else {
        pendingDeepLink = payload;
    }
}

function handleDeepLink(urlString) {
    const payload = parseDeepLink(urlString);
    if (!payload) {
        return;
    }

    sendDeepLink(payload);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 760,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const devServerUrl = process.env.SCARLET_DEV_SERVER_URL;
    if (devServerUrl) {
        mainWindow.loadURL(devServerUrl);
    } else {
        mainWindow.loadFile(path.join(__dirname, 'ui', 'dist', 'index.html'));
    }

    mainWindow.webContents.once('did-finish-load', () => {
        if (pendingDeepLink) {
            sendDeepLink(pendingDeepLink);
            pendingDeepLink = null;
        }
    });
}

function registerProtocol() {
    if (process.defaultApp && process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    } else {
        app.setAsDefaultProtocolClient(PROTOCOL);
    }
}

function resolveScanScript() {
    const candidates = [];

    if (app.isPackaged) {
        candidates.push(path.join(process.resourcesPath, 'proto', 'scan_cli.py'));
    }

    candidates.push(path.join(__dirname, 'proto', 'scan_cli.py'));
    candidates.push(path.join(ROOT_DIR, 'proto', 'scan_cli.py'));

    return candidates.find((candidate) => fs.existsSync(candidate));
}

function runPythonScan({ target, ports }) {
    if (!target) {
        return Promise.reject(new Error('Target is required'));
    }

    const scanScript = resolveScanScript();
    if (!scanScript) {
        return Promise.reject(new Error('Scan script not found'));
    }

    return new Promise((resolve, reject) => {
        const args = [scanScript, '--target', target, '--ports', ports || '1-1024'];
        const child = spawn(PYTHON_BIN, args, { cwd: ROOT_DIR });

        let stdout = '';
        let stderr = '';

        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error('Scan timed out'));
        }, SCAN_TIMEOUT_MS);

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                reject(new Error(stderr.trim() || 'Scan failed'));
                return;
            }

            try {
                const parsed = JSON.parse(stdout);
                resolve(parsed);
            } catch (error) {
                reject(new Error('Invalid scan output'));
            }
        });
    });
}

async function postScanToServer(payload) {
    const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (error) {
            data = { raw: text };
        }
    }

    if (!response.ok) {
        throw new Error(data?.error || text || `Server error ${response.status}`);
    }

    return data;
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        const deepLink = getDeepLinkFromArgs(argv);
        if (deepLink) {
            handleDeepLink(deepLink);
        }

        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
});

ipcMain.handle('run-scan', async (_event, payload) => {
    const target = payload?.target || '';
    const ports = payload?.ports || '1-1024';

    const scanResult = await runPythonScan({ target, ports });
    const serverResult = await postScanToServer({
        ...scanResult,
        requested_at: new Date().toISOString(),
    });

    return { scanResult, serverResult };
});

app.whenReady().then(() => {
    registerProtocol();
    createWindow();

    const deepLink = getDeepLinkFromArgs(process.argv);
    if (deepLink) {
        handleDeepLink(deepLink);
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});