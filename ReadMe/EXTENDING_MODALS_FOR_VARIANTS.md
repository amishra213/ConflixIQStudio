# Extending ConflixIQStudio for Different Conductor Server Variants

This guide explains how to extend ConflixIQStudio to support different variants or customizations of Conductor servers **without modifying the existing out-of-the-box modals, task definitions, or workflow definitions**. Instead, you'll create custom modal implementations in completely separate folders and swap them in via configuration.

## ⚠️ CRITICAL: Never Modify Base Files

**DO NOT modify these files:**

- `src/components/modals/` (system-tasks, operators, or any base modals)
- `src/constants/taskDefinitions.ts`
- `src/types/taskDefinition.ts`
- `src/stores/workflowStore.ts`
- Any core workflow/task JSON schema files

These are the "out-of-the-box" defaults and must remain untouched to ensure compatibility and maintainability.

## Architecture Overview

The current modal system is organized into three categories:

1. **System Task Modals** (`src/components/modals/system-tasks/`) - Built-in Conductor task types [READ-ONLY]
2. **Operator Modals** (`src/components/modals/operators/`) - Control flow operators (Fork, Join, Switch, etc.) [READ-ONLY]
3. **Base Components** (`src/components/modals/BaseTaskModal.tsx`) - Shared base modal class [READ-ONLY]

The key insight is that all modals extend `BaseTaskModal` and export their components and types through `index.ts` files. You create variant implementations in **separate, isolated folders** and swap them in via configuration without touching any base files.

## Step 1: Create a Variant Directory Structure (Completely Separate)

**Create a new, completely isolated directory** for your variant - NEVER inside the base modals folder:

```
src/variants/                           # NEW: Isolated extensions folder
├── README.md                           # Start here for your team
├── conductor-custom-v1/                # Your variant name
│   ├── README.md                       # Variant-specific documentation
│   ├── config.ts                       # Variant configuration
│   ├── operators/
│   │   ├── index.ts                    # Export custom operators
│   │   ├── ForkJoinModal.tsx           # Custom implementation (COPY, don't modify original)
│   │   ├── JoinModal.tsx               # Custom implementation
│   │   └── ... (other custom operators)
│   ├── system-tasks/
│   │   ├── index.ts                    # Export custom system tasks
│   │   ├── config.ts                   # Custom task type definitions
│   │   ├── HttpSystemTaskModal.tsx     # Custom implementation (COPY, don't modify original)
│   │   ├── CustomApiCallModal.tsx      # NEW: Custom task type
│   │   └── ... (other custom tasks)
│   ├── extensions/
│   │   ├── workflowExtensions.ts       # Workflow field extensions (NEW)
│   │   ├── taskExtensions.ts           # Task definition extensions (NEW)
│   │   └── typeDefinitions.ts          # Extension type definitions
│   └── hooks/
│       └── useCustomValidation.ts      # Variant-specific hooks
├── conductor-enterprise-v2/            # Another variant (same structure)
│   └── ...
└── index.ts                            # Variant registry
```

**IMPORTANT RULES:**

- ✅ Copy base modal files to your variant folder if you need to customize them
- ✅ Create new files in your variant folder for extensions
- ✅ Reference base types where appropriate (import from `@/components/modals/`)
- ❌ NEVER modify files in `src/components/modals/`
- ❌ NEVER modify `src/constants/` or `src/types/` base files
- ❌ NEVER modify `src/stores/workflowStore.ts`

## Step 2: Copy and Customize Base Modal Components

When you need to customize an existing modal, **copy it to your variant folder** and modify the copy:

### DO NOT MODIFY ORIGINAL

❌ Do NOT edit `src/components/modals/operators/ForkJoinModal.tsx`

### DO COPY AND CUSTOMIZE

✅ Copy to: `src/variants/conductor-custom-v1/operators/ForkJoinModal.tsx`
✅ Modify your copy
✅ Keep the original untouched

