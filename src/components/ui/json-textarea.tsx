import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import styles from '@/styles/json-textarea.module.css';

interface JsonTextareaProps extends Omit<React.ComponentProps<typeof Textarea>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  showLineNumbers?: boolean;
  maxHeight?: string;
  isInvalid?: boolean;
}

const JsonTextarea = React.forwardRef<HTMLTextAreaElement, JsonTextareaProps>(
  ({ value, onChange, showLineNumbers = true, className, maxHeight = '600px', rows, isInvalid = false, ...props }, ref) => {
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
          rows={rows}
          {...props}
        />
      );
    }

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, rows || 1);

    // Calculate height based on line count and line height
    const lineHeight = 24; // 1.5rem = 24px
    const padding = 8; // Padding for better fit
    const calculatedHeight = lineCount * lineHeight + padding;

    return (
      <div
        className={cn(
          styles.jsonTextareaWrapper,
          isInvalid && styles.jsonTextareaWrapperError
        )}
        style={{
          '--calculated-height': `${calculatedHeight}px`,
          '--max-height': maxHeight,
        } as React.CSSProperties & { [key: string]: string }}
      >
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className={styles.lineNumbers}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={styles.lineNumber}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Textarea */}
        <div className={styles.textareaContainer}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              styles.textarea,
              '!border-none !rounded-none !shadow-none !px-0 !py-0 !min-h-0 !h-auto !bg-transparent',
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);

JsonTextarea.displayName = 'JsonTextarea';

export { JsonTextarea };
