import { create } from 'zustand';
import { AlertConfig } from '@/types/alert';

interface AlertStore {
  alerts: AlertConfig[];
  addAlert: (alert: AlertConfig) => void;
  updateAlert: (id: string, alert: Partial<AlertConfig>) => void;
  deleteAlert: (id: string) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [
    {
      id: 'alert-1',
      configurationId: 'ORDER_FAILED_TO_ATTAIN_STAGE',
      configurationType: 'VALIDATION_RULES',
      effectiveEnd: '2025-12-31T00:00:00',
      effectiveStart: '2023-01-01T00:00:00',
      enabled: true,
      entity: 'ORDER',
      filterConditions: {
        conditionGroups: [
          {
            id: 'fg-1',
            conditions: [
              { id: 'fc-1', conditionType: 'EQUAL', name: 'orderType', value: 'BOPIS' },
            ],
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
              id: 'vg-1',
              conditions: [
                {
                  id: 'vc-1',
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
        },
      ],
      version: 1,
    },
    {
      id: 'alert-2',
      configurationId: 'ORDER_EXPIRED_ALERT',
      configurationType: 'VALIDATION_RULES',
      effectiveEnd: '2026-01-01T00:00:00',
      effectiveStart: '2023-06-01T00:00:00',
      enabled: true,
      entity: 'ORDER',
      filterConditions: {
        conditionGroups: [
          {
            id: 'fg-2',
            conditions: [
              { id: 'fc-2', conditionType: 'EQUAL', name: 'region', value: 'EAST' },
            ],
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
              id: 'vg-2',
              conditions: [
                {
                  id: 'vc-2',
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
        },
      ],
      version: 1,
    },
  ],
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  updateAlert: (id, updatedAlert) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, ...updatedAlert } : alert
      ),
    })),
  deleteAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    })),
}));
