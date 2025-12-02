import { useState, useCallback } from 'react';
import { Node } from 'reactflow';

export interface ModalStates {
  // System Tasks
  isHttpConfigModalOpen: boolean;
  isKafkaPublishModalOpen: boolean;
  isJsonJqTransformModalOpen: boolean;
  isJsonJqTransformStringModalOpen: boolean;
  isNoopModalOpen: boolean;
  isEventModalOpen: boolean;
  isWaitModalOpen: boolean;
  isSetVariableModalOpen: boolean;
  isSubWorkflowModalOpen: boolean;
  isTerminateModalOpen: boolean;
  isInlineModalOpen: boolean;
  isHumanTaskModalOpen: boolean;
  isSimpleTaskModalOpen: boolean;

  // Operators
  isForkJoinModalOpen: boolean;
  isForkJoinDynamicModalOpen: boolean;
  isSwitchModalOpen: boolean;
  isDoWhileModalOpen: boolean;
  isDynamicModalOpen: boolean;
  isLambdaModalOpen: boolean;
  isOperatorInlineModalOpen: boolean;
  isJoinModalOpen: boolean;
  isExclusiveJoinModalOpen: boolean;
  isOperatorSubWorkflowModalOpen: boolean;
  isStartWorkflowModalOpen: boolean;

  // Other
  executeModalOpen: boolean;
}

export interface ModalActions {
  setIsHttpConfigModalOpen: (open: boolean) => void;
  setIsKafkaPublishModalOpen: (open: boolean) => void;
  setIsJsonJqTransformModalOpen: (open: boolean) => void;
  setIsJsonJqTransformStringModalOpen: (open: boolean) => void;
  setIsNoopModalOpen: (open: boolean) => void;
  setIsEventModalOpen: (open: boolean) => void;
  setIsWaitModalOpen: (open: boolean) => void;
  setIsSetVariableModalOpen: (open: boolean) => void;
  setIsSubWorkflowModalOpen: (open: boolean) => void;
  setIsTerminateModalOpen: (open: boolean) => void;
  setIsInlineModalOpen: (open: boolean) => void;
  setIsHumanTaskModalOpen: (open: boolean) => void;
  setIsSimpleTaskModalOpen: (open: boolean) => void;
  setIsForkJoinModalOpen: (open: boolean) => void;
  setIsForkJoinDynamicModalOpen: (open: boolean) => void;
  setIsSwitchModalOpen: (open: boolean) => void;
  setIsDoWhileModalOpen: (open: boolean) => void;
  setIsDynamicModalOpen: (open: boolean) => void;
  setIsLambdaModalOpen: (open: boolean) => void;
  setIsOperatorInlineModalOpen: (open: boolean) => void;
  setIsJoinModalOpen: (open: boolean) => void;
  setIsExclusiveJoinModalOpen: (open: boolean) => void;
  setIsOperatorSubWorkflowModalOpen: (open: boolean) => void;
  setIsStartWorkflowModalOpen: (open: boolean) => void;
  setExecuteModalOpen: (open: boolean) => void;
  openModalForTaskType: (taskType: string) => void;
}

