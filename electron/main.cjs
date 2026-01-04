const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function startPythonBackend() {
    const isDev = !app.isPackaged;
    let pythonExecutable;
    let scriptArgs = [];

    const rootDir = isDev
        ? path.join(__dirname, '..')
        : process.resourcesPath;

    if (isDev) {
        // Development (Source)
        pythonExecutable = path.join(rootDir, 'python', 'venv', 'bin', 'python');
        const scriptPath = path.join(rootDir, 'python', 'server.py');
        scriptArgs = [scriptPath];
        console.log('Running in Development Mode');
    } else {
        // Production (Binary)
        // In prod, electron-builder puts extraResources in Contents/Resources/
        // We will configure it to put 'dist-python/server' there.
        pythonExecutable = path.join(rootDir, 'server');
        console.log('Running in Production Mode');
    }

    console.log(`Starting Python server...`);
    console.log(`Executable: ${pythonExecutable}`);

    if (isDev) {
        pythonProcess = spawn(pythonExecutable, scriptArgs);
    } else {
        // In prod, the executable IS the script.
        pythonProcess = spawn(pythonExecutable, [], {
            cwd: rootDir // Ensure it runs with local context if needed
        });
    }

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python API]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "MusicBoi",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For easier IPC if needed later, but careful with security
        },
        backgroundColor: '#0f0f11' // Match app theme
    });

    // In development, load from Vite dev server
    // In production, load from dist
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

    console.log(`Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    startPythonBackend();
    createWindow();
});

app.on('window-all-closed', function () {
    // Kill python process
    if (pythonProcess) {
        pythonProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
