import { memo, useState, useMemo, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  maxHeight?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  level?: number;
}

interface JsonNodeProps {
  nodeKey: string;
  value: any;
  level?: number;
  isLast?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const JsonNode = memo(({
  nodeKey,
  value,
  level = 0,
  isLast = false,
  collapsible = true,
  defaultExpanded = true,
}: JsonNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || level < 2);
  const indent = level * 20;

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const renderValue = useMemo(() => {
    if (value === null) {
      return <span className="text-purple-400">null</span>;
    }

    if (value === undefined) {
      return <span className="text-purple-400">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-orange-400">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-cyan-400">{value}</span>;
    }

    if (typeof value === 'string') {
      const displayValue = value.length > 200 ? `${value.substring(0, 200)}...` : value;
      return <span className="text-green-400">"{displayValue}"</span>;
    }

    if (Array.isArray(value)) {
      const itemCount = value.length;

      if (itemCount === 0) {
        return <span className="text-gray-400">[]</span>;
      }

      if (!collapsible || !isExpanded) {
        return (
          <span className="text-gray-400">
            [{itemCount} {itemCount === 1 ? 'item' : 'items'}]
          </span>
        );
      }

      return (
        <div>
          <span className="text-gray-400">[</span>
          <div>
            {value.map((item, index) => (
              <JsonNode
                key={index}
                nodeKey={index.toString()}
                value={item}
                level={level + 1}
                isLast={index === value.length - 1}
                collapsible={collapsible}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </div>
          <span className="text-gray-400" style={{ marginLeft: `${indent}px` }}>
            ]
          </span>
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const keyCount = keys.length;

      if (keyCount === 0) {
        return <span className="text-gray-400">{'{}'}</span>;
      }

      if (!collapsible || !isExpanded) {
        return (
          <span className="text-gray-400">
            {'{'}
            {keyCount} {keyCount === 1 ? 'key' : 'keys'}
            {'}'}
          </span>
        );
      }

      return (
        <div>
          <span className="text-gray-400">{'{'}</span>
          <div>
            {keys.map((key, index) => (
              <JsonNode
                key={key}
                nodeKey={key}
                value={value[key]}
                level={level + 1}
                isLast={index === keys.length - 1}
                collapsible={collapsible}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </div>
          <span className="text-gray-400" style={{ marginLeft: `${indent}px` }}>
            {'}'}
          </span>
        </div>
      );
    }

    return <span className="text-gray-400">{String(value)}</span>;
  }, [value, level, isExpanded, collapsible, defaultExpanded, indent]);

  const isExpandable = useMemo(() => {
    return (
      collapsible &&
      ((typeof value === 'object' && value !== null && Object.keys(value).length > 0) ||
        (Array.isArray(value) && value.length > 0))
    );
  }, [value, collapsible]);

  return (
    <div className="font-mono text-xs leading-relaxed">
      <div
        className="flex items-start hover:bg-muted/30 rounded px-1 py-0.5"
        style={{ marginLeft: `${indent}px` }}
      >
        {isExpandable && (
          <button
            onClick={toggleExpand}
            className="mr-1 mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>
        )}
        {!isExpandable && <span className="w-4 flex-shrink-0" />}

        {nodeKey && (
          <span className="text-blue-400 mr-2 flex-shrink-0">
            {Array.isArray(value) || typeof value === 'object' ? '' : '"'}
            {nodeKey}
            {Array.isArray(value) || typeof value === 'object' ? '' : '"'}:
          </span>
        )}

        <div className="flex-1 break-all">
          {renderValue}
          {!isLast && <span className="text-gray-400">,</span>}
        </div>
      </div>
    </div>
  );
});

JsonNode.displayName = 'JsonNode';

export const JsonViewer = memo(
  ({ data, maxHeight = 'none', collapsible = true, defaultExpanded = true, level = 0 }: JsonViewerProps) => {
    if (data === undefined || data === null) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs text-muted-foreground">
          No data available
        </div>
      );
    }

    const dataSize = useMemo(() => {
      try {
        return JSON.stringify(data).length;
      } catch {
        return 0;
      }
    }, [data]);

    const isLargeData = dataSize > 100000;

    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {isLargeData && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/50 px-4 py-2 text-xs text-yellow-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Large data detected ({(dataSize / 1024).toFixed(2)} KB). Performance may be impacted.
            </span>
          </div>
        )}
        <div className="p-4 overflow-auto" style={{ maxHeight }}>
          <JsonNode
            nodeKey=""
            value={data}
            level={level}
            collapsible={collapsible}
            defaultExpanded={defaultExpanded}
          />
        </div>
      </div>
    );
  }
);

JsonViewer.displayName = 'JsonViewer';
