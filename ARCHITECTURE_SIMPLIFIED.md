# Simplified Architecture Option

## Current Structure (3 layers)
```
Page (WorkflowDiagram.tsx)
  ↓ uses
Component (WorkflowDiagramViewer.tsx)
  ↓ uses
Utility (workflowToMermaid.ts)
```

## Simplified Structure (2 layers)
```
Page (WorkflowDiagram.tsx)
  ↓ uses directly
Utility (workflowToMermaid.ts)
```

## Trade-offs

### Current (3 layers)
✅ Reusable UI component
✅ Consistent UI across pages
✅ Single place to update zoom/download logic
❌ More files
❌ More abstraction

### Simplified (2 layers)
✅ Fewer files
✅ Less abstraction
✅ Easier to understand
❌ Duplicate UI code in each page
❌ Harder to maintain consistency
❌ Can't reuse in designer preview modal

## Recommendation

**Keep WorkflowDiagramViewer IF:**
- You need to show diagrams in multiple places (pages, modals, widgets)
- You want consistent UI/UX across all diagram views
- You plan to add more diagram features (annotations, editing, etc.)

**Remove WorkflowDiagramViewer IF:**
- You only show diagrams on 2 pages (workflow & execution)
- You're okay with duplicating zoom/download/modal code
- You prefer simplicity over reusability

## What's Actually Reusable?

### workflowToMermaid.ts (Utility)
- ✅ Pure function
- ✅ No dependencies
- ✅ Easy to test
- ✅ Can be used anywhere (Node.js, browser, tests)

### WorkflowDiagramViewer.tsx (Component)
- ✅ Reusable UI
- ⚠️ React-specific
- ⚠️ Has dependencies (mermaid, UI components)
- ✅ Can be used in multiple pages/modals

### WorkflowDiagram.tsx (Page)
- ❌ Not reusable (it's a route)
- ❌ Page-specific logic
- ❌ Tied to routing

## Example: Without WorkflowDiagramViewer

Each page would need to duplicate this code:

```tsx
// WorkflowDiagram.tsx
const [zoom, setZoom] = useState(100);
const mermaidRef = useRef<HTMLDivElement>(null);

const renderDiagram = async () => {
  const mermaidCode = workflowToMermaid(workflow);
  const { svg } = await mermaid.render('id', mermaidCode);
  mermaidRef.current.innerHTML = svg;
};

return (
  <div>
    <Button onClick={() => setZoom(zoom + 10)}>Zoom In</Button>
    <Button onClick={() => setZoom(zoom - 10)}>Zoom Out</Button>
    <Button onClick={downloadSVG}>Download</Button>
    <div ref={mermaidRef} style={{ transform: `scale(${zoom/100})` }} />
  </div>
);
```

Then **ExecutionDiagram.tsx** would need the **exact same code**.
Then **Designer preview modal** would need the **exact same code**.

That's why we have `WorkflowDiagramViewer` - to avoid this duplication.
