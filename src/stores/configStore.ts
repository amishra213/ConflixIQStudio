import { create } from 'zustand';
import { Config, AlertConfig } from '@/types/config';
import { v4 as uuidv4 } from 'uuid';

interface ConfigStore {
  configs: Config[];
  addConfig: (config: Config) => void;
  updateConfig: (id: string, config: Partial<Config>) => void;
  deleteConfig: (id: string) => void;
}

const initialAlerts: AlertConfig[] = [
  {
    id: uuidv4(),
    configurationId: 'ORDER_FAILED_TO_ATTAIN_STAGE',
    configurationType: 'VALIDATION_RULES',
    effectiveEnd: '2025-12-31',
    effectiveStart: '2023-01-01',
    enabled: true,
    entity: 'ORDER',
    filterConditions: {
      conditionGroups: [
        {
          id: uuidv4(),
          conditions: [{ id: uuidv4(), conditionType: 'EQUAL', name: 'orderType', value: 'BOPIS' }],
          joinType: 'AND',
        },
      ],
      description: 'Filter for BOPIS orders',
      joinType: 'AND',
    },
    operationType: 'ALERT',
    orgId: 'ORG001',
    priority: 1,
    updateTime: new Date().toISOString(),
    updateUser: 'system',
    validationConditions: [
      {
        conditionGroups: [
          {
            id: uuidv4(),
            conditions: [
              {
                id: uuidv4(),
                conditionType: 'NOT_DEFINED',
                name: 'orderStatus.details[].stage',
                value: 'PACKED',
                duration: '1',
                uom: 'HOURS',
                message: 'Order failed to reach PACKED stage within 1 hour',
              },
            ],
            joinType: 'AND',
          },
        ],
        description: 'Order stage validation',
        joinType: 'AND',
        id: 0,
      },
    ],
    version: 1,
  },
  {
    id: uuidv4(),
    configurationId: 'ORDER_EXPIRED_ALERT',
    configurationType: 'VALIDATION_RULES',
    effectiveEnd: '2026-01-01',
    effectiveStart: '2023-06-01',
    enabled: true,
    entity: 'ORDER',
    filterConditions: {
      conditionGroups: [
        {
          id: uuidv4(),
          conditions: [{ id: uuidv4(), conditionType: 'EQUAL', name: 'region', value: 'EAST' }],
          joinType: 'AND',
        },
      ],
      description: 'Filter for EAST region orders',
      joinType: 'AND',
    },
    operationType: 'ALERT',
    orgId: 'ORG001',
    priority: 2,
    updateTime: new Date().toISOString(),
    updateUser: 'system',
    validationConditions: [
      {
        conditionGroups: [
          {
            id: uuidv4(),
            conditions: [
              {
                id: uuidv4(),
                conditionType: 'AFTER',
                name: 'orderExpirationDate',
                value: '${currentTime}',
                message: 'Order has expired',
              },
            ],
            joinType: 'AND',
          },
        ],
        description: 'Order expiration check',
        joinType: 'AND',
        id: 0,
      },
    ],
    version: 1,
  },
];

export const useConfigStore = create<ConfigStore>((set) => ({
  configs: initialAlerts,
  addConfig: (config) => set((state) => ({ configs: [...state.configs, config] })),
  updateConfig: (id, updatedConfig) =>
    set((state) => ({
      configs: state.configs.map((config) =>
        config.id === id ? { ...config, ...updatedConfig } : config
      ),
    })),
  deleteConfig: (id) =>
    set((state) => ({
      configs: state.configs.filter((config) => config.id !== id),
    })),
}));
