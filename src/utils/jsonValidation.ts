/**
 * Utility functions for JSON validation and error handling
 */

export interface JsonValidationResult {
  isValid: boolean;
  errorMessage: string;
  errorLine: number | null;
}

/**
 * Extracts position information from JSON parse error messages
 */
function extractPositionFromError(errorMessage: string): number | null {
  const positionRegexes = [/position (\d+)/i, /at position (\d+)/i, /character (\d+)/i];

  for (const regex of positionRegexes) {
    const match = regex.exec(errorMessage);
    if (match) {
      return Number.parseInt(match[1]);
    }
  }

  return null;
}

/**
 * Extracts line number directly from error message
 */
function extractLineFromError(errorMessage: string): number | null {
  const directLineRegex = /line (\d+)/i;
  const match = directLineRegex.exec(errorMessage);
  return match ? Number.parseInt(match[1]) : null;
}

/**
 * Calculates line and column from position in text
 */
function calculateLineAndColumn(text: string, position: number): { line: number; column: number } {
  const textBeforeError = text.substring(0, position);
  const line = textBeforeError.split('\n').length;
  const lastNewline = textBeforeError.lastIndexOf('\n');
  const column = position - lastNewline;

  return { line, column };
}

/**
 * Formats error message with line and column information
 */
function formatErrorMessage(baseMessage: string, line: number | null, column?: number): string {
  if (!line) {
    return baseMessage;
  }

  if (column) {
    return baseMessage.replace(/position \d+/i, `line ${line}, column ${column}`);
  }

  return `Line ${line}: ${baseMessage}`;
}

/**
 * Validates JSON string and returns detailed error information
 */
export function validateJsonString(value: string): JsonValidationResult {
  // Empty string is valid
  if (value.trim() === '') {
    return {
      isValid: true,
      errorMessage: '',
      errorLine: null,
    };
  }

  try {
    JSON.parse(value);
    return {
      isValid: true,
      errorMessage: '',
      errorLine: null,
    };
  } catch (error) {
    if (!(error instanceof Error)) {
      return {
        isValid: false,
        errorMessage: 'Invalid JSON format',
        errorLine: null,
      };
    }

    const errorMessage = error.message;
    let lineNumber = extractLineFromError(errorMessage);

    // If no direct line number, try to extract from position
    if (!lineNumber) {
      const position = extractPositionFromError(errorMessage);
      if (position !== null) {
        const { line, column } = calculateLineAndColumn(value, position);
        lineNumber = line;
        return {
          isValid: false,
          errorMessage: formatErrorMessage(errorMessage, lineNumber, column),
          errorLine: lineNumber,
        };
      }
    }

    return {
      isValid: false,
      errorMessage: formatErrorMessage(errorMessage, lineNumber),
      errorLine: lineNumber,
    };
  }
}

/**
 * Generates line numbers HTML for a code editor
 */
export function generateLineNumbersHtml(lineCount: number, errorLine: number | null): string {
  return Array.from({ length: lineCount }, (_, i) => {
    const lineNum = i + 1;
    const isErrorLine = errorLine === lineNum;
    return `<div class="line-number ${isErrorLine ? 'error-line' : ''}">${lineNum}</div>`;
  }).join('');
}
