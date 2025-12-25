import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface JsonTextareaProps extends Omit<React.ComponentProps<typeof Textarea>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  showLineNumbers?: boolean;
}

const JsonTextarea = React.forwardRef<HTMLTextAreaElement, JsonTextareaProps>(
  ({ value, onChange, showLineNumbers = true, className, ...props }, ref) => {
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync scrolling between line numbers and textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      const lineNumbers = lineNumbersRef.current;

      if (!textarea || !lineNumbers) return;

      const handleScroll = () => {
        lineNumbers.scrollTop = textarea.scrollTop;
      };

      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }, []);

    // Merge refs
    useEffect(() => {
      if (ref && textareaRef.current) {
        if (typeof ref === 'function') {
          ref(textareaRef.current);
        } else {
          ref.current = textareaRef.current;
        }
      }
    }, [ref]);

    if (!showLineNumbers) {
      return (
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
          {...props}
        />
      );
    }

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, 1);

    // Calculate height based on line count and line height
    const lineHeight = 24; // 1.5rem = 24px
    const padding = 16; // py-2 = 8px top + 8px bottom for each side
    const calculatedHeight = lineCount * lineHeight + padding;

    return (
      <div
        className="flex rounded-md border border-input overflow-hidden w-full"
        style={{ height: `${calculatedHeight}px`, maxHeight: '600px' }}
      >
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="bg-muted border-r border-border px-3 py-2 text-right select-none overflow-y-auto flex-shrink-0"
          style={{ minWidth: '3.5rem', width: 'auto' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground font-mono leading-relaxed"
              style={{
                lineHeight: 'var(--line-height, 1.5rem)',
                height: 'var(--line-height, 1.5rem)',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Textarea */}
        <div className="flex-1 overflow-y-auto">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'border-0 focus-visible:ring-0 rounded-none resize-none w-full h-full',
              className
            )}
            style={{
              lineHeight: 'var(--line-height, 1.5rem)',
            }}
            {...props}
          />
        </div>
      </div>
    );
  }
);

JsonTextarea.displayName = 'JsonTextarea';

export { JsonTextarea };