**File: `src/variants/conductor-custom-v1/operators/ForkJoinModal.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '@/components/modals/BaseTaskModal';
// ^^^ Import base from original location - don't copy this
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

// Import base interface (can import from original without modifying it)
import { ForkJoinConfig as BaseForkJoinConfig } from '@/components/modals/operators/ForkJoinModal';

// Extend with variant-specific configuration - NO CHANGES TO ORIGINAL
export interface CustomForkJoinConfig extends BaseForkJoinConfig {
  variantSpecificField?: string;
  enableAdvancedParallelization?: boolean;
  maxParallelBranches?: number;
}

interface CustomForkJoinModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: CustomForkJoinConfig) => void;
  readonly initialConfig?: CustomForkJoinConfig;
}

export function ForkJoinModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: CustomForkJoinModalProps) {
  const [config, setConfig] = useState<CustomForkJoinConfig>({
    name: 'Custom Fork Join',
    taskReferenceName: 'fork_join_ref',
    type: 'FORK_JOIN',
    inputParameters: {},
    forkTasks: [],
    enableAdvancedParallelization: false,
    maxParallelBranches: 10,
  });

  useEffect(() => {
    if (open && initialConfig) {
      setConfig({
        ...initialConfig,
        enableAdvancedParallelization: initialConfig.enableAdvancedParallelization ?? false,
        maxParallelBranches: initialConfig.maxParallelBranches ?? 10,
      });
    }
  }, [open, initialConfig]);

  const handleSave = () => {
    // Your variant-specific validation logic
    if (!config.name?.trim()) {
      console.error('Name is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <BaseTaskModal<CustomForkJoinConfig>
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={initialConfig || config}
      title="Custom Fork Join Configuration"
      description="Configure fork-join parallelization with advanced options"
      customBasicFields={
        <Card className="p-6 bg-[#0f1419] border-[#2a3142] mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Variant-Specific Options</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-white flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableAdvancedParallelization}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      enableAdvancedParallelization: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                Enable Advanced Parallelization
              </Label>
            </div>
            {config.enableAdvancedParallelization && (
              <div>
                <Label className="text-white">Max Parallel Branches</Label>
                <input
                  type="number"
                  value={config.maxParallelBranches}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxParallelBranches: parseInt(e.target.value, 10),
                    })
                  }
                  min="1"
                  max="100"
                  className="mt-2 w-full px-3 py-2 bg-[#1a1f2e] text-white border border-[#2a3142] rounded"
                />
              </div>
            )}
          </div>
        </Card>
      }
    />
  );
}
```

### Export Index File (In Your Variant Folder)

**File: `src/variants/conductor-custom-v1/operators/index.ts`**

```typescript
// Fork and Join Operators (custom variants)
export { ForkJoinModal, type CustomForkJoinConfig } from './ForkJoinModal';
// Re-export unmodified operators from base if you're not customizing them
export {
  JoinModal,
  type JoinConfig,
  DynamicForkModal,
  type ForkJoinDynamicConfig,
} from '@/components/modals/operators';
```

## Step 3: Create a Variant Configuration File

**File: `src/variants/conductor-custom-v1/config.ts`**

⚠️ **IMPORTANT:** This config file only describes what task types and operators your variant supports. It does NOT modify any base task definitions or workflow schemas.

```typescript
/**
 * Variant configuration for Conductor Custom V1
 * Defines variant-specific settings and behaviors
 *
 * CRITICAL: This does NOT modify any base files or schemas!
 * This purely defines configuration for your variant's modals and UI behavior.
 */

export interface VariantConfig {
  name: string;
  description: string;
  version: string;
  supportedTaskTypes: string[];
  supportedOperators: string[];
  features: {
    enableAdvancedParallelization: boolean;
    enableCustomValidation: boolean;
    enableVariantSpecificFields: boolean;
  };
}

export const CONDUCTOR_CUSTOM_V1_CONFIG: VariantConfig = {
  name: 'Conductor Custom V1',
  description: 'Customized Conductor variant with advanced parallelization',
  version: '1.0.0',
  supportedTaskTypes: [
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
  ],
  supportedOperators: ['FORK_JOIN', 'FORK_JOIN_DYNAMIC', 'SWITCH', 'DO_WHILE', 'DYNAMIC', 'JOIN'],
  features: {
    enableAdvancedParallelization: true,
    enableCustomValidation: true,
    enableVariantSpecificFields: true,
  },
};
```

## Step 4: Create a Variant Registry (Still Separate Folder)

**File: `src/variants/index.ts`**

⚠️ **IMPORTANT:** The registry only imports and organizes your variant code. It does NOT modify base files.

