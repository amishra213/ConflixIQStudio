import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  PlayIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { JsonViewer } from '@/components/ui/json-viewer';
import { localWorkflowToConductor } from '@/utils/workflowConverter';
import {
  generateTestScenarios,
  generateTestInputForScenario,
  executeWorkflowOnConductor,
  TestScenario,
} from '@/services/llmService';
import { useToast } from '@/hooks/use-toast';

interface TestInput {
  [key: string]: unknown;
}

interface WorkflowDefinitionCached {
  name: string;
  version?: number;
  tasks?: WorkflowTask[];
  description?: string;
  [key: string]: unknown;
}

interface WorkflowTask {
  name?: string;
  taskReferenceName?: string;
  type?: string;
  [key: string]: unknown;
}

export function WorkflowValidation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { workflows } = useWorkflowStore();
  const { toast } = useToast();
  const { openAiLlm, conductorApi } = useSettingsStore();

  const [inputData, setInputData] = useState<TestInput | null>(null);
  const [llmContextData, setLlmContextData] = useState<string>('');
  const [workflowDefinitionCache, setWorkflowDefinitionCache] =
    useState<WorkflowDefinitionCached | null>(null);
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(true);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    message: '',
  });
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isGeneratingAllInputs, setIsGeneratingAllInputs] = useState(false);

  const workflow = workflows.find((w) => w.id === id);

  const generateScenarios = useCallback(
    async (input: TestInput, context?: string) => {
      setIsGeneratingScenarios(true);
      setGenerationProgress({ current: 0, total: 0, message: 'Initializing...' });

      if (!openAiLlm.apiKey) {
        toast({
          title: 'LLM API Key Missing',
          description: 'Please configure your OpenAI API Key in settings to generate scenarios.',
          variant: 'destructive',
        });
        setIsGeneratingScenarios(false);
        return;
      }

      try {
        // Convert and cache workflow definition
        const conductorWorkflow = localWorkflowToConductor(workflow!);
        setWorkflowDefinitionCache(conductorWorkflow as WorkflowDefinitionCached);

        // Progress callback for recursive generation
        const onProgress = (message: string, current: number, total: number) => {
          setGenerationProgress({ current, total, message });
        };

        // Generate scenarios recursively
        const scenarios = await generateTestScenarios(
          conductorWorkflow,
          input,
          context,
          onProgress
        );

        setTestScenarios(scenarios);

        toast({
          title: 'Test scenarios generated',
          description: `${scenarios.length} test scenarios created from ${conductorWorkflow.tasks?.length || 0} workflow tasks`,
        });
      } catch (error) {
        console.error('Failed to generate scenarios:', error);
        toast({
          title: 'Generation failed',
          description: error instanceof Error ? error.message : 'Failed to generate test scenarios',
          variant: 'destructive',
        });
      } finally {
        setIsGeneratingScenarios(false);
        setGenerationProgress({ current: 0, total: 0, message: '' });
      }
    },
    [workflow, openAiLlm.apiKey, toast]
  );

  useEffect(() => {
    if (workflow) {
      const inputParam = searchParams.get('input');
      const contextParam = searchParams.get('context');

      if (inputParam) {
        try {
          const parsedInput = JSON.parse(decodeURIComponent(inputParam)) as TestInput;
          const parsedContext = contextParam ? decodeURIComponent(contextParam) : '';

          setInputData(parsedInput);
          setLlmContextData(parsedContext);
          generateScenarios(parsedInput, parsedContext);
        } catch (err) {
          console.error('Failed to parse input:', err);
          setIsGeneratingScenarios(false);
        }
      } else {
        setIsGeneratingScenarios(false);
      }
    }
  }, [workflow, searchParams, generateScenarios]);

  const generateInputForScenario = useCallback(
    async (scenario: TestScenario) => {
      setTestScenarios((prev) =>
        prev.map((s) => (s.id === scenario.id ? { ...s, status: 'generating' } : s))
      );

      try {
        const conductorWorkflow = localWorkflowToConductor(workflow!);
        const testInput = await generateTestInputForScenario(
          scenario,
          inputData,
          conductorWorkflow
        );

        setTestScenarios((prev) =>
          prev.map((s) =>
            s.id === scenario.id ? { ...s, inputJson: testInput, status: 'ready' } : s
          )
        );

        toast({
          title: 'Test input generated',
          description: `Input JSON created for: ${scenario.name}`,
        });
      } catch (error) {
        console.error('Failed to generate input:', error);
        setTestScenarios((prev) =>
          prev.map((s) =>
            s.id === scenario.id
              ? { ...s, status: 'pending', error: 'Failed to generate input' }
              : s
          )
        );
        toast({
          title: 'Input generation failed',
          description: `Failed to generate input for: ${scenario.name}`,
          variant: 'destructive',
        });
      }
    },
    [workflow, inputData, toast]
  ); // Dependencies for useCallback

  const generateAllInputs = async () => {
    setIsGeneratingAllInputs(true);
    for (const scenario of testScenarios) {
      if (!scenario.inputJson || scenario.status === 'pending') {
        await generateInputForScenario(scenario);
        await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay for UI updates
      }
    }
    setIsGeneratingAllInputs(false);
    toast({
      title: 'All inputs generated',
      description: 'Input JSONs have been generated for all scenarios.',
    });
  };

  const handleDeleteScenario = (scenarioId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    toast({
      title: 'Scenario deleted',
      description: 'Test scenario removed successfully.',
    });
  };

  const toggleScenarioExpansion = (scenarioId: string) => {
    setExpandedScenarios((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  };

  const executeScenario = async (scenario: TestScenario) => {
    if (!scenario.inputJson) {
      toast({
        title: 'Input not generated',
        description: 'Please generate input JSON for this scenario first.',
        variant: 'destructive',
      });
      return;
    }

    setTestScenarios((prev) =>
      prev.map((s) => (s.id === scenario.id ? { ...s, status: 'testing' } : s))
    );

    try {
      const result = await executeWorkflowOnConductor(
        workflow!.name,
        scenario.inputJson,
        conductorApi.endpoint,
        conductorApi.apiKey
      );

      const passed = result.status === 'COMPLETED';

      setTestScenarios((prev) =>
        prev.map((s) =>
          s.id === scenario.id
            ? {
                ...s,
                status: passed ? 'passed' : 'failed',
                executionResult: result,
              }
            : s
        )
      );

      toast({
        title: passed ? 'Test passed' : 'Test failed',
        description: `${scenario.name}: ${result.status}`,
        variant: passed ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Failed to execute scenario:', error);
      setTestScenarios((prev) =>
        prev.map((s) =>
          s.id === scenario.id
            ? {
                ...s,
                status: 'failed',
                error: 'Execution failed',
              }
            : s
        )
      );
      toast({
        title: 'Execution failed',
        description: `Failed to execute: ${scenario.name}`,
        variant: 'destructive',
      });
    }
  };

  const executeAllScenarios = async () => {
    setIsTestingAll(true);

    for (const scenario of testScenarios) {
      // Ensure input is generated before executing
      if (!scenario.inputJson) {
        await generateInputForScenario(scenario);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      await executeScenario(scenario);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsTestingAll(false);

    const passed = testScenarios.filter((s) => s.status === 'passed').length;
    const total = testScenarios.length;

    toast({
      title: 'All tests completed',
      description: `${passed}/${total} tests passed`,
    });
  };

  const getStatusIcon = (status: TestScenario['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-destructive" />;
      case 'testing':
      case 'generating':
        return <RefreshCwIcon className="w-5 h-5 text-primary animate-spin" />;
      case 'ready':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangleIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTestTypeBadge = (testType: TestScenario['testType']) => {
    const colors = {
      happy_path: 'bg-green-500/20 text-green-400 border-green-500/50',
      edge_case: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      error_case: 'bg-red-500/20 text-red-400 border-red-500/50',
      boundary: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    };

    return (
      <Badge className={`${colors[testType]} border font-medium`}>
        {testType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!workflow) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-foreground">Workflow not found</p>
          <Button
            onClick={() => navigate('/workflows')}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Workflows
          </Button>
        </Card>
      </div>
    );
  }

  const stats = {
    total: testScenarios.length,
    passed: testScenarios.filter((s) => s.status === 'passed').length,
    failed: testScenarios.filter((s) => s.status === 'failed').length,
    pending: testScenarios.filter((s) => s.status === 'pending' || s.status === 'ready').length,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/workflows')}
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-medium text-foreground">Workflow Validation</h1>
            <p className="text-muted-foreground mt-1">{workflow.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateAllInputs}
            disabled={isGeneratingScenarios || isGeneratingAllInputs || isTestingAll}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            <RefreshCwIcon
              className={`w-4 h-4 mr-2 ${isGeneratingAllInputs ? 'animate-spin' : ''}`}
            />
            {isGeneratingAllInputs ? 'Generating All Inputs...' : 'Generate All Inputs'}
          </Button>
          <Button
            onClick={executeAllScenarios}
            disabled={isGeneratingScenarios || isTestingAll || isGeneratingAllInputs}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            {isTestingAll ? 'Testing All...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {isGeneratingScenarios ? (
        <Card className="p-12 bg-card border-border text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-foreground">
            🤖 Recursive LLM Analysis in Progress
          </p>
          <p className="text-foreground mt-2">
            {generationProgress.message || 'Analyzing workflow and generating test scenarios...'}
          </p>

          {generationProgress.total > 0 && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Processing tasks</span>
                <span className="font-semibold text-primary">
                  {generationProgress.current} / {generationProgress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            The LLM is recursively traversing each workflow task and generating targeted test
            scenarios
          </p>

          <div className="mt-6 max-w-md mx-auto text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Analyzing task types and configurations</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Processing nested decision branches</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Generating task-specific test scenarios</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Creating end-to-end validation tests</span>
            </div>
          </div>

          {llmContextData && (
            <div className="mt-6 p-3 bg-purple-500/10 border border-purple-500/50 rounded-lg max-w-md mx-auto">
              <p className="text-xs text-purple-400 font-semibold">
                ✨ Using your custom context for enhanced scenario generation
              </p>
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertTriangleIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Scenarios</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.passed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.failed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/10 rounded-lg">
                  <RefreshCwIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Test Scenarios */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Test Scenarios</h3>
            <div className="space-y-3">
              {testScenarios.map((scenario) => {
                const isExpanded = expandedScenarios.has(scenario.id);

                return (
                  <Card key={scenario.id} className="bg-background border-border overflow-hidden">
                    <button
                      className="w-full p-4 cursor-pointer hover:bg-muted/50 transition-colors text-left"
                      onClick={() => toggleScenarioExpansion(scenario.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getStatusIcon(scenario.status)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-sm font-medium text-foreground">{scenario.name}</h4>
                            {getTestTypeBadge(scenario.testType)}
                            <Badge className="bg-muted text-muted-foreground">
                              {scenario.targetNode}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{scenario.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDeleteScenario(scenario.id, e)}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            title="Delete Scenario"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>

                          {/* Generate Input Button */}
                          {!scenario.inputJson && scenario.status !== 'generating' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateInputForScenario(scenario);
                              }}
                              disabled={isGeneratingAllInputs || isTestingAll}
                              className="text-cyan-500 border-border hover:bg-cyan-500/10"
                            >
                              <RefreshCwIcon className="w-4 h-4 mr-1" />
                              Generate Input
                            </Button>
                          )}

                          {/* Execute Test Button */}
                          {scenario.inputJson && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                executeScenario(scenario);
                              }}
                              disabled={
                                scenario.status === 'testing' ||
                                isGeneratingAllInputs ||
                                isTestingAll
                              }
                              className="text-primary border-border hover:bg-primary/10"
                            >
                              <PlayIcon className="w-4 h-4 mr-1" />
                              {scenario.status === 'testing' ? 'Testing...' : 'Execute Test'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                        {/* LLM Generation Status */}
                        {scenario.status === 'generating' && (
                          <div className="p-4 bg-primary/10 border border-primary/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <RefreshCwIcon className="w-5 h-5 text-primary animate-spin" />
                              <div>
                                <p className="text-sm font-semibold text-primary">
                                  🤖 LLM Interaction #2
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Generating test input JSON for this scenario...
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Test Input JSON */}
                        {scenario.inputJson && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-semibold text-foreground">
                                Test Input JSON (LLM Generated)
                              </h5>
                              {scenario.inputJson._llmGenerated && (
                                <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50">
                                  🤖 AI Generated
                                </Badge>
                              )}
                            </div>
                            <JsonViewer
                              data={scenario.inputJson}
                              maxHeight="200px"
                              collapsible={true}
                            />
                          </div>
                        )}

                        {/* Execution Status */}
                        {scenario.status === 'testing' && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <RefreshCwIcon className="w-5 h-5 text-blue-500 animate-spin" />
                              <div>
                                <p className="text-sm font-semibold text-blue-400">
                                  ⚡ Executing on Conductor
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Running workflow on Netflix Conductor...
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Execution Result */}
                        {scenario.executionResult && (
                          <div>
                            <h5 className="text-sm font-semibold text-foreground mb-2">
                              Conductor Execution Result
                            </h5>
                            <div className="mb-3 flex items-center gap-2">
                              <Badge
                                className={`${
                                  scenario.executionResult.status === 'COMPLETED'
                                    ? 'bg-success text-white'
                                    : 'bg-destructive text-white'
                                }`}
                              >
                                {scenario.executionResult.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Workflow ID: {scenario.executionResult.workflowId}
                              </span>
                            </div>
                            <JsonViewer
                              data={scenario.executionResult}
                              maxHeight="300px"
                              collapsible={true}
                            />
                          </div>
                        )}

                        {/* Error Message */}
                        {scenario.error && (
                          <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                            <p className="text-sm text-destructive font-semibold">Error</p>
                            <p className="text-sm text-muted-foreground mt-1">{scenario.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Workflow Analysis Summary */}
          {workflowDefinitionCache && (
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Workflow Analysis Summary
                <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50">
                  Cached for Performance
                </Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-background border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {workflowDefinitionCache.tasks?.length || 0}
                  </p>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Scenarios Generated</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{testScenarios.length}</p>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">LLM Interactions</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(workflowDefinitionCache.tasks?.length || 0) + 2}
                  </p>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Definition Size</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(JSON.stringify(workflowDefinitionCache).length / 1024).toFixed(1)}KB
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Original Input and Context */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Original Input Data</h3>
              <JsonViewer data={inputData} collapsible={true} defaultExpanded={false} />
            </Card>

            {llmContextData && (
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  LLM Context Information
                  <Badge className="ml-2 bg-purple-500/20 text-purple-400 border border-purple-500/50">
                    🤖 Used for Each Task Analysis
                  </Badge>
                </h3>
                <div className="bg-background border border-border rounded-lg p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                    {llmContextData}
                  </pre>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
