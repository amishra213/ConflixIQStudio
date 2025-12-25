import { ReactNode, useState, useEffect } from 'react';
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
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface BaseTaskConfig {
  name?: string;
  taskReferenceName?: string;
  description?: string;
  taskType?: string;
  type?: string;
  [key: string]: unknown;
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

  useEffect(() => {
    if (open) {
      console.log('[BaseTaskModal] Modal open, initialConfig:', initialConfig);

      // Whenever modal opens or initialConfig changes, update the form with the new config
      if (initialConfig) {
        console.log('[BaseTaskModal] Initializing with initialConfig');
        // Ensure taskReferenceName is set
        const configWithRef = {
          ...initialConfig,
        };
        if (!configWithRef.taskReferenceName || configWithRef.taskReferenceName.trim() === '') {
          configWithRef.taskReferenceName = `task_ref_${Date.now()}`;
          console.log(
            '[BaseTaskModal] Generated default taskReferenceName:',
            configWithRef.taskReferenceName
          );
        }
        setConfig(configWithRef);
        setCompleteConfigJson(JSON.stringify(configWithRef, null, 2));
      } else {
        console.log('[BaseTaskModal] No initialConfig, using empty');
        setConfig({} as T);
        setCompleteConfigJson(JSON.stringify({}, null, 2));
      }
      setJsonError('');
      setIsEditingJson(false);
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

  const validateAndGenerateDefaults = (cfg: T): string | null => {
    // Ensure taskReferenceName is generated if needed
    if (
      cfg.taskReferenceName !== undefined &&
      (!cfg.taskReferenceName || cfg.taskReferenceName.trim() === '')
    ) {
      cfg.taskReferenceName = `task_ref_${Date.now()}`;
    }

    // Validate name
    if (cfg.name !== undefined && (!cfg.name || cfg.name.trim() === '')) {
      return 'Name is required';
    }

    // Validate taskReferenceName
    if (
      cfg.taskReferenceName !== undefined &&
      (!cfg.taskReferenceName || cfg.taskReferenceName.trim() === '')
    ) {
      return 'Task Reference Name is required and cannot be empty';
    }

    return null;
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

      // Validate and generate defaults
      const validationError = validateAndGenerateDefaults(finalConfig);
      if (validationError) {
        setJsonError(validationError);
        return;
      }

      // Run custom validation if provided
      if (validateConfig) {
        const error = validateConfig(finalConfig);
        if (error) {
          setJsonError(error);
          return;
        }
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
      <DialogContent className="max-w-4xl h-[85vh] bg-card border-border text-foreground flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-background border-border">
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
              <Card className="p-6 bg-background border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Information</h3>
                <div className="space-y-4">
                  {/* Name field */}
                  {config.name !== undefined && (
                    <div>
                      <Label className="text-foreground">
                        Name {config.taskReferenceName !== undefined && '*'}
                      </Label>
                      <Input
                        value={config.name || ''}
                        onChange={(e) => updateConfig({ name: e.target.value } as Partial<T>)}
                        placeholder="e.g., My Task"
                        className="mt-2 bg-card text-foreground border-border"
                      />
                    </div>
                  )}

                  {/* Task Reference Name (for system tasks) */}
                  {config.taskReferenceName !== undefined && (
                    <div>
                      <Label className="text-foreground">Task Reference Name *</Label>
                      <Input
                        value={config.taskReferenceName || ''}
                        onChange={(e) =>
                          updateConfig({ taskReferenceName: e.target.value } as Partial<T>)
                        }
                        placeholder="e.g., task_ref"
                        className="mt-2 bg-card text-foreground border-border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Unique reference name for this task instance in the workflow
                      </p>
                    </div>
                  )}

                  {/* Task Type (display only) */}
                  {(config.taskType || config.type) && (
                    <div>
                      <Label className="text-foreground">Task Type</Label>
                      <Input
                        value={config.taskType || config.type || ''}
                        disabled
                        className="mt-2 bg-card text-foreground border-border opacity-60"
                      />
                    </div>
                  )}

                  {/* Description field */}
                  {config.description !== undefined && (
                    <div>
                      <Label className="text-foreground">Description</Label>
                      <Textarea
                        value={config.description || ''}
                        onChange={(e) =>
                          updateConfig({ description: e.target.value } as Partial<T>)
                        }
                        placeholder="Describe this task"
                        className="mt-2 bg-card text-foreground border-border min-h-[80px]"
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
                <Card
                  className="p-6 bg-background border-border"
                  style={{ '--line-height': '1.5rem' } as React.CSSProperties}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Complete Configuration JSON
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can edit the JSON directly here. Changes will override form values.
                  </p>
                  <JsonTextarea
                    value={completeConfigJson}
                    onChange={(value) => handleCompleteConfigChange(value)}
                    className="font-mono text-sm bg-card text-foreground min-h-[500px]"
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

        <DialogFooter className="border-t border-border px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
