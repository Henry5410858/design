# Execution Context Management Guide

## Overview

This guide explains how to properly manage JavaScript execution contexts in our Next.js application to prevent context loss during async operations, event handlers, and Promise chains.

## The Problem

JavaScript operations like `setTimeout`, `setInterval`, event handlers, and Promises create new execution contexts. When these operations are not properly managed, they can lose access to the original execution context, leading to:

- Stale closures
- Lost component state references
- Unhandled promise rejections
- Memory leaks
- Inconsistent application behavior

## Solutions Implemented

### 1. Context Manager Utility (`/src/utils/contextManager.ts`)

We've created a comprehensive utility that provides context-aware wrappers for common async operations:

#### Key Functions:

- `createContextAwareTimeout()` - Preserves context in setTimeout operations
- `createContextAwarePromise()` - Wraps Promises with context preservation
- `withContextPreservation()` - Wraps async functions to maintain context
- `safeAsync()` - Safe wrapper for async operations with fallbacks
- `createContextAwareEventHandler()` - Context-aware event handlers

### 2. Before vs After Examples

#### ❌ Before (Context Loss):
```typescript
const handleEnhance = async () => {
  setEnhancing(true);
  // Context may be lost here
  setTimeout(() => {
    setEnhancing(false); // May not have access to component state
  }, 3000);
};
```

#### ✅ After (Context Preserved):
```typescript
const handleEnhance = async () => {
  setEnhancing(true);
  
  await safeAsync(
    () => createContextAwarePromise<void>(
      (resolve) => {
        setTimeout(() => {
          setEnhancing(false);
          resolve();
        }, 3000);
      },
      {
        onError: (error) => {
          console.error('AI enhancement failed:', error);
          setEnhancing(false);
        },
        onSuccess: () => {
          console.log('AI enhancement completed successfully');
        }
      }
    ),
    undefined,
    {
      onError: (error) => {
        console.error('Safe async operation failed:', error);
        setEnhancing(false);
      }
    }
  );
};
```

### 3. User Context Improvements

#### ❌ Before (Stale Closures):
```typescript
useEffect(() => {
  const fetchUser = async () => {
    const res = await fetch('/api/auth/validate');
    if (!res.ok) {
      // pathname and router may be stale here
      router.replace('/login');
    }
  };
  fetchUser();
}, [isClient, router, pathname]);
```

#### ✅ After (Context Captured):
```typescript
useEffect(() => {
  const fetchUser = async () => {
    try {
      // Capture current context values
      const currentPathname = pathname;
      const currentRouter = router;
      
      const res = await fetch('/api/auth/validate');
      if (!res.ok) {
        // Use captured values to avoid stale closure
        if (currentPathname !== '/login' && currentPathname !== '/signup') {
          currentRouter.replace('/login');
        }
      }
    } catch (error) {
      // Proper error handling with context preservation
      console.error('Error fetching user:', error);
    }
  };
  
  fetchUser().catch(error => {
    console.error('Unhandled error in fetchUser:', error);
  });
}, [isClient, router, pathname]);
```

## Best Practices

### 1. Always Use Context-Aware Wrappers

For any async operation that might lose context:

```typescript
// Use withContextPreservation for async functions
const handleSave = withContextPreservation(async (data) => {
  // Your async logic here
}, {
  onError: (error) => {
    console.error('Operation failed:', error);
  }
});
```

### 2. Capture Context Values

When passing values to async operations, capture them first:

```typescript
const handleAsyncOperation = async () => {
  // Capture current values
  const currentUser = user;
  const currentPathname = pathname;
  
  await someAsyncOperation();
  
  // Use captured values
  if (currentUser && currentPathname !== '/login') {
    // Safe to use captured values
  }
};
```

### 3. Proper Error Handling

Always wrap async operations with proper error handling:

```typescript
await safeAsync(
  () => riskyAsyncOperation(),
  fallbackValue, // Fallback if operation fails
  {
    onError: (error) => {
      // Handle error appropriately
      console.error('Operation failed:', error);
    }
  }
);
```

### 4. Event Handler Context Preservation

For event handlers that perform async operations:

```typescript
const handleClick = createContextAwareEventHandler(
  async (event) => {
    // Your async logic here
    await someAsyncOperation();
  },
  {
    onError: (error) => {
      console.error('Event handler failed:', error);
    }
  }
);
```

## Files Updated

The following files have been updated with proper execution context management:

1. **`/src/utils/contextManager.ts`** - New utility for context management
2. **`/src/context/UserContext.tsx`** - Improved user context with context preservation
3. **`/src/app/ai-enhance/page.tsx`** - Context-aware AI enhancement
4. **`/src/app/flyers/page.tsx`** - Context-aware CRUD operations
5. **`/src/app/change-userinfo/page.tsx`** - Context-aware form handling

## Testing

To verify that execution context is properly maintained:

1. **Build Test**: Run `npm run build` to ensure no compilation errors
2. **Runtime Test**: Check browser console for proper error handling
3. **State Test**: Verify that component state updates correctly after async operations
4. **Navigation Test**: Ensure navigation works correctly after async operations

## Common Patterns

### Pattern 1: Async Function with Context Preservation
```typescript
const asyncFunction = withContextPreservation(async (param) => {
  // Your async logic
}, {
  onError: (error) => console.error('Error:', error)
});
```

### Pattern 2: Safe Async Operation
```typescript
const result = await safeAsync(
  () => riskyOperation(),
  defaultValue,
  { onError: (error) => handleError(error) }
);
```

### Pattern 3: Context-Aware Timeout
```typescript
const cleanup = createContextAwareTimeout(
  () => {
    // Your timeout logic
  },
  1000,
  {
    onError: (error) => console.error('Timeout error:', error)
  }
);

// Call cleanup() when component unmounts
```

## Benefits

1. **Reliability**: Prevents context loss and stale closures
2. **Error Handling**: Comprehensive error handling for async operations
3. **Maintainability**: Consistent patterns across the application
4. **Debugging**: Better error messages and logging
5. **Performance**: Proper cleanup and memory management

## Migration Guide

When updating existing code:

1. Import the context manager utilities
2. Wrap async functions with `withContextPreservation`
3. Replace direct `setTimeout` with `createContextAwareTimeout`
4. Add proper error handling with `safeAsync`
5. Capture context values before async operations
6. Test thoroughly to ensure context is preserved

This approach ensures that your JavaScript operations maintain proper execution context, leading to more reliable and maintainable code.
