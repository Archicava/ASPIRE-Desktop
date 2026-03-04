/// <reference types="vite/client" />

declare global {
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

  interface Window {
    aspireDesktop: {
      platform: string;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
      api: {
        baseUrl: () => Promise<string>;
        request: (request: DesktopApiRequest) => Promise<DesktopApiResponse>;
      };
    };
  }
}

export {};
