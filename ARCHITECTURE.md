# Workflow Diagram Architecture

## File Structure

### Components (Reusable)
- `src/components/workflow/WorkflowDiagramViewer.tsx`
  - Pure presentation component
  - Renders Mermaid diagrams
  - Handles UI interactions (zoom, download, modals)
  - **Used by**: WorkflowDiagram page, ExecutionDiagram page, Designer preview

### Pages (Routes)
- `src/pages/WorkflowDiagram.tsx`
  - Route: `/workflows/:id/diagram`
  - Fetches workflow definition (API → Zustand fallback)
  - Page layout and navigation
  - **Uses**: WorkflowDiagramViewer component

- `src/pages/ExecutionDiagram.tsx`
  - Route: `/executions/:id/diagram`
  - Fetches execution data (API only, no fallback)
  - Page layout and navigation
  - **Uses**: WorkflowDiagramViewer component

- `src/pages/WorkflowDesigner.tsx`
  - Route: `/workflows/:id` (edit mode)
  - Visual workflow editor
  - Preview modal **uses**: WorkflowDiagramViewer component

## Data Flow

```
User Action → Page Component → Fetch Data → WorkflowDiagramViewer → Render
```

### Example 1: View Workflow Diagram
```
/workflows/123/diagram
    ↓
WorkflowDiagram.tsx (page)
    ↓ fetch from API/Zustand
    ↓
WorkflowDiagramViewer (component)
    ↓
Mermaid Diagram
```

### Example 2: Preview in Designer
```
WorkflowDesigner.tsx
    ↓ click "Preview"
    ↓
Modal with WorkflowDiagramViewer (component)
    ↓
Mermaid Diagram
```

### Example 3: View Execution Diagram
```
/executions/exec-123/diagram
    ↓
ExecutionDiagram.tsx (page)
    ↓ fetch from API
    ↓
WorkflowDiagramViewer (component)
    ↓
Mermaid Diagram (with status colors)
```

## Why Not Merge Them?

### If we merged WorkflowDiagram + WorkflowDiagramViewer:

❌ **Can't reuse in designer preview**
❌ **Can't reuse in execution diagram**
❌ **Harder to test**
❌ **Mixing concerns (routing + rendering)**

### Current Approach:

✅ **Single component, multiple uses**
✅ **Clean separation of concerns**
✅ **Easy to test**
✅ **Flexible and maintainable**

## Recommendation

**Keep the current structure** unless you have a specific reason to merge them.

The separation provides:
- Better code organization
- Reusability across different pages
- Easier maintenance
- Cleaner testing

## Usage Examples

### In a Page
```tsx
import { WorkflowDiagramViewer } from '@/components/workflow/WorkflowDiagramViewer';

function MyPage() {
  const workflow = fetchWorkflow();
  
  return (
    <div>
      <h1>My Page</h1>
      <WorkflowDiagramViewer 
        workflow={workflow} 
        type="definition" 
      />
    </div>
  );
}
```

### In a Modal
```tsx
<Dialog open={previewOpen}>
  <DialogContent>
    <WorkflowDiagramViewer 
      workflow={currentWorkflow} 
      type="preview" 
    />
  </DialogContent>
</Dialog>
```

### In a Dashboard Widget
```tsx
<Card>
  <CardHeader>Quick View</CardHeader>
  <CardContent>
    <WorkflowDiagramViewer 
      workflow={workflow} 
      type="definition"
      isFullscreen={false}
    />
  </CardContent>
</Card>
```