```typescript
/**
 * Variant Registry
 * Central registry for all available Conductor variants
 *
 * CRITICAL: This only orchestrates variant-specific code.
 * Base modals and definitions remain untouched.
 */

import type { ComponentType } from 'react';

import * as ConductorCustomV1Operators from './conductor-custom-v1/operators';
import * as DefaultOperators from '@/components/modals/operators';
import { CONDUCTOR_CUSTOM_V1_CONFIG, type VariantConfig } from './conductor-custom-v1/config';

export type VariantName = 'default' | 'conductor-custom-v1' | 'conductor-enterprise-v2';

export interface VariantExports {
  operators: {
    ForkJoinModal: ComponentType<any>;
    DynamicForkModal: ComponentType<any>;
    JoinModal: ComponentType<any>;
    SwitchModal: ComponentType<any>;
    DoWhileModal: ComponentType<any>;
    DynamicModal: ComponentType<any>;
    InlineModal: ComponentType<any>;
    TerminateModal: ComponentType<any>;
    SetVariableModal: ComponentType<any>;
    SubWorkflowModal: ComponentType<any>;
    StartWorkflowModal: ComponentType<any>;
  };
  config: VariantConfig;
}

export interface VariantRegistry {
  [key: string]: VariantExports;
}

const variants: VariantRegistry = {
  default: {
    operators: DefaultOperators,
    config: {
      name: 'Default Conductor',
      description: 'Standard Netflix Conductor',
      version: '1.0.0',
      supportedTaskTypes: [],
      supportedOperators: [],
      features: {
        enableAdvancedParallelization: false,
        enableCustomValidation: false,
        enableVariantSpecificFields: false,
      },
    },
  },
  'conductor-custom-v1': {
    operators: ConductorCustomV1Operators,
    config: CONDUCTOR_CUSTOM_V1_CONFIG,
  },
  // Add more variants here
};

/**
 * Get variant exports by name
 * Falls back to 'default' if variant not found
 */
export function getVariant(variantName: VariantName | string): VariantExports {
  return variants[variantName] || variants['default'];
}

/**
 * List all available variants
 */
export function listVariants(): VariantName[] {
  return Object.keys(variants) as VariantName[];
}

export { CONDUCTOR_CUSTOM_V1_CONFIG } from './conductor-custom-v1/config';
```

## Step 5: Create a Variant Hook (In Your Variant Folder)

**File: `src/hooks/useVariant.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getVariant, type VariantName, type VariantExports } from '@/variants';

interface VariantStore {
  currentVariant: VariantName;
  variantExports: VariantExports;
  setVariant: (variant: VariantName) => void;
}

export const useVariantStore = create<VariantStore>()(
  persist(
    (set) => ({
      currentVariant: 'default',
      variantExports: getVariant('default'),
      setVariant: (variant: VariantName) => {
        set({
          currentVariant: variant,
          variantExports: getVariant(variant),
        });
      },
    }),
    {
      name: 'variant-store',
    }
  )
);

export function useVariant() {
  const { currentVariant, variantExports, setVariant } = useVariantStore();
  return {
    currentVariant,
    ...variantExports,
    setVariant,
  };
}
```

## Step 6: Update WorkflowDesigner to Use Variants

**File: `src/pages/WorkflowDesigner.tsx` (partial update)**

```tsx
import { useVariant } from '@/hooks/useVariant';

export function WorkflowDesigner() {
  // ... existing code ...

  const { operators: variantOperators, config: variantConfig } = useVariant();

  // Use variant-specific modals
  const [operatorModals, setOperatorModals] = useState({
    forkJoin: false,
    dynamicFork: false,
    // ... etc
  });

  // When rendering the ForkJoinModal:
  return (
    <>
      {/* Use variant-specific ForkJoinModal */}
      {variantOperators.ForkJoinModal &&
        variantOperators.ForkJoinModal({
          open: operatorModals.forkJoin,
          onOpenChange: (open) => setOperatorModals({ ...operatorModals, forkJoin: open }),
          onSave: handleForkJoinSave,
          initialConfig: selectedConfig,
        })}
      {/* ... other modals */}
    </>
  );
}
```

## Step 7: Create Variant Settings UI

**File: `src/components/VariantSelector.tsx`**

```tsx
import { useVariant } from '@/hooks/useVariant';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listVariants, type VariantName } from '@/components/modals/variants';

export function VariantSelector() {
  const { currentVariant, setVariant, config } = useVariant();
  const variants = listVariants();

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-400">Conductor Variant:</label>
      <Select value={currentVariant} onValueChange={(value) => setVariant(value as VariantName)}>
        <SelectTrigger className="w-48 bg-[#1a1f2e] border-[#2a3142]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
          {variants.map((variant) => (
            <SelectItem key={variant} value={variant} className="text-white">
              {variant}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {config && <div className="text-xs text-gray-500">v{config.version}</div>}
    </div>
  );
}
```

## Step 8: Add Variant Selector to App Header

