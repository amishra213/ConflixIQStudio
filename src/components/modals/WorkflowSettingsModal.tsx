import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface WorkflowSettings {
  name: string;
  description: string;
  version: number;
  timeoutSeconds: number;
  restartable: boolean;
  schemaVersion: number;
  orgId: string;
  workflowId: string;
  effectiveDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  inputParameters: string[];
  outputParameters: Record<string, any>;
}

interface WorkflowSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: WorkflowSettings) => void;
  initialSettings?: WorkflowSettings | null;
}

export function WorkflowSettingsModal({
  open,
  onOpenChange,
  onSave,
  initialSettings,
}: WorkflowSettingsModalProps) {
  const [settings, setSettings] = useState<WorkflowSettings>({
    name: '',
    description: '',
    version: 1,
    timeoutSeconds: 3600,
    restartable: true,
    schemaVersion: 2,
    orgId: 'ORG001',
    workflowId: '',
    effectiveDate: '',
    endDate: '',
    status: 'DRAFT',
    inputParameters: [],
    outputParameters: {},
  });

  const [inputParamsText, setInputParamsText] = useState('');
  const [outputParamsJson, setOutputParamsJson] = useState('{}');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      if (initialSettings) {
        setSettings(initialSettings);
        setInputParamsText(initialSettings.inputParameters.join(', '));
        setOutputParamsJson(JSON.stringify(initialSettings.outputParameters, null, 2));
      } else {
        // Generate default values for new workflow
        const timestamp = Date.now();
        const defaultSettings = {
          name: `New Workflow ${timestamp}`,
          description: 'A new workflow definition',
          version: 1,
          timeoutSeconds: 3600,
          restartable: true,
          schemaVersion: 2,
          orgId: 'ORG001',
          workflowId: `workflow-${timestamp}`,
          effectiveDate: formatDate(new Date()),
          endDate: formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 10))),
          status: 'DRAFT' as const,
          inputParameters: [],
          outputParameters: {},
        };
        setSettings(defaultSettings);
        setInputParamsText('');
        setOutputParamsJson('{}');
      }
      setJsonError('');
    }
  }, [open, initialSettings]);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).
