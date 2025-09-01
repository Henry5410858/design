/**
 * Context Manager Utility
 * Helps preserve execution context across async operations
 */

export interface ContextManagerOptions {
  timeout?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Creates a context-aware setTimeout that preserves execution context
 */
export function createContextAwareTimeout(
  callback: () => void,
  delay: number,
  options: ContextManagerOptions = {}
): () => void {
  const { onError, onSuccess } = options;
  
  const timeoutId = setTimeout(() => {
    try {
      callback();
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error('Error in context-aware timeout:', err);
    }
  }, delay);
  
  // Return cleanup function
  return () => clearTimeout(timeoutId);
}

/**
 * Creates a context-aware Promise that preserves execution context
 */
export function createContextAwarePromise<T>(
  executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void,
  options: ContextManagerOptions = {}
): Promise<T> {
  const { onError, onSuccess } = options;
  
  return new Promise<T>((resolve, reject) => {
    try {
      executor(
        (value: T) => {
          try {
            resolve(value);
            onSuccess?.();
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            reject(err);
          }
        },
        (reason?: any) => {
          try {
            reject(reason);
            const err = reason instanceof Error ? reason : new Error(String(reason));
            onError?.(err);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            reject(err);
          }
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      reject(err);
    }
  });
}

/**
 * Wraps an async function to preserve context and handle errors
 */
export function withContextPreservation<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: ContextManagerOptions = {}
) {
  return async (...args: T): Promise<R> => {
    const { onError, onSuccess } = options;
    
    try {
      const result = await fn(...args);
      onSuccess?.();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      throw err;
    }
  };
}

/**
 * Creates a debounced function that preserves context
 */
export function createContextAwareDebounce<T extends any[]>(
  fn: (...args: T) => void,
  delay: number,
  options: ContextManagerOptions = {}
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  const { onError, onSuccess } = options;
  
  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      try {
        fn(...args);
        onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        console.error('Error in debounced function:', err);
      }
    }, delay);
  };
}

/**
 * Creates a throttled function that preserves context
 */
export function createContextAwareThrottle<T extends any[]>(
  fn: (...args: T) => void,
  delay: number,
  options: ContextManagerOptions = {}
): (...args: T) => void {
  let lastCall = 0;
  const { onError, onSuccess } = options;
  
  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      try {
        fn(...args);
        onSuccess?.();
        lastCall = now;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        console.error('Error in throttled function:', err);
      }
    }
  };
}

/**
 * Safe async operation wrapper that handles context preservation
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  options: ContextManagerOptions = {}
): Promise<T | undefined> {
  const { onError } = options;
  
  try {
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    console.error('Safe async operation failed:', err);
    return fallback;
  }
}

/**
 * Context-aware event handler wrapper
 */
export function createContextAwareEventHandler<T extends Event>(
  handler: (event: T) => void | Promise<void>,
  options: ContextManagerOptions = {}
): (event: T) => void {
  const { onError } = options;
  
  return (event: T) => {
    try {
      const result = handler(event);
      if (result instanceof Promise) {
        result.catch(error => {
          const err = error instanceof Error ? error : new Error(String(error));
          onError?.(err);
          console.error('Error in async event handler:', err);
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error('Error in event handler:', err);
    }
  };
}