Update your HeaderBar or main layout to include the variant selector:

```tsx
import { VariantSelector } from '@/components/VariantSelector';

export function HeaderBar() {
  return (
    <header className="flex justify-between items-center">
      {/* ... existing header content ... */}
      <VariantSelector />
    </header>
  );
}
```

## Creating Additional Variants

To add a new variant (e.g., `conductor-enterprise-v2`):

1. **Create directory structure:**

   ```
   src/components/modals/variants/conductor-enterprise-v2/
   ├── operators/
   ├── system-tasks/
   └── config.ts
   ```

2. **Implement custom modals** following the same pattern as conductor-custom-v1

3. **Create config.ts** with variant-specific settings

4. **Register in `src/components/modals/variants/index.ts`:**

   ```tsx
   import * as ConductorEnterpriseV2Operators from './conductor-enterprise-v2/operators';
   import { CONDUCTOR_ENTERPRISE_V2_CONFIG } from './conductor-enterprise-v2/config';

   const variants: VariantRegistry = {
     // ... existing variants ...
     'conductor-enterprise-v2': {
       operators: ConductorEnterpriseV2Operators,
       config: CONDUCTOR_ENTERPRISE_V2_CONFIG,
     },
   };
   ```

## Benefits of This Approach

✅ **Non-Invasive** - Original modals remain untouched
✅ **Scalable** - Add new variants without code duplication
✅ **Type-Safe** - Full TypeScript support for variant-specific configs
✅ **Reusable** - Variants can extend base functionality
✅ **Swappable** - Switch between variants at runtime
✅ **Persistent** - Variant selection is stored in localStorage
✅ **Organized** - Clear separation of concerns
✅ **Testable** - Each variant can be tested independently

## Testing Your Variant

1. **Create test modals** with simplified implementations
2. **Use Zustand devtools** to verify variant switching
3. **Check localStorage** to confirm persistence
4. **Validate modal rendering** with your variant selected

## Troubleshooting

### Modal not rendering

- Check that variant name is registered in `index.ts`
- Verify exports are correct in variant's `index.ts`
- Ensure component names match expected interface

### Variant not persisting

- Clear localStorage: `localStorage.removeItem('variant-store')`
- Check Zustand persist middleware configuration

### Type errors

- Ensure all variant components implement required props
- Verify extended config types are properly exported

## Step 9: Adding New Fields to Workflow Definition JSON (Without Modifying Base)

**DO NOT modify:** `src/stores/workflowStore.ts` or any base workflow types

**INSTEAD:** Create extension types in your variant folder that overlay on top of the base workflow:

### Create a Workflow Extension Type (In Your Variant Folder)

**File: `src/variants/conductor-custom-v1/extensions/workflowExtensions.ts`**

```typescript
/**
 * Workflow Extension System
 * Allows adding custom fields to workflow definitions WITHOUT modifying base types
 *
 * This is a PURE ADDITION - the base Workflow type remains untouched.
 * Extensions only exist in your variant's context.
 */

import { Workflow } from '@/stores/workflowStore';

export interface WorkflowExtension {
  [key: string]: unknown;
}

export interface ExtendedWorkflow extends Workflow {
  // NEW FIELDS - Only in this variant
  extensions?: WorkflowExtension;
  customMetadata?: {
    variantName?: string;
    variantVersion?: string;
    customFields?: Record<string, unknown>;
    tags?: string[];
    category?: string;
    [key: string]: unknown;
  };
}

/**
 * Helper functions for workflow extensions
 * Use these to safely add/read custom fields without modifying the base Workflow type
 */
export function getWorkflowExtension(workflow: Workflow, key: string): unknown {
  const extended = workflow as ExtendedWorkflow;
  return extended.extensions?.[key];
}

export function setWorkflowExtension(
  workflow: Workflow,
  key: string,
  value: unknown
): ExtendedWorkflow {
  const extended = workflow as ExtendedWorkflow;
  return {
    ...extended,
    extensions: {
      ...extended.extensions,
      [key]: value,
    },
  };
}

export function getCustomMetadata(workflow: Workflow, key: string): unknown {
  const extended = workflow as ExtendedWorkflow;
  return extended.customMetadata?.[key];
}

export function setCustomMetadata(
  workflow: Workflow,
  key: string,
  value: unknown
): ExtendedWorkflow {
  const extended = workflow as ExtendedWorkflow;
  return {
    ...extended,
    customMetadata: {
      ...extended.customMetadata,
      [key]: value,
    },
  };
}
```

