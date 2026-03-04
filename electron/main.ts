import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const appId = 'com.aspire.desktop';
const defaultWebAppUrl = 'https://aspire-lab.archicava.com';
const webAppBaseUrl = resolveWebAppBaseUrl();
const appIconPath = resolveAppIconPath();

type DesktopApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const allowedMethods = new Set<DesktopApiMethod>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

type DesktopApiRequest = {
  path: string;
  method?: DesktopApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

type DesktopApiResponse = {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
};

let sessionCookie: string | null = null;
let sessionCookieName: string | null = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1080,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#f2f7ff',
    title: 'Aspire Lab',
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        void shell.openExternal(parsed.toString());
      }
    } catch {
      // Ignore malformed URLs.
    }
    return { action: 'deny' };
  });

  if (isDev) {
    window.loadURL('http://localhost:5173');
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function resolveWebAppBaseUrl(): string {
  const raw =
    process.env.ASPIRE_WEB_APP_URL ??
    process.env.WEB_APP_URL ??
    defaultWebAppUrl;
  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://') ? raw : `http://${raw}`;

  try {
    const url = new URL(withProtocol);
    return url.toString().replace(/\/$/, '');
  } catch {
    return defaultWebAppUrl;
  }
}

function resolveAppIconPath(): string | undefined {
  const iconFileNames =
    process.platform === 'win32'
      ? ['AspireIcon.ico', 'AspireIcon.png']
      : process.platform === 'darwin'
        ? ['AspireIcon.icns', 'AspireIcon.png']
        : ['AspireIcon.png', 'AspireIcon.ico'];

  const baseDirs = [
    path.join(process.resourcesPath, 'icons'),
    path.join(process.resourcesPath, 'img'),
    path.join(process.cwd(), 'img'),
    path.join(__dirname, '../img'),
    path.join(__dirname, '../../img')
  ];

  for (const baseDir of baseDirs) {
    for (const fileName of iconFileNames) {
      const candidate = path.join(baseDir, fileName);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
}

function updateSessionCookieFromResponse(response: Response): void {
  const cookies = getSetCookieHeaders(response);

  for (const cookie of cookies) {
    const firstPart = cookie.split(';')[0]?.trim();
    if (!firstPart || !firstPart.includes('=')) {
      continue;
    }

    const separatorIndex = firstPart.indexOf('=');
    const name = firstPart.slice(0, separatorIndex);
    const value = firstPart.slice(separatorIndex + 1);
    const shouldClear =
      /max-age=0/i.test(cookie) || /expires=thu,\s*01 jan 1970/i.test(cookie);

    if (shouldClear) {
      if (!sessionCookieName || sessionCookieName === name) {
        sessionCookieName = null;
        sessionCookie = null;
      }
      continue;
    }

    sessionCookieName = name;
    sessionCookie = `${name}=${value}`;
  }
}

ipcMain.handle(
  'aspire-api:request',
  async (_event, request: DesktopApiRequest): Promise<DesktopApiResponse> => {
    if (!request || typeof request.path !== 'string' || !request.path.startsWith('/api/')) {
      return {
        ok: false,
        status: 400,
        error: 'Invalid API path. Only "/api/*" endpoints are allowed.'
      };
    }

    const method = request.method ?? 'GET';
    if (!allowedMethods.has(method)) {
      return {
        ok: false,
        status: 400,
        error: 'Invalid API method.'
      };
    }
    const hasBody = request.body !== undefined && method !== 'GET';

    try {
      const url = new URL(request.path, webAppBaseUrl);
      const headers = new Headers(request.headers ?? {});

      if (hasBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (sessionCookie) {
        headers.set('Cookie', sessionCookie);
      }

      const response = await fetch(url, {
        method,
        headers,
        body: hasBody ? JSON.stringify(request.body) : undefined
      });

      updateSessionCookieFromResponse(response);

      const contentType = response.headers.get('content-type') ?? '';
      let data: unknown = null;

      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        const responseError =
          typeof (data as { error?: unknown })?.error === 'string'
            ? ((data as { error: string }).error)
            : response.statusText || 'Request failed';

        return {
          ok: false,
          status: response.status,
          data,
          error: responseError
        };
      }

      return {
        ok: true,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }
);

ipcMain.handle('aspire-api:base-url', () => webAppBaseUrl);

app.whenReady().then(() => {
  app.setName('Aspire Lab');
  app.setAppUserModelId(appId);

  if (process.platform === 'darwin' && app.dock && appIconPath) {
    app.dock.setIcon(appIconPath);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
