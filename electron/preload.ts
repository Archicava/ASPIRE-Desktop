import { contextBridge, ipcRenderer } from 'electron';

type DesktopApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

contextBridge.exposeInMainWorld('aspireDesktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  api: {
    baseUrl: () => ipcRenderer.invoke('aspire-api:base-url') as Promise<string>,
    request: (request: DesktopApiRequest) =>
      ipcRenderer.invoke('aspire-api:request', request) as Promise<DesktopApiResponse>
  }
});
