import { create } from 'zustand';

export interface ConductorApiConfig {
  endpoint: string;
  apiKey?: string; // Optional, for authenticated Conductor instances
}

export interface ProxyServerConfig {
  enabled: boolean;
  proxyEndpoint: string; // GraphQL proxy server endpoint
  conductorServerUrl: string; // Actual Conductor server URL (used by proxy)
  conductorApiKey?: string; // Conductor API key (used by proxy)
  proxyPort?: number; // Port for the proxy server
}

export interface LLMConfig {
  apiKey: string;
  apiEndpoint: string;
  model?: string; // e.g., "gpt-4o", "gpt-3.5-turbo"
}

interface SettingsStore {
  conductorSettings: Record<string, unknown>;
  conductorApi: ConductorApiConfig;
  proxyServer: ProxyServerConfig;
  openAiLlm: LLMConfig;
  enableNotifications: boolean;
  autoSaveWorkflows: boolean; // Renamed for clarity
  isConnected: boolean;
  serverUrl: string;

  setConductorApiEndpoint: (endpoint: string) => void;
  setConductorApiKey: (apiKey: string) => void;
  setProxyServerEnabled: (enabled: boolean) => void;
  setProxyEndpoint: (endpoint: string) => void;
  setConductorServerUrl: (url: string) => void;
  setConductorServerApiKey: (apiKey: string) => void;
  setProxyPort: (port: number) => void;
  setOpenAiApiEndpoint: (endpoint: string) => void;
  setOpenAiApiKey: (apiKey: string) => void;
  setEnableNotifications: (enabled: boolean) => void;
  setAutoSaveWorkflows: (enabled: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setServerUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  conductorSettings: {}, // Add a default value for conductorSettings
  conductorApi: {
    endpoint: 'http://localhost:8080/api',
    apiKey: '',
  },
  proxyServer: {
    enabled: true,
    proxyEndpoint: 'http://localhost:4000/graphql',
    conductorServerUrl: 'http://localhost:8080',
    conductorApiKey: '',
    proxyPort: 4000,
  },
  openAiLlm: {
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o', // Default model
  },
  enableNotifications: true,
  autoSaveWorkflows: true,
  isConnected: false,
  serverUrl: '',

  setConductorApiEndpoint: (endpoint) =>
    set((state) => ({
      conductorApi: { ...state.conductorApi, endpoint },
    })),
  setConductorApiKey: (apiKey) =>
    set((state) => ({
      conductorApi: { ...state.conductorApi, apiKey },
    })),
  setProxyServerEnabled: (enabled) =>
    set((state) => ({
      proxyServer: { ...state.proxyServer, enabled },
    })),
  setProxyEndpoint: (endpoint) =>
    set((state) => ({
      proxyServer: { ...state.proxyServer, proxyEndpoint: endpoint },
    })),
  setConductorServerUrl: (url) =>
    set((state) => ({
      proxyServer: { ...state.proxyServer, conductorServerUrl: url },
    })),
  setConductorServerApiKey: (apiKey) =>
    set((state) => ({
      proxyServer: { ...state.proxyServer, conductorApiKey: apiKey },
    })),
  setProxyPort: (port) =>
    set((state) => ({
      proxyServer: { ...state.proxyServer, proxyPort: port },
    })),
  setOpenAiApiEndpoint: (endpoint) =>
    set((state) => ({
      openAiLlm: { ...state.openAiLlm, apiEndpoint: endpoint },
    })),
  setOpenAiApiKey: (apiKey) =>
    set((state) => ({
      openAiLlm: { ...state.openAiLlm, apiKey },
    })),
  setEnableNotifications: (enabled) => set({ enableNotifications: enabled }),
  setAutoSaveWorkflows: (enabled) => set({ autoSaveWorkflows: enabled }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setServerUrl: (url) => set({ serverUrl: url }),
}));
