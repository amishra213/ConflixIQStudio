import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Card } from '@/components/ui/card';
import { PlayIcon, AlertCircleIcon } from 'lucide-react';
import { Workflow } from '@/stores/workflowStore';
import { validateJsonString, generateLineNumbersHtml } from '@/utils/jsonValidation';

interface ExecuteWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: Workflow | null;
  onExecute: (workflowId: string, input: Record<string, unknown>) => void;
}

const defaultInputTemplate = {
  orderType: 'BOPIS',
  shipNode: 'DC001',
  customerId: 'CUST123',
  items: [
    {
      itemId: 'ITEM001',
      quantity: 2,
      price: 29.99,
    },
  ],
};

export function ExecuteWorkflowModal({
  open,
  onOpenChange,
  workflow,
  onExecute,
}: Readonly<ExecuteWorkflowModalProps>) {
  const [inputJson, setInputJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && workflow) {
      // Set default input template
      setInputJson(JSON.stringify(defaultInputTemplate, null, 2));
      setJsonError('');
      setIsValidJson(true);
      setErrorLine(null);
    }
  }, [open, workflow]);

  const validateJson = (value: string) => {
    const result = validateJsonString(value);
    setJsonError(result.errorMessage);
    setIsValidJson(result.isValid);
    setErrorLine(result.errorLine);
  };

  const [errorLine, setErrorLine] = useState<number | null>(null);

  const updateLineNumbers = useCallback(
    (text: string) => {
      const lines = text.split('\n').length;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.innerHTML = generateLineNumbersHtml(lines, errorLine);
      }
    },
    [errorLine]
  );

  const handleInputChange = (value: string) => {
    setInputJson(value);
    updateLineNumbers(value);
    validateJson(value);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (open && inputJson) {
      updateLineNumbers(inputJson);
    }
  }, [open, inputJson, errorLine, updateLineNumbers]);

  const handleExecute = () => {
    if (!workflow) return;

    const parsedInput = parseInputJson();
    if (parsedInput === null) return;

    onExecute(workflow.id, parsedInput);
    onOpenChange(false);
  };

  const parseInputJson = () => {
    if (inputJson.trim() === '') {
      return {};
    }

    try {
      return JSON.parse(inputJson);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Please fix JSON errors before executing';
      setJsonError(errorMessage);
      setIsValidJson(false);
      setErrorLine(null);
      return null;
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleUseTemplate = () => {
    setInputJson(JSON.stringify(defaultInputTemplate, null, 2));
    setJsonError('');
    setIsValidJson(true);
    setErrorLine(null);
  };

  const handleClearInput = () => {
    setInputJson('{}');
    setJsonError('');
    setIsValidJson(true);
    setErrorLine(null);
  };

  if (!workflow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-card border-border text-foreground flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-foreground">Execute Workflow</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Execute the workflow with input parameters. Workflow:{' '}
            <span className="text-cyan-400 font-medium">{workflow.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Workflow Info */}
            <Card className="p-4 bg-background border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <PlayIcon className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{workflow.name}</h3>
                  <p className="text-xs text-muted-foreground">{workflow.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Status:{' '}
                      <span className="text-green-400 font-medium">
                        {workflow.status.toUpperCase()}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Created: {new Date(workflow.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* JSON Validation Messages */}
            {jsonError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <AlertCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-400">JSON Validation Error</p>
                  <p className="text-xs text-red-300 mt-1 font-mono">{jsonError}</p>
                  <p className="text-xs text-red-200 mt-2">
                    Please check the syntax at the specified line and ensure proper JSON formatting.
                  </p>
                </div>
              </div>
            )}

            {isValidJson && inputJson.trim() !== '' && !jsonError && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                <svg
                  className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-400">Valid JSON format</p>
              </div>
            )}

            {/* Input Parameters */}
            <Card className="p-6 bg-background border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-foreground font-medium text-base">Input Parameters</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide input data in JSON format (optional)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseTemplate}
                    className="text-cyan-500 border-border hover:bg-cyan-500/10 hover:text-cyan-400"
                  >
                    Use Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearInput}
                    className="text-muted-foreground border-border hover:bg-[#2a3142] hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="flex border border-border rounded-md overflow-hidden">
                  {/* Line Numbers */}
                  <div
                    ref={lineNumbersRef}
                    className="bg-background text-muted-foreground text-right pr-3 pl-2 py-2 select-none overflow-hidden"
                    style={{
                      minWidth: '50px',
                      maxHeight: '300px',
                      overflowY: 'hidden',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      fontFamily: 'monospace',
                    }}
                  >
                    <div className="line-number">1</div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputJson}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onScroll={handleScroll}
                    placeholder="Enter JSON input parameters..."
                    className={`flex-1 font-mono text-sm bg-card text-foreground p-2 focus:outline-none focus:ring-1 resize-none ${
                      isValidJson ? 'focus:ring-cyan-500' : 'focus:ring-red-500'
                    }`}
                    style={{
                      minHeight: '300px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                      lineHeight: '1.5',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Example Input */}
            <Card className="p-6 bg-background border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Example Input Structure</h3>
              <pre className="text-xs text-muted-foreground font-mono bg-card p-4 rounded-lg border border-border overflow-x-auto">
                {`{
  "orderType": "BOPIS",
  "shipNode": "DC001",
  "customerId": "CUST123",
  "items": [
    {
      "itemId": "ITEM001",
      "quantity": 2,
      "price": 29.99
    }
  ]
}`}
              </pre>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!isValidJson}
            className="bg-cyan-500 text-foreground hover:bg-cyan-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Execute Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