### Usage in Your Variant

```typescript
// SAFE: This creates an extended version without modifying the base
const extendedWorkflow: ExtendedWorkflow = setCustomMetadata(
  baseWorkflow,
  'category',
  'payment-flows'
);

// Base workflow is unchanged
console.log(baseWorkflow.customMetadata); // undefined - still works normally
console.log(extendedWorkflow.customMetadata); // { category: 'payment-flows' }
```

## Step 10: Adding New Fields to Task Definition JSON (Without Modifying Base)

**DO NOT modify:** `src/types/taskDefinition.ts` or `src/constants/taskDefinitions.ts`

**INSTEAD:** Create extension types in your variant folder:

**File: `src/variants/conductor-custom-v1/extensions/taskExtensions.ts`**

```typescript
/**
 * Task Definition Extension System
 * Allows adding custom fields to task definitions WITHOUT modifying base types
 *
 * This is a PURE ADDITION - the base task definition types remain untouched.
 */

// Import base types (read-only reference)
export interface ExtendedTaskDefinition {
  // Reference standard Conductor fields (don't copy these)
  name: string;
  description?: string;
  retryCount?: number;
  retryLogic?: string;
  retryDelaySeconds?: number;

  // NEW FIELDS - Only in this variant's context
  extensions?: {
    [key: string]: unknown;
  };
  customMetadata?: {
    category?: string;
    owner?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

/**
 * Helper functions for task definition extensions
 * Use these to safely add/read custom fields without modifying base task definitions
 */
export function getTaskExtension(taskDef: any, key: string): unknown {
  return taskDef.extensions?.[key];
}

export function setTaskExtension(taskDef: any, key: string, value: unknown): any {
  return {
    ...taskDef,
    extensions: {
      ...taskDef.extensions,
      [key]: value,
    },
  };
}

export function getTaskCustomMetadata(taskDef: any, key: string): unknown {
  return taskDef.customMetadata?.[key];
}

export function setTaskCustomMetadata(taskDef: any, key: string, value: unknown): any {
  return {
    ...taskDef,
    customMetadata: {
      ...taskDef.customMetadata,
      [key]: value,
    },
  };
}

/**
 * EXAMPLE: Adding variant-specific retry policy
 */
export function setTaskRetryPolicy(taskDef: any, policy: 'exponential' | 'linear' | 'none'): any {
  return setTaskCustomMetadata(taskDef, 'retryPolicy', policy);
}
```

### Usage

```typescript
// SAFE: This creates an extended version without modifying the base
const extendedTask = setTaskCustomMetadata(baseTaskDef, 'category', 'payment-processing');

// Base task definition is unchanged
console.log(baseTaskDef.customMetadata); // undefined - still works normally
console.log(extendedTask.customMetadata); // { category: 'payment-processing' }
```

## Step 11: Creating New Task Type Modals (In Your Variant Folder)

**DO NOT modify:** Base system tasks or operator modals

**INSTEAD:** Create completely new task types in your variant folder:

### 1. Create Task Type Configuration (In Variant Folder)

**File: `src/variants/conductor-custom-v1/system-tasks/config.ts`**

```typescript
/**
 * Custom task type registry
 * Define NEW task types specific to your variant (no base file modifications!)
 *
 * These are entirely NEW task types - not modifications of existing ones.
 */

export interface CustomTaskTypeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'system' | 'custom' | 'integration';
  fields: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    defaultValue?: unknown;
  }>;
}

export const CUSTOM_TASK_TYPES: Record<string, CustomTaskTypeDefinition> = {
  CUSTOM_API_CALL: {
    id: 'CUSTOM_API_CALL',
    name: 'Custom API Call',
    description: 'Make HTTP requests with custom authentication',
    icon: 'Globe',
    category: 'custom',
    fields: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'API endpoint URL',
      },
      {
        name: 'method',
        type: 'string',
        required: true,
        description: 'HTTP method (GET, POST, etc.)',
      },
      {
        name: 'authType',
        type: 'string',
        required: false,
        description: 'Authentication type (basic, bearer, oauth2)',
      },
      {
        name: 'timeout',
        type: 'number',
        required: false,
        description: 'Request timeout in seconds',
        defaultValue: 30,
      },
    ],
  },
  CUSTOM_DATABASE_QUERY: {
    id: 'CUSTOM_DATABASE_QUERY',
    name: 'Custom Database Query',
    description: 'Execute database queries with connection pooling',
    icon: 'Database',
    category: 'custom',
    fields: [
      {
        name: 'connectionPool',
        type: 'string',
        required: true,
        description: 'Database connection pool name',
      },
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'SQL query to execute',
      },
      {
        name: 'parameters',
        type: 'object',
        required: false,
        description: 'Query parameters',
      },
    ],
  },
};
```

