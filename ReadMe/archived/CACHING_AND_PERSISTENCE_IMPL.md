# Conductor Designer: Caching & Persistence Full Guide

---

## Table of Contents

- [Overview](#overview)
- [Caching Architecture](#caching-architecture)
- [Persistence Implementation Summary](#persistence-implementation-summary)
- [How It Works](#how-it-works)
- [Testing & Verification](#testing--verification)
- [Configuration & Customization](#configuration--customization)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Migration & Future Enhancements](#migration--future-enhancements)
- [Support & References](#support--references)

---

## Overview

The Conductor Designer uses a **dual-layer caching strategy** to ensure WIP (Work In Progress) workflows are never lost while maintaining flexibility for backup and sharing. This guide covers the architecture, implementation, testing, and best practices for workflow persistence.

---

## Caching Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Conductor Designer UI                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           WorkflowDesigner Component                 │   │
│  │                                                       │   │
│  │  • Create/Edit Workflows                            │   │
│  │  • Add/Configure Tasks                              │   │
│  │  • Drag & Drop Canvas                               │   │
│  │  • JSON Preview                                     │   │
│  └─────────────┬───────────────────────────────────────┘   │
│                │                                             │
│                │ updateWorkflow(), addWorkflow()            │
│                ▼                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Zustand Workflow Store                      │   │
│  │                                                       │   │
│  │  State:                                              │   │
│  │  • workflows[]    ← Persisted                       │   │
│  │  • tasks[]        ← Persisted                       │   │
│  │  • canvasNodes[]  ← Persisted                       │   │
│  │  • canvasEdges[]  ← Persisted                       │   │
│  │  • executions[]   (runtime only)                    │   │
│  └─────────────┬───────────────────────────────────────┘   │
│                │                                             │
│                │ persist middleware (500ms debounce)        │
│                ▼                                             │
└─────────────────────────────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐    ┌──────────────────────┐
│   localStorage   │    │  FileStore Backend   │
│   (Primary)      │    │  (Optional/Backup)   │
│                  │    │                      │
│  Key:            │    │  Endpoints:          │
│  conductor-      │    │  • /filestore/save   │
│  workflow-store  │    │  • /filestore/load   │
│                  │    │  • /filestore/clear  │
│  Features:       │    │                      │
│  ✓ Offline       │    │  Features:           │
│  ✓ Fast          │    │  ✓ Team sharing      │
│  ✓ Auto-save     │    │  ✓ Backups           │
│  ✓ Persistent    │    │  ✓ Export/Import     │
│  ✓ 5-10MB limit  │    │  ✓ Cross-device      │
└─────────────────┘    └──────────────────────┘
```

### Data Flow Diagrams

#### Creating a New Workflow

...existing code...

#### Editing a Task Configuration

...existing code...

#### Page Refresh / Reload

...existing code...

### Persistence Layers Comparison

...existing code...

### State Partitioning

...existing code...

### Performance Characteristics

...existing code...

### Error Handling

...existing code...

### Migration Strategy

...existing code...

### Testing Checklist

...existing code...

### Monitoring & Debugging

...existing code...

### Security Considerations

...existing code...

### Conclusion

...existing code...

---

## Persistence Implementation Summary

### Zustand Persist Middleware

**File**: `src/stores/workflowStore.ts`

Added Zustand persist middleware to automatically cache workflows to browser localStorage:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set) => {
      /* store implementation */
    },
    {
      name: 'conductor-workflow-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workflows: state.workflows,
        tasks: state.tasks,
        canvasNodes: state.canvasNodes,
        canvasEdges: state.canvasEdges,
      }),
    }
  )
);
```

**What Gets Persisted:**

- ✅ Workflows (with nodes, edges, tasks, settings)
- ✅ Task definitions from library
- ✅ Canvas nodes and edges
- ✅ All WIP (Work In Progress) workflow data

**What Does NOT Get Persisted:**

- ❌ Executions (runtime data)
- ❌ Selected workflow/execution (UI state)

### Documentation Updates

...existing code...

### Persistence Guide

...existing code...

### Architecture Documentation

...existing code...

---

## How It Works

### Auto-Save Flow

```
User Action → WorkflowDesigner → Zustand Store → Persist Middleware → localStorage
                                     (500ms debounce)
```

### Restore Flow

```
Page Load → Zustand Init → Persist Middleware → Read localStorage → Hydrate State
```

### Key Features

...existing code...

---

## Testing & Verification

### Quick Test

1. Open Conductor Designer
2. Create a workflow with multiple tasks
3. Configure tasks with custom values
4. **Refresh the page (F5)**
5. ✅ Verify: All workflows and configurations restored

### Detailed Test Scenarios

- Test 1: Page Refresh
- Test 2: Browser Restart
- Test 3: Auto-Save During Editing
- Test 4: Multiple Workflows
- Test 5: Offline Mode

### Browser Developer Tools Verification

...existing code...

---

## Configuration & Customization

### Persist Middleware Settings

...existing code...

### Customize What Gets Persisted

...existing code...

### Change Storage Backend

...existing code...

### Change localStorage Key

...existing code...

### Persist Different State Fields

...existing code...

### Change Debounce Timing

...existing code...

---

## Troubleshooting

### Issue: Changes Not Persisting

...existing code...

### Issue: localStorage Quota Exceeded

...existing code...

### Issue: Corrupted State

...existing code...

### Issue: FileStore API Not Available

...existing code...

---

## Best Practices

1. **Regular Exports**: Copy important workflow JSONs for backup
2. **Version Control**: Commit workflow JSON files to git
3. **Browser Storage**: Stay within 80% of localStorage quota
4. **Clean Up**: Delete old/test workflows regularly
5. **Team Sharing**: Use FileStore backend for team collaboration
6. **Disaster Recovery**: Keep JSON exports of critical workflows

---

## Migration & Future Enhancements

### Migration from Previous Versions

...existing code...

### Future Scalability

...existing code...

### Next Steps (Optional Enhancements)

- Add localStorage usage indicator in UI
- Implement "Export All Workflows" feature
- Add "Clear Cache" button in Settings
- Show auto-save status indicator
- Implement workflow version history
- Add undo/redo with persistence
- Compress stored data (gzip)
- Add import/export UI
- Migrate to IndexedDB for larger capacity
- Implement cloud sync via FileStore
- Add conflict resolution for multi-device
- Implement workflow sharing/collaboration

---

## Support & References

- **Store**: `src/stores/workflowStore.ts` (Zustand + persist)
- **FileStore**: `src/utils/fileStore.ts` (Backend API client)
- **Designer**: `src/pages/WorkflowDesigner.tsx` (Auto-save logic)
- **Backend**: `fileStoreServer.js` (Optional server)
- **Persistence Guide**: `ReadMe/PERSISTENCE_GUIDE.md`
- **Architecture**: `ReadMe/CACHING_ARCHITECTURE.md`
- **Implementation Summary**: `ReadMe/IMPLEMENTATION_SUMMARY.md`
- **Zustand Docs**: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

For issues or questions about persistence:

1. Check browser console for errors
2. Verify localStorage in DevTools
3. Test with a fresh browser profile
4. Clear localStorage and retry
5. Check backend server status (if using FileStore)
