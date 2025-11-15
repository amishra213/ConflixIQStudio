import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { Workflow } from '@/stores/workflowStore';

interface ValidateWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: Workflow | null;
  onValidate: (workflowId: string, input: any, llmContext?: string) => void;
}

const defaultInputTemplate = {
  orderType: "BOPIS",
  shipNode: "DC001",
  customerId: "CUST123",
  items: [
    {
      itemId: "ITEM001",
      quantity: 2,
      price: 29.99
    }
  ]
};

export function ValidateWorkflowModal({
  open,
  onOpenChange,
  workflow,
  onValidate,
}: ValidateWorkflowModalProps) {
  const [inputJson, setInputJson] = useState('');
  const [llmContext, setLlmContext] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const contextTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && workflow) {
      setInputJson(JSON.stringify(defaultInputTemplate, null, 2));
      setLlmContext('');
      setJsonError('');
      setIsValidJson(true);
      setErrorLine(null);
    }
  }, [open, workflow]);

  const validateJson = (value: string) => {
    try {
      if (value.trim() === '') {
        setJsonError('');
        setIsValidJson(true);
        setErrorLine(null);
        return;
      }
      JSON.parse(value);
      setJsonError('');
      setIsValidJson(true);
      setErrorLine(null);
    } catch (error) {
      let errorMessage = 'Invalid JSON format';
      let lineNumber: number | null = null;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        const positionMatch = errorMessage.match(/position (\d+)/i) ||
                             errorMessage.match(/at position (\d+)/i) ||
                             errorMessage.match(/character (\d+)/i);
        
        if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const textBeforeError = value.substring(0, position);
          lineNumber = textBeforeError.split('\n').length;
          
          const lastNewline = textBeforeError.lastIndexOf('\n');
          const column = position - lastNewline;
          
          errorMessage = errorMessage.replace(/position \d+/i, `line ${lineNumber}, column ${column}`);
        }
        
        const directLineMatch = errorMessage.match(/line (\d+)/i);
        if (directLineMatch && !lineNumber) {
          lineNumber = parseInt(directLineMatch[1]);
        }
      }
      
      setErrorLine(lineNumber);
      
      if (lineNumber) {
        setJsonError(`Line ${lineNumber}: ${errorMessage}`);
      } else {
        setJsonError(errorMessage);
      }
      setIsValidJson(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputJson(value);
    updateLineNumbers(value);
    validateJson(value);
  };

  const updateLineNumbers = (text: string) => {
    const lines = text.split('\n').length;
    if (lineNumbersRef.current) {
      lineNumbersRef.current.innerHTML = Array.from(
        { length: lines },
        (_, i) => {
          const lineNum = i + 1;
          const isErrorLine = errorLine === lineNum;
          return `<div class="line-number ${isErrorLine ? 'error-line' : ''}">${lineNum}</div>`;
        }
      ).join('');
    }
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
  }, [open, inputJson, errorLine]);

  const handleValidate = () => {
    if (!workflow) return;

    let parsedInput = {};
    
    if (inputJson.trim() !== '') {
      try {
        parsedInput = JSON.parse(inputJson);
      } catch (error) {
        setJsonError('Please fix JSON errors before validating');
        return;
      }
    }

    onValidate(workflow.id, parsedInput, llmContext.trim() || undefined);
    onOpenChange(false);
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
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Validate Workflow
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">
            Workflow: <span className="text-cyan-400 font-medium">{workflow.name}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Workflow Info */}
            <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">{workflow.name}</h3>
                  <p className="text-xs text-gray-400">{workflow.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      Status: <span className="text-green-400 font-medium">{workflow.status.toUpperCase()}</span>
                    </span>
                    <span className="text-xs text-gray-500">
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
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-400">Valid JSON format</p>
              </div>
            )}

            {/* Input Parameters */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-white font-medium text-base">Input Parameters</Label>
                  <p className="text-xs text-gray-400 mt-1">
                    Provide input data in JSON format for validation
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseTemplate}
                    className="text-cyan-500 border-[#2a3142] hover:bg-cyan-500/10 hover:text-cyan-400"
                  >
                    Use Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearInput}
                    className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="flex border border-[#2a3142] rounded-md overflow-hidden">
                  {/* Line Numbers */}
                  <div
                    ref={lineNumbersRef}
                    className="bg-[#0f1419] text-gray-500 text-right pr-3 pl-2 py-2 select-none overflow-hidden"
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
                    className={`flex-1 font-mono text-sm bg-[#1a1f2e] text-white p-2 focus:outline-none focus:ring-1 resize-none ${
                      !isValidJson ? 'focus:ring-red-500' : 'focus:ring-cyan-500'
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

            {/* LLM Context */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-white font-medium text-base">Additional Context for LLM</Label>
                  <p className="text-xs text-gray-400 mt-1">
                    Provide additional information to help the LLM generate better test scenarios (optional)
                  </p>
                </div>
              </div>

              <Textarea
                ref={contextTextareaRef}
                value={llmContext}
                onChange={(e) => setLlmContext(e.target.value)}
                placeholder="Example:&#10;- This workflow handles BOPIS (Buy Online Pick Up In Store) orders&#10;- The decision task checks inventory levels at the specified ship node&#10;- If inventory is low, the workflow should route to backorder processing&#10;- The HTTP task calls an external order management system&#10;- Expected response time is under 2 seconds for standard orders"
                className="font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500 min-h-[150px]"
                style={{
                  lineHeight: '1.5',
                  fontSize: '13px',
                }}
              />
              
              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-400">💡 Context Tips</p>
                    <ul className="text-xs text-purple-300 mt-1 space-y-1 list-disc list-inside">
                      <li>Describe business logic and decision criteria</li>
                      <li>Mention expected behaviors for different scenarios</li>
                      <li>Include performance requirements or SLAs</li>
                      <li>Note any external system dependencies</li>
                      <li>Specify error handling expectations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Example Input */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <h3 className="text-sm font-semibold text-white mb-3">Example Input Structure</h3>
              <pre className="text-xs text-gray-400 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto">
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

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleValidate}
            disabled={!isValidJson}
            className="bg-purple-500 text-white hover:bg-purple-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Validate Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
