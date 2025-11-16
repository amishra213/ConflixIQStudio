import { ReactNode, useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface BaseTaskConfig {
  name?: string;
  taskReferenceName?: string;
  description?: string;
  taskRefId?: string;
  taskType?: string;
  type?: string;
  [key: string]: any;
}

export interface BaseTaskModalProps<T extends BaseTaskConfig> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: T) => void;
  initialConfig?: T | null;
  title: string;
  description?: string;
  children?: ReactNode;
  hideJsonTab?: boolean;
  customBasicFields?: ReactNode;
  customTabs?: Array<{
    id: string;
    label: string;
    content: ReactNode;
  }>;
  validateConfig?: (config: T) => string | null;
  buttonLabel?: string;
}

export function BaseTaskModal<T extends BaseTaskConfig>({
  open,
  onOpenChange,
  onSave,
  initialConfig,
  title,
  description,
  children,
  hideJsonTab = false,
  customBasicFields,
  customTabs = [],
  validateConfig,
  buttonLabel = 'Save Configuration',
}: Readonly<BaseTaskModalProps<T>>) {
  const [config, setConfig] = useState<T>({} as T);
  const [completeConfigJson, setCompleteConfigJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [isEditingJson, setIsEditingJson] = useState(false);

  const isFirstOpen = useRef(true);

  useEffect(() => {
    if (open) {
      if (isFirstOpen.current) {
        // First time modal opens - initialize with initialConfig
        if (initialConfig) {
          setConfig(initialConfig);
          setCompleteConfigJson(JSON.stringify(initialConfig, null, 2));
        } else {
          setConfig({} as T);
          setCompleteConfigJson(JSON.stringify({}, null, 2));
        }
        setJsonError('');
        setIsEditingJson(false);
        isFirstOpen.current = false;
      } else if (initialConfig) {
        // Modal already open - merge initialConfig into existing config
        // This preserves user-edited fields while updating custom fields
        setConfig((prev) => ({
          ...initialConfig,
          // Preserve base fields that user may have edited
          name: prev.name || initialConfig.name,
          taskReferenceName: prev.taskReferenceName || initialConfig.taskReferenceName,
          description: prev.description || initialConfig.description,
          taskRefId: prev.taskRefId || initialConfig.taskRefId,
        }));
      }
    } else {
      // Reset the flag when modal closes
      isFirstOpen.current = true;
    }
  }, [open, initialConfig]);

  // Update complete config JSON whenever config changes
  useEffect(() => {
    if (!isEditingJson) {
      setCompleteConfigJson(JSON.stringify(config, null, 2));
    }
  }, [config, isEditingJson]);

  const validateJson = (value: string): boolean => {
    if (!value.trim()) {
      setJsonError('');
      return true;
    }
    try {
      JSON.parse(value);
      setJsonError('');
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
  };

  const handleCompleteConfigChange = (value: string) => {
    setCompleteConfigJson(value);
    setIsEditingJson(true);
    validateJson(value);
  };

  const handleSave = () => {
    try {
      let finalConfig: T;

      // If user edited the JSON tab, use that
      if (isEditingJson && completeConfigJson.trim()) {
        const parsed = JSON.parse(completeConfigJson);
        finalConfig = parsed;
      } else {
        finalConfig = config;
      }

      // Run custom validation if provided
      if (validateConfig) {
        const error = validateConfig(finalConfig);
        if (error) {
          setJsonError(error);
          return;
        }
      }

      // Default validation for common fields
      if (finalConfig.name !== undefined && (!finalConfig.name || finalConfig.name.trim() === '')) {
        setJsonError('Name is required');
        return;
      }
      if (
        finalConfig.taskReferenceName !== undefined &&
        (!finalConfig.taskReferenceName || finalConfig.taskReferenceName.trim() === '')
      ) {
        setJsonError('Task Reference Name is required');
        return;
      }
      if (finalConfig.taskRefId !== undefined && (!finalConfig.taskRefId || finalConfig.taskRefId.trim() === '')) {
        setJsonError('Task Ref ID is required');
        return;
      }

      onSave(finalConfig);
      onOpenChange(false);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Failed to save configuration');
    }
  };

  const updateConfig = (updates: Partial<T>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setJsonError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">{title}</DialogTitle>
          {description && <DialogDescription className="text-sm text-gray-400">{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419] border-[#2a3142]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              {customTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
              {!hideJsonTab && <TabsTrigger value="json">JSON Config</TabsTrigger>}
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Task Information</h3>
                <div className="space-y-4">
                  {/* Task Ref ID (for operators) */}
                  {config.taskRefId !== undefined && (
                    <div>
                      <Label className="text-white">Task Ref ID *</Label>
                      <Input
                        value={config.taskRefId || ''}
                        onChange={(e) => updateConfig({ taskRefId: e.target.value } as Partial<T>)}
                        placeholder="e.g., task-1"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                  )}

                  {/* Name field */}
                  {config.name !== undefined && (
                    <div>
                      <Label className="text-white">Name {config.taskReferenceName !== undefined && '*'}</Label>
                      <Input
                        value={config.name || ''}
                        onChange={(e) => updateConfig({ name: e.target.value } as Partial<T>)}
                        placeholder="e.g., My Task"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                  )}

                  {/* Task Reference Name (for system tasks) */}
                  {config.taskReferenceName !== undefined && (
                    <div>
                      <Label className="text-white">Task Reference Name *</Label>
                      <Input
                        value={config.taskReferenceName || ''}
                        onChange={(e) => updateConfig({ taskReferenceName: e.target.value } as Partial<T>)}
                        placeholder="e.g., task_ref"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Unique reference name for this task instance in the workflow
                      </p>
                    </div>
                  )}

                  {/* Task Type (display only) */}
                  {(config.taskType || config.type) && (
                    <div>
                      <Label className="text-white">Task Type</Label>
                      <Input
                        value={config.taskType || config.type || ''}
                        disabled
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] opacity-60"
                      />
                    </div>
                  )}

                  {/* Description field */}
                  {config.description !== undefined && (
                    <div>
                      <Label className="text-white">Description</Label>
                      <Textarea
                        value={config.description || ''}
                        onChange={(e) => updateConfig({ description: e.target.value } as Partial<T>)}
                        placeholder="Describe this task"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[80px]"
                      />
                    </div>
                  )}

                  {/* Custom basic fields */}
                  {customBasicFields}
                </div>
              </Card>

              {/* Children content in basic tab */}
              {children}
            </TabsContent>

            {/* Custom Tabs */}
            {customTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                {tab.content}
              </TabsContent>
            ))}

            {/* JSON Config Tab */}
            {!hideJsonTab && (
              <TabsContent value="json" className="space-y-4">
                <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                  <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    You can edit the JSON directly here. Changes will override form values.
                  </p>
                  <Textarea
                    value={completeConfigJson}
                    onChange={(e) => handleCompleteConfigChange(e.target.value)}
                    className="font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[500px]"
                  />
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {jsonError && (
          <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/50 flex-shrink-0">
            <p className="text-sm text-red-400">{jsonError}</p>
          </div>
        )}

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium">
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
