import { create } from 'zustand';

export interface ConductorApiConfig {
  endpoint: string;
  apiKey?: string; // Optional, for authenticated Conductor instances
}

export interface LLMConfig {
  apiKey: string;
  apiEndpoint: string;
  model?: string; // e.g., "gpt-4o", "gpt-3.5-turbo"
}

interface SettingsStore {
  conductorApi: ConductorApiConfig;
  openAiLlm: LLMConfig;
  enableNotifications: boolean;
  autoSaveWorkflows: boolean; // Renamed for clarity

  setConductorApiEndpoint: (endpoint: string) => void;
  setConductorApiKey: (apiKey: string) => void;
  setOpenAiApiEndpoint: (endpoint: string) => void;
  setOpenAiApiKey: (apiKey: string) => void;
  setEnableNotifications: (enabled: boolean) => void;
  setAutoSaveWorkflows: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  conductorApi: {
    endpoint: 'http://localhost:8080/api',
    apiKey: '',
  },
  openAiLlm: {
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o', // Default model
  },
  enableNotifications: true,
  autoSaveWorkflows: true,

  setConductorApiEndpoint: (endpoint) => set((state) => ({
    conductorApi: { ...state.conductorApi, endpoint }
  })),
  setConductorApiKey: (apiKey) => set((state) => ({
    conductorApi: { ...state.conductorApi, apiKey }
  })),
  setOpenAiApiEndpoint: (endpoint) => set((state) => ({
    openAiLlm: { ...state.openAiLlm, apiEndpoint: endpoint }
  })),
  setOpenAiApiKey: (apiKey) => set((state) => ({
    openAiLlm: { ...state.openAiLlm, apiKey }
  })),
  setEnableNotifications: (enabled) => set({ enableNotifications: enabled }),
  setAutoSaveWorkflows: (enabled) => set({ autoSaveWorkflows: enabled }),
}));
