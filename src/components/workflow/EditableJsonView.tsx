import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useToast } from '@/hooks/use-toast';
import { AlertCircleIcon, CheckCircle2Icon, SaveIcon, RefreshCwIcon } from 'lucide-react';

export default function EditableJsonView() {
  const { toast } = useToast();
  const { selectedWorkflow, canvasNodes, updateWorkflow } = useWorkflowStore();
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedWorkflow) {
      console.log('=== EditableJsonView updating ===');
      console.log('Canvas nodes:', canvasNodes);
      
      const workflowJson = {
        description: selectedWorkflow.description || '',
        version: selectedWorkflow.version || 1,
        effectiveDate: selectedWorkflow.createdAt || '',
        endDate: '',
        status: selectedWorkflow.status || 'DRAFT',
        tasks: canvasNodes.map((node, index) => {
          console.log(`Processing node ${index + 1} for JSON view:`, node);
          
          if (node.config) {
            console.log(`Node ${index + 1} config:`, node.config);
            
            const taskJson: any = {
              taskRefId: node.config.taskRefId || `task_ref_${index + 1}`,
              taskId: node.config.taskId || `task_${index + 1}`,
              taskType: node.config.taskType,
              sequenceNo: node.config.sequenceNo || (index + 1),
            };

            // Add taskListDomain if it exists
            if (node.config.taskListDomain) {
              taskJson.taskListDomain = node.config.taskListDomain;
            }

            // Add taskinputParameters if they exist
            if (node.config.taskinputParameters) {
              taskJson.taskinputParameters = node.config.taskinputParameters;
            }

            // For Decision tasks, add caseValues and output
            if (node.config.taskType === 'DECISION' && node.config.caseValues) {
              console.log('Adding caseValues to JSON:', node.config.caseValues);
              taskJson.caseValues = node.config.caseValues;
              taskJson.output = node.config.output || {};
            }

            return taskJson;
          } else {
            return {
              taskRefId: `${node.name.replaceAll(/\s+/g, '-').toLowerCase()}-${index + 1}-taskref`,
              taskId: `${node.name.replaceAll(/\s+/g, '-').toLowerCase()}-task`,
              taskType: node.type || 'GENERIC',
              taskListDomain: 'DEFAULT-TASKLIST',
              sequenceNo: index + 1,
            };
          }
        }),
        inputParameters: selectedWorkflow.inputParameters || [],
        outputParameters: selectedWorkflow.outputParameters || {},
        timeoutSeconds: selectedWorkflow.timeoutSeconds || 3600,
        restartable: selectedWorkflow.restartable ?? true,
      };
      
      console.log('Final workflow JSON:', workflowJson);
      setJsonText(JSON.stringify(workflowJson, null, 2));
      setHasChanges(false);
    }
  }, [selectedWorkflow, canvasNodes]);

  const validateJson = (text: string): boolean => {
    try {
      JSON.parse(text);
      setJsonError('');
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setHasChanges(true);
    validateJson(value);
  };

  const handleSave = () => {
    if (!validateJson(jsonText)) {
      toast({
        title: 'Invalid JSON',
        description: 'Please fix JSON errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const parsedWorkflow = JSON.parse(jsonText);
      
      if (!selectedWorkflow) {
        toast({
          title: 'No workflow selected',
          description: 'Please select a workflow first.',
          variant: 'destructive',
        });
        return;
      }

      updateWorkflow(selectedWorkflow.id, {
        description: parsedWorkflow.description,
        version: parsedWorkflow.version,
        inputParameters: parsedWorkflow.inputParameters,
        outputParameters: parsedWorkflow.outputParameters,
        timeoutSeconds: parsedWorkflow.timeoutSeconds,
        restartable: parsedWorkflow.restartable,
      });

      setHasChanges(false);
      
      toast({
        title: 'JSON Saved',
        description: 'Workflow JSON has been updated successfully.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save workflow JSON.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    if (selectedWorkflow) {
      const workflowJson = {
        description: selectedWorkflow.description || '',
        version: selectedWorkflow.version || 1,
        effectiveDate: selectedWorkflow.createdAt || '',
        endDate: '',
        status: selectedWorkflow.status || 'DRAFT',
        tasks: canvasNodes.map((node, index) => {
          if (node.config) {
            return {
              taskRefId: node.config.taskRefId || `task_ref_${index + 1}`,
              taskId: node.config.taskId || `task_${index + 1}`,
              taskType: node.config.taskType,
              taskListDomain: node.config.taskListDomain || 'DEFAULT-TASKLIST',
              sequenceNo: node.config.sequenceNo || (index + 1),
              taskinputParameters: node.config.taskinputParameters,
            };
          } else {
            return {
              taskRefId: `${node.name.replaceAll(/\s+/g, '-').toLowerCase()}-${index + 1}-taskref`,
              taskId: `${node.name.replaceAll(/\s+/g, '-').toLowerCase()}-task`,
              taskType: node.type || 'GENERIC',
              taskListDomain: 'DEFAULT-TASKLIST',
              sequenceNo: index + 1,
            };
          }
        }),
        inputParameters: selectedWorkflow.inputParameters || [],
        outputParameters: selectedWorkflow.outputParameters || {},
        timeoutSeconds: selectedWorkflow.timeoutSeconds || 3600,
        restartable: selectedWorkflow.restartable ?? true,
      };
      setJsonText(JSON.stringify(workflowJson, null, 2));
      setHasChanges(false);
      setJsonError('');
      
      toast({
        title: 'JSON Reset',
        description: 'Changes have been discarded.',
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {jsonError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">Invalid JSON</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2Icon className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">Valid JSON</span>
            </div>
          )}
          {hasChanges && (
            <span className="text-xs text-warning">• Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
            className="bg-transparent text-foreground border-border hover:bg-accent"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!!jsonError || !hasChanges}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <SaveIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Save Changes
          </Button>
        </div>
      </div>

      {jsonError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertCircleIcon className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-xs font-medium text-destructive">JSON Syntax Error</p>
              <p className="text-xs text-destructive/80 mt-1">{jsonError}</p>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 rounded-lg border border-border flex">
        <div className="flex w-full">
          {/* Line Numbers */}
          <div className="bg-muted/50 border-r border-border p-4 text-right select-none">
            {jsonText.split('\n').map((line, i) => (
              <div key={`line-${i}-${line.length}`} className="text-xs text-muted-foreground font-mono leading-6 h-6">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Code Editor */}
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="min-h-[600px] font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none flex-1"
            placeholder="Workflow JSON will appear here..."
          />
        </div>
      </ScrollArea>

      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-xs font-medium text-foreground mb-2">JSON Editor Tips:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Edit the JSON directly to modify workflow configuration</li>
          <li>Changes must be saved before they take effect</li>
          <li>Invalid JSON will prevent saving</li>
          <li>Use Reset to discard unsaved changes</li>
        </ul>
      </div>
    </div>
  );
}
