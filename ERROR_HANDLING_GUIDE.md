# Error Handling Quick Reference

## For Developers Working on Ozen

This document provides quick examples of the error handling patterns now in place.

---

## 1. Try-Catch for Async Operations

```typescript
// ✅ GOOD - Always wrap risky operations
async function handleOperation() {
  try {
    const result = await riskyOperation();
    // handle success
  } catch (err: any) {
    console.error('Operation failed:', err);
    showUserFeedback(err.message);
  }
}
```

---

## 2. Promise.all() Protection

```typescript
// ✅ GOOD - Wrap in try-catch
async function loadMultiple() {
  try {
    const [data1, data2] = await Promise.all([
      fetchData1(),
      fetchData2()
    ]);
    // handle results
  } catch (err: any) {
    console.error('Failed to load data:', err);
    // graceful fallback
  }
}
```

---

## 3. Background Promise Handling

```typescript
// ✅ GOOD - Always catch background promises
backgroundOperation()
  .catch(err => {
    console.error('Background operation failed:', err);
  });

// ❌ BAD - Unhandled rejection
backgroundOperation(); // Can crash if it rejects!
```

---

## 4. Fetch with Timeout

```typescript
// ✅ GOOD - Use the fetchWithTimeout utility
const response = await fetchWithTimeout(url, options, 30000);

// Utility function (already implemented in useGroq.ts, useOllama.ts, membrain.ts)
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
```

---

## 5. IPC Handler Pattern

```typescript
// ✅ GOOD - Validate, check state, handle errors
ipcMain.on('handler-name', (_event, arg) => {
  try {
    // Step 1: Validate input
    if (!arg || typeof arg !== 'expected-type') {
      console.error('Invalid argument:', arg);
      return;
    }

    // Step 2: Check resource state
    if (!resource || resource.isDestroyed()) {
      console.warn('Resource not available');
      return;
    }

    // Step 3: Perform operation
    resource.doOperation(arg);
  } catch (err) {
    console.error('Handler error:', err);
  }
});
```

---

## 6. Event Handler Protection

```typescript
// ✅ GOOD - Wrap event handlers
eventEmitter.on('event', (data) => {
  try {
    processEvent(data);
  } catch (err) {
    console.error('Event handler error:', err);
    // System continues working
  }
});
```

---

## 7. Error Messages

```typescript
// ✅ GOOD - Specific with context
throw new Error(`Failed to load user ${userId}: ${err.message}`);

// ❌ BAD - Generic
throw new Error('Something went wrong');
```

---

## 8. Empty Catch Blocks

```typescript
// ❌ BAD - Silent failure
try {
  JSON.parse(data);
} catch (e) {}

// ✅ GOOD - At least log it
try {
  JSON.parse(data);
} catch (e) {
  console.error('JSON parse failed:', e, 'Data:', data);
}
```

---

## 9. Component Error Boundaries

Already implemented! All routes wrapped in `<ErrorBoundary>`:

```typescript
// App.tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

For custom error handling in specific components, create additional ErrorBoundary instances.

---

## 10. API Client Pattern (MembrainClient example)

```typescript
class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<T> {
    const response = await this.fetchWithTimeout(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }
}
```

---

## 11. Spawn Process Safety

```typescript
// ✅ GOOD - Handle spawn errors
const proc = spawn('command', ['args']);

proc.on('error', (err) => {
  console.error('Failed to spawn process:', err);
});

proc.on('exit', (code) => {
  if (code !== 0) {
    console.error('Process exited with code:', code);
  }
});
```

---

## 12. Global Error Handlers (already in main.tsx)

```typescript
// Catches unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Catches uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});
```

---

## Common Pitfalls to Avoid

1. ❌ **Empty catch blocks** - Always log errors
2. ❌ **Unhandled promise rejections** - Use .catch() on background promises
3. ❌ **No timeout on fetch** - Use fetchWithTimeout utility
4. ❌ **Generic error messages** - Include context
5. ❌ **Assuming resources exist** - Check window/resource state before operations
6. ❌ **No validation** - Validate IPC arguments and user input
7. ❌ **Letting one error break everything** - Use try-catch in event handlers

---

## Testing Your Error Handling

```typescript
// Test error boundary
throw new Error('Test error boundary');

// Test timeout
await fetchWithTimeout('http://httpstat.us/200?sleep=35000', {}, 5000);

// Test IPC validation
window.ipcRenderer.invoke('handler', null);

// Test promise rejection
Promise.reject(new Error('Test rejection'));
```

---

## When in Doubt

1. **Wrap it in try-catch** if it can throw
2. **Add .catch()** to promises
3. **Validate inputs** before using them
4. **Check resource state** before operations
5. **Log with context** when errors occur
6. **Give user feedback** when appropriate
7. **Let the system continue** after non-critical errors

---

**Remember**: Good error handling is about graceful degradation, not preventing all errors. The goal is to keep the app running and inform users when something goes wrong.