### 2. Create the Modal Component (In Variant Folder)

**File: `src/variants/conductor-custom-v1/system-tasks/CustomApiCallModal.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '@/components/modals/BaseTaskModal';
// ^^^ Import base from original location - don't copy this
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CustomApiCallConfig extends BaseTaskConfig {
  type: 'CUSTOM_API_CALL';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authType?: 'basic' | 'bearer' | 'oauth2';
  timeout?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

interface CustomApiCallModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: CustomApiCallConfig) => void;
  readonly initialConfig?: CustomApiCallConfig;
}

export function CustomApiCallModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: CustomApiCallModalProps) {
  const [config, setConfig] = useState<CustomApiCallConfig>({
    name: 'Custom API Call',
    taskReferenceName: 'custom_api_call_ref',
    type: 'CUSTOM_API_CALL',
    url: '',
    method: 'GET',
    timeout: 30,
  });

  useEffect(() => {
    if (open && initialConfig) {
      setConfig(initialConfig);
    }
  }, [open, initialConfig]);

  const validateConfig = (cfg: CustomApiCallConfig): string | null => {
    if (!cfg.url?.trim()) return 'URL is required';
    if (!cfg.method) return 'HTTP method is required';
    try {
      new URL(cfg.url);
    } catch {
      return 'Invalid URL format';
    }
    return null;
  };

  return (
    <BaseTaskModal<CustomApiCallConfig>
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Custom API Call Configuration"
      description="Configure custom HTTP API calls with advanced options"
      validateConfig={validateConfig}
      customBasicFields={
        <Card className="p-6 bg-[#0f1419] border-[#2a3142] mt-4 space-y-4">
          <div>
            <Label className="text-white">URL *</Label>
            <Input
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
              className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
            />
          </div>

          <div>
            <Label className="text-white">HTTP Method *</Label>
            <Select
              value={config.method}
              onValueChange={(value: any) => setConfig({ ...config, method: value })}
            >
              <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Authentication Type</Label>
            <Select
              value={config.authType || 'none'}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  authType: value === 'none' ? undefined : (value as any),
                })
              }
            >
              <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="oauth2">OAuth2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Timeout (seconds)</Label>
            <Input
              type="number"
              value={config.timeout}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value, 10) })}
              min="1"
              max="300"
              className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
            />
          </div>
        </Card>
      }
    />
  );
}
```

### 3. Register Custom Task Type Modal (In Variant Folder)

**File: `src/variants/conductor-custom-v1/system-tasks/index.ts`**

```typescript
/**
 * System Tasks - Variant Specific
 * Re-export unmodified base tasks, add custom task types
 */

// Standard system tasks (re-export from base if not customizing)
export {
  HttpTaskModal,
  type HttpTaskConfig,
} from '@/components/modals/system-tasks/HttpSystemTaskModal';

export {
  KafkaPublishTaskModal,
  type KafkaPublishTaskConfig,
} from '@/components/modals/system-tasks/KafkaPublishSystemTaskModal';

// ... other standard tasks ...

// CUSTOM task type modals (NEW - not in base)
export { CustomApiCallModal, type CustomApiCallConfig } from './CustomApiCallModal';
export {
  CustomDatabaseQueryModal,
  type CustomDatabaseQueryConfig,
} from './CustomDatabaseQueryModal';

// Custom task type definitions
export { CUSTOM_TASK_TYPES } from './config';
```

## Step 12: Integrating Custom Task Types (In Your Variant Folder)

Update your variant configuration to register custom task types:

**File: `src/variants/conductor-custom-v1/config.ts`**

⚠️ **IMPORTANT:** This config only describes what is supported in your variant. It does NOT modify any base files.

