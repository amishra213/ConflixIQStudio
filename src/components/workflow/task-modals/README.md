# Task Configuration Modals

This folder contains all task-specific configuration modals for Netflix Conductor workflow tasks.

## Current Status

**Note:** The modal files are currently located in the parent folder (`src/components/workflow/`) and are re-exported through `index.ts`. This allows the new import structure to work while the files remain in their original location.

### Current Files (in parent folder)
- `../TaskConfigurationModal.tsx` - Generic and HTTP tasks
- `../LambdaTaskConfigModal.tsx` - Lambda (inline JavaScript) tasks  
- `../DecisionTaskConfigModal.tsx` - Decision (conditional branching) tasks
- `../JsonTaskCreator.tsx` - Create tasks from raw JSON

## Organization

Each task type will have its own dedicated modal component for configuration.

### Planned Modals (17 Total Task Types)

The following modals can be added as needed:

1. ✅ **TaskConfigurationModal.tsx** - Generic and HTTP tasks
2. ✅ **LambdaTaskConfigModal.tsx** - Lambda (inline JavaScript) tasks
3. ✅ **DecisionTaskConfigModal.tsx** - Decision (conditional branching) tasks
4. ✅ **JsonTaskCreator.tsx** - Create tasks from raw JSON
5. **ForkJoinTaskConfigModal.tsx** - Parallel task execution
6. **DoWhileTaskConfigModal.tsx** - Loop tasks
7. **SubWorkflowTaskConfigModal.tsx** - Nested workflow execution
8. **EventTaskConfigModal.tsx** - Event publishing tasks
9. **WaitTaskConfigModal.tsx** - Delay/wait tasks
10. **TerminateTaskConfigModal.tsx** - Workflow termination
11. **SignalTaskConfigModal.tsx** - Signal sending tasks
12. **DynamicTaskConfigModal.tsx** - Dynamic task selection
13. **DynamicForkTaskConfigModal.tsx** - Dynamic parallel execution
14. **JoinTaskConfigModal.tsx** - Join parallel branches
15. **ExclusiveJoinTaskConfigModal.tsx** - Exclusive join logic
16. **SwitchTaskConfigModal.tsx** - Switch-case branching
17. **SetVariableTaskConfigModal.tsx** - Variable assignment

### Additional Utility Modals

- **KafkaPublishTaskConfigModal.tsx** - Kafka message publishing
- **JsonJqTransformTaskConfigModal.tsx** - JSON transformation with JQ

## Usage

Import modals from the central index file:

```typescript
import { 
  TaskConfigurationModal, 
  LambdaTaskConfigModal, 
  DecisionTaskConfigModal 
} from './task-modals';
```

This works seamlessly whether the files are in this folder or the parent folder.

## Migration Plan

To move files into this folder:
1. Move each modal file from `../` to `./`
2. Update the export in `index.ts` to use `./` instead of `../`
3. No changes needed in consuming components!

## Modal Structure

Each modal should follow this structure:

1. **Props Interface** - Define configuration and callback props
2. **State Management** - Form fields and validation
3. **Three-Tab Layout**:
   - Basic Configuration (task metadata)
   - Task-Specific Configuration (unique to task type)
   - JSON Editor (full JSON view/edit)
4. **Validation** - Required fields and format checking
5. **Save Handler** - Convert form data to task configuration JSON

## Best Practices

- Keep modals focused on a single task type
- Reuse common components (Input, Label, Textarea, etc.)
- Provide helpful tooltips and examples
- Support both form-based and JSON-based editing
- Include validation with clear error messages
- Show loading states when fetching data
- Handle nested task configurations (like Decision tasks)

## File Naming Convention

- Use PascalCase: `TaskTypeTaskConfigModal.tsx`
- Suffix with `TaskConfigModal` for consistency
- Example: `ForkJoinTaskConfigModal.tsx`
