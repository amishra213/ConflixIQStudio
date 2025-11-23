import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

// Import all task modals
import {
  HttpTaskModal,
  KafkaPublishTaskModal,
  JsonJqTransformTaskModal,
  InlineSystemTaskModal,
  EventSystemTaskModal,
  WaitSystemTaskModal,
  NoopSystemTaskModal,
  TerminateSystemTaskModal,
  HumanSystemTaskModal,
} from '../system-tasks';
import { SimpleTaskModal } from '../SimpleTaskModal';
import { StartWorkflowModal } from './StartWorkflowModal';
import { SubWorkflowModal } from './SubWorkflowModal';
import { SetVariableModal } from './SetVariableModal';
import { ForkJoinModal } from './ForkJoinModal';
import { DynamicForkModal } from './DynamicForkModal';
import { DoWhileModal } from './DoWhileModal';
import { JoinModal } from './JoinModal';
import { DynamicModal } from './DynamicModal';

export interface SwitchConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'SWITCH';
  evaluatorType: 'value-param' | 'javascript';
  expression: string;
  inputParameters?: Record<string, unknown>;
  decisionCases?: Record<string, BaseTaskConfig[]>;
  defaultCase?: BaseTaskConfig[];
}

interface SwitchModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SwitchConfig) => void;
  readonly initialConfig?: SwitchConfig;
}

const AVAILABLE_TASK_TYPES = [
  'SIMPLE',
  'HTTP',
  'KAFKA_PUBLISH',
  'JSON_JQ_TRANSFORM',
  'NOOP',
  'EVENT',
  'WAIT',
  'INLINE',
  'HUMAN',
  'SET_VARIABLE',
  'SUB_WORKFLOW',
  'START_WORKFLOW',
  'TERMINATE',
  'FORK_JOIN',
  'FORK_JOIN_DYNAMIC',
  'SWITCH',
  'DO_WHILE',
  'DYNAMIC',
  'JOIN',
];

interface TaskModalState {
  isOpen: boolean;
  taskType: string | null;
  caseName: string | null;
  taskIndex: number;
  initialConfig: BaseTaskConfig | null | undefined;
}