```typescript
import { CUSTOM_TASK_TYPES } from './system-tasks/config';

export interface VariantConfig {
  name: string;
  description: string;
  version: string;
  supportedTaskTypes: string[]; // Lists types - doesn't modify base definitions
  supportedOperators: string[]; // Lists operators - doesn't modify base operators
  customTaskTypes: Record<string, any>;
  features: {
    enableAdvancedParallelization: boolean;
    enableCustomValidation: boolean;
    enableVariantSpecificFields: boolean;
    enableCustomTaskTypes: boolean;
  };
}

export const CONDUCTOR_CUSTOM_V1_CONFIG: VariantConfig = {
  name: 'Conductor Custom V1',
  description: 'Customized Conductor variant with additional task types',
  version: '1.0.0',
  supportedTaskTypes: [
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
    // Add custom task types (NEW - just listed, not modifying base)
    ...Object.keys(CUSTOM_TASK_TYPES),
  ],
  supportedOperators: ['FORK_JOIN', 'FORK_JOIN_DYNAMIC', 'SWITCH', 'DO_WHILE', 'DYNAMIC', 'JOIN'],
  customTaskTypes: CUSTOM_TASK_TYPES,
  features: {
    enableAdvancedParallelization: true,
    enableCustomValidation: true,
    enableVariantSpecificFields: true,
    enableCustomTaskTypes: true,
  },
};
```

## Step 13: Creating a Task Type Registry Hook

**File: `src/hooks/useTaskTypeRegistry.ts`**

```typescript
import { useMemo } from 'react';
import { useVariant } from './useVariant';

export interface TaskTypeModal {
  Component: React.ComponentType<any>;
  config: any;
}

export function useTaskTypeRegistry() {
  const { config: variantConfig, operators, ...other } = useVariant();

  return useMemo(() => {
    const taskTypeRegistry = new Map<string, TaskTypeModal>();

    // Register standard task types
    const standardTasks = [
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
    ];

    standardTasks.forEach((taskType) => {
      // Register from default or variant-specific modals
      // Implementation depends on your modal loading strategy
    });

    // Register custom task types from variant
    if (variantConfig?.customTaskTypes) {
      Object.entries(variantConfig.customTaskTypes).forEach(([taskType, definition]) => {
        // Register custom task modal
        // You'll need to dynamically import or pass the Component
      });
    }

    return {
      taskTypeRegistry,
      supportedTaskTypes: variantConfig?.supportedTaskTypes || [],
      customTaskTypes: variantConfig?.customTaskTypes || {},
      isCustomTaskType: (taskType: string) =>
        Object.keys(variantConfig?.customTaskTypes || {}).includes(taskType),
    };
  }, [variantConfig]);
}
```

## Step 14: Extending WorkflowDesigner with Custom Task Types

Update `src/pages/WorkflowDesigner.tsx` to handle custom task types:

```tsx
import { useTaskTypeRegistry } from '@/hooks/useTaskTypeRegistry';
import { ExtendedWorkflow, setCustomMetadata } from '@/types/workflowExtensions';

export function WorkflowDesigner() {
  const { taskTypeRegistry, supportedTaskTypes, customTaskTypes } = useTaskTypeRegistry();

  // When adding a task to workflow
  const handleAddCustomTask = (taskType: string) => {
    if (customTaskTypes[taskType]) {
      const newTask = {
        name: `${taskType}_${Date.now()}`,
        taskReferenceName: `${taskType}_ref_${Date.now()}`,
        type: taskType,
        // ... other task properties
      };

      // Add to nodes
      setNodes((nodes) => [
        ...nodes,
        {
          id: newTask.taskReferenceName,
          data: { label: newTask.name, type: taskType },
          position: { x: 0, y: 0 },
        },
      ]);
    }
  };

  return (
    <>
      {/* Task Library Sidebar - show custom task types */}
      <TaskLibrarySidebar
        customTaskTypes={customTaskTypes}
        onSelectCustomTask={handleAddCustomTask}
      />
    </>
  );
}
```

## Step 15: JSON Export/Import with Extensions (Variant-Specific Only)

Create utilities in your variant folder to handle extended JSON:

**File: `src/variants/conductor-custom-v1/utils/workflowExtensionSerializer.ts`**

⚠️ **IMPORTANT:** These utilities only serialize/deserialize variant-specific extensions. Base workflow JSON remains unchanged.