export function useTaskModals() {
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [isHttpConfigModalOpen, setIsHttpConfigModalOpen] = useState(false);
  const [isKafkaPublishModalOpen, setIsKafkaPublishModalOpen] = useState(false);
  const [isJsonJqTransformModalOpen, setIsJsonJqTransformModalOpen] = useState(false);
  const [isJsonJqTransformStringModalOpen, setIsJsonJqTransformStringModalOpen] = useState(false);
  const [isNoopModalOpen, setIsNoopModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isWaitModalOpen, setIsWaitModalOpen] = useState(false);
  const [isSetVariableModalOpen, setIsSetVariableModalOpen] = useState(false);
  const [isSubWorkflowModalOpen, setIsSubWorkflowModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isInlineModalOpen, setIsInlineModalOpen] = useState(false);
  const [isHumanTaskModalOpen, setIsHumanTaskModalOpen] = useState(false);
  const [isSimpleTaskModalOpen, setIsSimpleTaskModalOpen] = useState(false);
  const [isForkJoinModalOpen, setIsForkJoinModalOpen] = useState(false);
  const [isForkJoinDynamicModalOpen, setIsForkJoinDynamicModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isDoWhileModalOpen, setIsDoWhileModalOpen] = useState(false);
  const [isDynamicModalOpen, setIsDynamicModalOpen] = useState(false);
  const [isLambdaModalOpen, setIsLambdaModalOpen] = useState(false);
  const [isOperatorInlineModalOpen, setIsOperatorInlineModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isExclusiveJoinModalOpen, setIsExclusiveJoinModalOpen] = useState(false);
  const [isOperatorSubWorkflowModalOpen, setIsOperatorSubWorkflowModalOpen] = useState(false);
  const [isStartWorkflowModalOpen, setIsStartWorkflowModalOpen] = useState(false);

  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<Node | null>(null);
  const [pendingNodeForAutoConfig, setPendingNodeForAutoConfig] = useState<Node | null>(null);
  const [pendingTaskDrop, setPendingTaskDrop] = useState<{
    taskType: string;
    taskName: string;
    color: string;
    position: { x: number; y: number };
  } | null>(null);

  const openModalForTaskType = useCallback((taskType: string) => {
    switch (taskType) {
      case 'HTTP':
        setIsHttpConfigModalOpen(true);
        break;
      case 'KAFKA_PUBLISH':
        setIsKafkaPublishModalOpen(true);
        break;
      case 'JSON_JQ_TRANSFORM':
        setIsJsonJqTransformModalOpen(true);
        break;
      case 'JSON_JQ_TRANSFORM_STRING':
        setIsJsonJqTransformStringModalOpen(true);
        break;
      case 'NOOP':
        setIsNoopModalOpen(true);
        break;
      case 'EVENT':
        setIsEventModalOpen(true);
        break;
      case 'WAIT':
        setIsWaitModalOpen(true);
        break;
      case 'SET_VARIABLE':
        setIsSetVariableModalOpen(true);
        break;
      case 'SUB_WORKFLOW':
        setIsSubWorkflowModalOpen(true);
        break;
      case 'TERMINATE':
        setIsTerminateModalOpen(true);
        break;
      case 'INLINE':
        setIsInlineModalOpen(true);
        break;
      case 'HUMAN':
        setIsHumanTaskModalOpen(true);
        break;
      case 'SIMPLE':
        setIsSimpleTaskModalOpen(true);
        break;
      case 'FORK_JOIN':
        setIsForkJoinModalOpen(true);
        break;
      case 'FORK_JOIN_DYNAMIC':
        setIsForkJoinDynamicModalOpen(true);
        break;
      case 'SWITCH':
        setIsSwitchModalOpen(true);
        break;
      case 'DO_WHILE':
        setIsDoWhileModalOpen(true);
        break;
      case 'DYNAMIC':
        setIsDynamicModalOpen(true);
        break;
      case 'LAMBDA':
        setIsLambdaModalOpen(true);
        break;
      case 'INLINE_OPERATOR':
        setIsOperatorInlineModalOpen(true);
        break;
      case 'JOIN':
        setIsJoinModalOpen(true);
        break;
      case 'EXCLUSIVE_JOIN':
        setIsExclusiveJoinModalOpen(true);
        break;
      case 'SUB_WORKFLOW_OPERATOR':
        setIsOperatorSubWorkflowModalOpen(true);
        break;
      case 'START_WORKFLOW':
        setIsStartWorkflowModalOpen(true);
        break;
    }
  }, []);

  return {
    states: {
      executeModalOpen,
      isHttpConfigModalOpen,
      isKafkaPublishModalOpen,
      isJsonJqTransformModalOpen,
      isJsonJqTransformStringModalOpen,
      isNoopModalOpen,
      isEventModalOpen,
      isWaitModalOpen,
      isSetVariableModalOpen,
      isSubWorkflowModalOpen,
      isTerminateModalOpen,
      isInlineModalOpen,
      isHumanTaskModalOpen,
      isSimpleTaskModalOpen,
      isForkJoinModalOpen,
      isForkJoinDynamicModalOpen,
      isSwitchModalOpen,
      isDoWhileModalOpen,
      isDynamicModalOpen,
      isLambdaModalOpen,
      isOperatorInlineModalOpen,
      isJoinModalOpen,
      isExclusiveJoinModalOpen,
      isOperatorSubWorkflowModalOpen,
      isStartWorkflowModalOpen,
    },
    actions: {
      setExecuteModalOpen,
      setIsHttpConfigModalOpen,
      setIsKafkaPublishModalOpen,
      setIsJsonJqTransformModalOpen,
      setIsJsonJqTransformStringModalOpen,
      setIsNoopModalOpen,
      setIsEventModalOpen,
      setIsWaitModalOpen,
      setIsSetVariableModalOpen,
      setIsSubWorkflowModalOpen,
      setIsTerminateModalOpen,
      setIsInlineModalOpen,
      setIsHumanTaskModalOpen,
      setIsSimpleTaskModalOpen,
      setIsForkJoinModalOpen,
      setIsForkJoinDynamicModalOpen,
      setIsSwitchModalOpen,
      setIsDoWhileModalOpen,
      setIsDynamicModalOpen,
      setIsLambdaModalOpen,
      setIsOperatorInlineModalOpen,
      setIsJoinModalOpen,
      setIsExclusiveJoinModalOpen,
      setIsOperatorSubWorkflowModalOpen,
      setIsStartWorkflowModalOpen,
      openModalForTaskType,
    },
    selectedNodeForConfig,
    setSelectedNodeForConfig,
    pendingNodeForAutoConfig,
    setPendingNodeForAutoConfig,
    pendingTaskDrop,
    setPendingTaskDrop,
  };
}