export function SwitchModal({ open, onOpenChange, onSave, initialConfig }: SwitchModalProps) {
  // Generate unique ID for this modal instance to avoid conflicts with nested Switch modals
  const [instanceId] = useState(() => `switch-modal-${Math.random().toString(36).substring(2, 11)}`);

  const [config, setConfig] = useState<SwitchConfig>({
    taskRefId: 'switch-1',
    name: 'Switch',
    taskType: 'SWITCH',
    evaluatorType: 'value-param',
    expression: 'switchCaseValue',
    inputParameters: {
      switchCaseValue: '${workflow.input}',
    },
    decisionCases: {},
    defaultCase: [],
  });

  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    isOpen: false,
    taskType: null,
    caseName: null,
    taskIndex: -1,
    initialConfig: null,
  });
  // State to track select values for resetting
  const [caseSelectValues, setCaseSelectValues] = useState<Record<string, string>>({});
  const [defaultCaseSelectValue, setDefaultCaseSelectValue] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Deep load of existing configuration to ensure all properties are correctly set
        const loadedConfig: SwitchConfig = {
          taskRefId: initialConfig.taskRefId || `switch-${Date.now()}`,
          name: initialConfig.name || 'Switch',
          taskType: 'SWITCH',
          evaluatorType: initialConfig.evaluatorType || 'value-param',
          expression: initialConfig.expression || 'switchCaseValue',
          inputParameters: initialConfig.inputParameters ? { ...initialConfig.inputParameters } : { switchCaseValue: '${workflow.input}' },
          decisionCases: initialConfig.decisionCases ? { ...initialConfig.decisionCases } : {},
          defaultCase: initialConfig.defaultCase ? [...initialConfig.defaultCase] : [],
        };
        
        setConfig(loadedConfig);
        
        // Expand all cases by default when editing to show the configuration
        const caseNames = Object.keys(loadedConfig.decisionCases || {});
        setExpandedCases(new Set(caseNames));
        
        console.log('SwitchModal loaded with config:', loadedConfig);
      } else {
        // Create new configuration with fresh defaults
        const timestamp = Date.now();
        const newConfig: SwitchConfig = {
          taskRefId: `switch-${timestamp}`,
          name: 'Switch',
          taskType: 'SWITCH',
          evaluatorType: 'value-param',
          expression: 'switchCaseValue',
          inputParameters: {
            switchCaseValue: '${workflow.input}',
          },
          decisionCases: {},
          defaultCase: [],
        };
        
        setConfig(newConfig);
        setExpandedCases(new Set());
        
        console.log('SwitchModal created with new config:', newConfig);
      }
      
      // Always reset task modal state and select values when opening
      setTaskModalState({
        isOpen: false,
        taskType: null,
        caseName: null,
        taskIndex: -1,
        initialConfig: null,
      });
      setCaseSelectValues({});
      setDefaultCaseSelectValue('');
    }
  }, [open, initialConfig]);

  const handleAddCase = (caseName: string) => {
    if (caseName.trim()) {
      setConfig({
        ...config,
        decisionCases: {
          ...config.decisionCases,
          [caseName]: [],
        },
      });
      setExpandedCases(new Set(expandedCases).add(caseName));
    }
  };

  const handleRemoveCase = (caseName: string) => {
    const newCases = { ...config.decisionCases };
    delete newCases[caseName];
    setConfig({
      ...config,
      decisionCases: newCases,
    });
    const newExpanded = new Set(expandedCases);
    newExpanded.delete(caseName);
    setExpandedCases(newExpanded);
  };

  const handleOpenTaskModal = (
    taskType: string,
    caseName: string | null,
    taskIndex: number = -1,
    initialConfig: BaseTaskConfig | null | undefined = undefined
  ) => {
    setTaskModalState({
      isOpen: true,
      taskType,
      caseName,
      taskIndex,
      initialConfig: initialConfig || undefined,
    });
  };

  const handleCloseTaskModal = () => {
    setTaskModalState({
      isOpen: false,
      taskType: null,
      caseName: null,
      taskIndex: -1,
      initialConfig: null,
    });
  };

  const handleSaveTaskConfig = async (taskConfig: BaseTaskConfig) => {
    const { caseName, taskIndex } = taskModalState;

    if (caseName === null) {
      // Default case
      if (taskIndex === -1) {
        // Adding new task
        setConfig({
          ...config,
          defaultCase: [...(config.defaultCase || []), taskConfig],
        });
      } else {
        // Editing existing task
        const updatedDefault = [...(config.defaultCase || [])];
        updatedDefault[taskIndex] = taskConfig;
        setConfig({
          ...config,
          defaultCase: updatedDefault,
        });
      }
    } else if (taskIndex === -1) {
      // Named case - Adding new task
      setConfig({
        ...config,
        decisionCases: {
          ...config.decisionCases,
          [caseName]: [...(config.decisionCases?.[caseName] || []), taskConfig],
        },
      });
    } else {
      // Named case - Editing existing task
      const updatedCases = { ...config.decisionCases };
      const caseTasks = [...(updatedCases[caseName] || [])];
      caseTasks[taskIndex] = taskConfig;
      updatedCases[caseName] = caseTasks;
      setConfig({
        ...config,
        decisionCases: updatedCases,
      });
    }

    handleCloseTaskModal();
  };

  const handleRemoveTaskFromCase = (caseName: string, taskIndex: number) => {
    const tasks = config.decisionCases?.[caseName] || [];
    const updatedTasks = tasks.filter((_, i) => i !== taskIndex);
    setConfig({
      ...config,
      decisionCases: {
        ...config.decisionCases,
        [caseName]: updatedTasks,
      },
    });
  };

  const handleRemoveTaskFromDefault = (taskIndex: number) => {
    const updatedTasks = (config.defaultCase || []).filter((_, i) => i !== taskIndex);
    setConfig({
      ...config,
      defaultCase: updatedTasks,
    });
  };

  const toggleCaseExpanded = (caseName: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(caseName)) {
      newExpanded.delete(caseName);
    } else {
      newExpanded.add(caseName);
    }
    setExpandedCases(newExpanded);
  };

  const renderTaskCard = (task: BaseTaskConfig, index: number, caseName: string | null) => {
    return (
      <Card key={index} className="p-4 bg-[#0f1419] border-[#2a3142] mb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-cyan-400">{task.type || task.taskType}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-white">{task.name || task.taskReferenceName}</span>
            </div>
            <p className="text-xs text-gray-400">
              Ref: {task.taskReferenceName || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleOpenTaskModal(
                  task.type || task.taskType || 'SIMPLE',
                  caseName,
                  index,
                  task
                )
              }
              className="text-cyan-400 hover:text-cyan-300"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                caseName === null
                  ? handleRemoveTaskFromDefault(index)
                  : handleRemoveTaskFromCase(caseName, index)
              }
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderTaskModal = () => {
    if (!taskModalState.isOpen || !taskModalState.taskType) return null;

    const commonProps = {
      open: taskModalState.isOpen,
      onOpenChange: (open: boolean) => {
        if (!open) handleCloseTaskModal();
      },
      onSave: handleSaveTaskConfig as never,
      initialConfig: taskModalState.initialConfig,
    };

    switch (taskModalState.taskType) {
      case 'SIMPLE':
        return <SimpleTaskModal {...(commonProps as React.ComponentProps<typeof SimpleTaskModal>)} />;
      case 'HTTP':
        return <HttpTaskModal {...(commonProps as React.ComponentProps<typeof HttpTaskModal>)} />;
      case 'KAFKA_PUBLISH':
        return <KafkaPublishTaskModal {...(commonProps as React.ComponentProps<typeof KafkaPublishTaskModal>)} />;
      case 'JSON_JQ_TRANSFORM':
        return <JsonJqTransformTaskModal {...(commonProps as React.ComponentProps<typeof JsonJqTransformTaskModal>)} />;
      case 'NOOP':
        return <NoopSystemTaskModal {...(commonProps as React.ComponentProps<typeof NoopSystemTaskModal>)} />;
      case 'EVENT':
        return <EventSystemTaskModal {...(commonProps as React.ComponentProps<typeof EventSystemTaskModal>)} />;
      case 'WAIT':
        return <WaitSystemTaskModal {...(commonProps as React.ComponentProps<typeof WaitSystemTaskModal>)} />;
      case 'TERMINATE':
        return <TerminateSystemTaskModal {...(commonProps as React.ComponentProps<typeof TerminateSystemTaskModal>)} />;
      case 'INLINE':
        return <InlineSystemTaskModal {...(commonProps as React.ComponentProps<typeof InlineSystemTaskModal>)} />;
      case 'HUMAN':
        return <HumanSystemTaskModal {...(commonProps as React.ComponentProps<typeof HumanSystemTaskModal>)} />;
      case 'SET_VARIABLE':
        return <SetVariableModal {...(commonProps as React.ComponentProps<typeof SetVariableModal>)} />;
      case 'SUB_WORKFLOW':
        return <SubWorkflowModal {...(commonProps as React.ComponentProps<typeof SubWorkflowModal>)} />;
      case 'START_WORKFLOW':
        return <StartWorkflowModal {...(commonProps as React.ComponentProps<typeof StartWorkflowModal>)} />;
      case 'FORK_JOIN':
        return <ForkJoinModal {...(commonProps as React.ComponentProps<typeof ForkJoinModal>)} />;
      case 'FORK_JOIN_DYNAMIC':
        return <DynamicForkModal {...(commonProps as React.ComponentProps<typeof DynamicForkModal>)} />;
      case 'SWITCH':
        return <SwitchModal {...(commonProps as React.ComponentProps<typeof SwitchModal>)} />;
      case 'DO_WHILE':
        return <DoWhileModal {...(commonProps as React.ComponentProps<typeof DoWhileModal>)} />;
      case 'DYNAMIC':
        return <DynamicModal {...(commonProps as React.ComponentProps<typeof DynamicModal>)} />;
      case 'JOIN':
        return <JoinModal {...(commonProps as React.ComponentProps<typeof JoinModal>)} />;
      default:
        return null;
    }
  };

  const customBasicFields = (
    <div className="space-y-6">
      {/* Evaluator Type */}
      <div>
        <Label className="text-white">Evaluator Type *</Label>
        <Select
          value={config.evaluatorType}
          onValueChange={(value) =>
            setConfig({
              ...config,
              evaluatorType: value as 'value-param' | 'javascript',
            })
          }
        >
          <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
            <SelectItem value="value-param">Value Parameter</SelectItem>
            <SelectItem value="javascript">JavaScript (GraalVM)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          {config.evaluatorType === 'value-param'
            ? 'Evaluates a parameter value'
            : 'Evaluates a JavaScript expression'}
        </p>
      </div>

      {/* Expression */}
      <div>
        <Label className="text-white">Expression *</Label>
        {config.evaluatorType === 'javascript' ? (
          <Textarea
            value={config.expression || ''}
            onChange={(e) => setConfig({ ...config, expression: e.target.value })}
            placeholder='(function () { switch ($.paramKey) { case "value1": return "case1"; ... } }())'
            className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
          />
        ) : (
          <Input
            value={config.expression || ''}
            onChange={(e) => setConfig({ ...config, expression: e.target.value })}
            placeholder="e.g., switchCaseValue"
            className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
        )}
        <p className="text-xs text-gray-400 mt-1">
          {config.evaluatorType === 'value-param'
            ? 'The parameter key to evaluate'
            : 'The JavaScript expression to evaluate'}
        </p>
      </div>

      {/* Input Parameters */}
      <div>
        <Label className="text-white">Input Parameters</Label>
        <Textarea
          value={JSON.stringify(config.inputParameters || {}, null, 2)}
          onChange={(e) => {
            try {
              setConfig({
                ...config,
                inputParameters: JSON.parse(e.target.value),
              });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder='{"switchCaseValue": "${workflow.input}"}'
          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[100px]"
        />
        <p className="text-xs text-gray-400 mt-1">
          JSON object with input parameters. Required for value-param evaluator.
        </p>
      </div>
    </div>
  );

  const customTabsContent = (
    <div className="space-y-4">
      {/* Decision Cases */}
      <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
        <h3 className="text-lg font-semibold text-white mb-4">Decision Cases</h3>

        {Object.keys(config.decisionCases || {}).length === 0 ? (
          <p className="text-gray-400 text-sm mb-4">No cases added yet</p>
        ) : (
          <div className="space-y-2 mb-4">
            {Object.keys(config.decisionCases || {}).map((caseName) => (
              <Card
                key={caseName}
                className="p-4 bg-[#1a1f2e] border-[#2a3142] hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-3">
                  <button
                    className="flex-1 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-left"
                    onClick={() => toggleCaseExpanded(caseName)}
                    type="button"
                  >
                    {expandedCases.has(caseName) ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-semibold text-white">{caseName}</span>
                    <span className="text-xs text-gray-400">
                      ({(config.decisionCases?.[caseName] || []).length} tasks)
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCase(caseName)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {expandedCases.has(caseName) && (
                  <div className="space-y-3">
                    {(config.decisionCases?.[caseName] || []).map((task, idx) =>
                      renderTaskCard(task, idx, caseName)
                    )}

                    <div>
                      <Label className="text-gray-300 text-sm">Add Task</Label>
                      <Select
                        value={caseSelectValues[caseName] || ''}
                        onValueChange={(taskType) => {
                          handleOpenTaskModal(taskType, caseName, -1, null);
                          // Reset the select value to allow selecting the same type again
                          setCaseSelectValues({ ...caseSelectValues, [caseName]: '' });
                        }}
                      >
                        <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                          <SelectValue placeholder="Select task type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                          {AVAILABLE_TASK_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Add New Case */}
        <div className="flex gap-2">
          <Input
            id={`newCaseName-${instanceId}`}
            placeholder="Enter case name"
            className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
          <Button
            onClick={() => {
              const input = document.getElementById(`newCaseName-${instanceId}`) as HTMLInputElement;
              if (input?.value.trim()) {
                handleAddCase(input.value.trim());
                input.value = '';
              }
            }}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Case
          </Button>
        </div>
      </Card>

      {/* Default Case */}
      <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
        <h3 className="text-lg font-semibold text-white mb-4">
          Default Case ({(config.defaultCase || []).length} tasks)
        </h3>

        <div className="space-y-3 mb-4">
          {(config.defaultCase || []).map((task, idx) =>
            renderTaskCard(task, idx, null)
          )}
        </div>

        <div>
          <Label className="text-gray-300 text-sm">Add Task</Label>
          <Select
            value={defaultCaseSelectValue}
            onValueChange={(taskType) => {
              handleOpenTaskModal(taskType, null, -1, null);
              // Reset the select value to allow selecting the same type again
              setDefaultCaseSelectValue('');
            }}
          >
            <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
              <SelectValue placeholder="Select task type..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
              {AVAILABLE_TASK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <BaseTaskModal
        open={open}
        onOpenChange={onOpenChange}
        onSave={onSave}
        initialConfig={config}
        title="Switch Operator"
        description="Configure conditional branching with multiple cases and task execution paths"
        buttonLabel="Save Operator"
        customBasicFields={customBasicFields}
        customTabs={[
          {
            id: 'cases',
            label: 'Decision Cases',
            content: customTabsContent,
          },
        ]}
      />
      {renderTaskModal()}
    </>
  );
}