```typescript
/**
 * Workflow Extension Serialization
 * Handles export/import of variant-specific extensions ONLY
 * Base workflow JSON remains untouched
 */

import { ExtendedWorkflow } from '../extensions/workflowExtensions';
import { Workflow } from '@/stores/workflowStore';

/**
 * Export workflow with all variant extensions to JSON
 * The resulting JSON includes variant-specific fields but is backwards compatible
 */
export function exportWorkflowWithExtensions(workflow: ExtendedWorkflow): string {
  const exportData = {
    // Standard Conductor fields (unchanged)
    name: workflow.name,
    description: workflow.description,
    version: workflow.version || 1,
    tasks: workflow.tasks,
    inputParameters: workflow.inputParameters,
    outputParameters: workflow.outputParameters,

    // VARIANT EXTENSIONS ONLY (new fields in your variant)
    extensions: workflow.extensions,
    customMetadata: workflow.customMetadata,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import workflow with extensions from JSON
 * Safely loads both base and variant-specific fields
 */
export function importWorkflowWithExtensions(jsonString: string): ExtendedWorkflow {
  const data = JSON.parse(jsonString);

  return {
    ...data,
    extensions: data.extensions || {},
    customMetadata: data.customMetadata || {},
  };
}

/**
 * Validate workflow against variant schema
 * Only validates variant-specific requirements
 */
export function validateWorkflowForVariant(
  workflow: ExtendedWorkflow,
  variantConfig: any
): Array<{ field: string; error: string }> {
  const errors: Array<{ field: string; error: string }> = [];

  // Validate task types (check against variant supported types)
  if (workflow.tasks) {
    workflow.tasks.forEach((task: any, index: number) => {
      if (!variantConfig.supportedTaskTypes.includes(task.type)) {
        errors.push({
          field: `tasks[${index}].type`,
          error: `Task type '${task.type}' not supported in this variant`,
        });
      }
    });
  }

  return errors;
}
```

## CRITICAL SUMMARY: Keep Separation of Concerns

This table shows what you MUST and MUST NOT do:

| What                    | Location                                         | Modify? | Notes                                                        |
| ----------------------- | ------------------------------------------------ | ------- | ------------------------------------------------------------ |
| **Base Modals**         | `src/components/modals/`                         | ❌ NO   | NEVER modify. These are read-only reference implementations. |
| **Base Task Defs**      | `src/constants/taskDefinitions.ts`               | ❌ NO   | NEVER modify. This is the source of truth.                   |
| **Base Task Types**     | `src/types/taskDefinition.ts`                    | ❌ NO   | NEVER modify. Only import from this.                         |
| **Base Workflow Store** | `src/stores/workflowStore.ts`                    | ❌ NO   | NEVER modify. Only use through hooks.                        |
| **Base Operators**      | `src/components/modals/operators/`               | ❌ NO   | NEVER modify. These are read-only.                           |
| **System Task Modals**  | `src/components/modals/system-tasks/`            | ❌ NO   | NEVER modify. These are read-only.                           |
| **Variant Modals**      | `src/variants/conductor-custom-v1/operators/`    | ✅ YES  | COPY base modals here if customizing.                        |
| **Variant Task Modals** | `src/variants/conductor-custom-v1/system-tasks/` | ✅ YES  | Create custom task type modals here.                         |
| **Variant Config**      | `src/variants/conductor-custom-v1/config.ts`     | ✅ YES  | Define variant-specific configuration.                       |
| **Extension Types**     | `src/variants/conductor-custom-v1/extensions/`   | ✅ YES  | Create extension types for new fields.                       |
| **Variant Hooks**       | `src/variants/conductor-custom-v1/hooks/`        | ✅ YES  | Create variant-specific logic here.                          |
| **Variant Registry**    | `src/variants/index.ts`                          | ✅ YES  | Register your variant here.                                  |

### Golden Rules

1. ✅ **DO** copy base modal files to your variant folder if you need to customize them
2. ✅ **DO** create extension types to add new fields to workflows/tasks
3. ✅ **DO** create new task type modals in your variant folder
4. ✅ **DO** register everything in your variant's config and registry
5. ❌ **DON'T** modify any file in `src/components/modals/`
6. ❌ **DON'T** modify `src/constants/` or base `src/types/`
7. ❌ **DON'T** modify `src/stores/workflowStore.ts`
8. ❌ **DON'T** modify core workflow or task JSON schemas
9. ❌ **DON'T** create your variant code outside of `src/variants/`

### Why This Matters

- **Upgradability**: When base modals are updated, you can decide to adopt changes or stay on your custom version
- **Maintainability**: Easy to see what's custom vs. what's standard
- **No Conflicts**: Multiple variants can coexist without interference
- **Clear Git History**: Base changes never mix with variant changes
- **Team Clarity**: Everyone knows what's extensible and what's not

## Next Steps

1. Create your first variant following this guide
2. Copy base modals you need to customize
3. Create new task type modals specific to your variant
4. Add extension types for new fields (workflows, tasks, configs)
5. Register everything in your variant's config
6. Test switching between variants
7. Add variant-specific documentation in `src/variants/conductor-custom-v1/README.md`
