/**
 * Parses an Error's stack trace to find the original call site.
 * This is a bit of a hack, but it's the most common way to get this info.
 * The stack trace format can vary between browsers.
 * @returns {string} The file, line, and column number of the call site.
 */
function getCallSite() {
  try {
    throw new Error();
  } catch (e: any) {
    if (e.stack) {
      const stackLines = e.stack.split('\n');
      // The first line is "Error", the second is this function, the third is the wrapper.
      // The fourth line is the actual call site we want.
      if (stackLines[3]) {
        // Example line: '    at App.vue:29:9'
        // We'll extract the part after 'at '
        const callLine = stackLines[3].trim();
        const location = callLine.substring(callLine.indexOf('at ') + 3);
        // Clean up the URL prefix if it exists
        return location.replace(window.location.origin, '');
      }
    }
  }
  return 'unknown'; // Fallback
}


/**
 * Sends a log message to the local logging server.
 * @param level The log level (e.g., 'LOG', 'ERROR').
 * @param message The array of arguments passed to the console function.
 * @param location The file and line number where the log originated.
 */
function sendLogToServer(level: string, message: any[], location: string) {
  // Format the message
  const formattedMessage = message.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');

  navigator.sendBeacon('/api/log', JSON.stringify({
    level,
    message: formattedMessage,
    location, // 👈 ADDED: Include the location in the payload
    timestamp: new Date().toISOString(),
  }));
}

// 1. WRAP CONSOLE METHODS
// =========================
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

console.log = (...args) => {
  originalConsole.log.apply(console, args);
  sendLogToServer('LOG', args, getCallSite()); // 👈 Pass the call site
};
console.error = (...args) => {
  originalConsole.error.apply(console, args);
  sendLogToServer('ERROR', args, getCallSite()); // 👈 Pass the call site
};
console.warn = (...args) => {
  originalConsole.warn.apply(console, args);
  sendLogToServer('WARN', args, getCallSite()); // 👈 Pass the call site
};
console.info = (...args) => {
  originalConsole.info.apply(console, args);
  sendLogToServer('INFO', args, getCallSite()); // 👈 Pass the call site
};

// 2. CATCH UNCAUGHT RUNTIME ERRORS
// =================================
window.onerror = (message, source, lineno, colno, error) => {
  // We already have the location info here directly
  const cleanSource = source ? source.replace(window.location.origin, '') : 'unknown';
  const location = `${cleanSource}:${lineno}:${colno}`;
  
  const errorDetails = [`Uncaught Error: ${message}`];
  sendLogToServer('FATAL', errorDetails, location); // 👈 Pass the location

  return true;
};

// 3. CATCH UNHANDLED PROMISE REJECTIONS
// =======================================
window.addEventListener('unhandledrejection', event => {
  const reason = event.reason instanceof Error ? event.reason.stack : String(event.reason);
  // We can try to get location from the stack trace if it exists
  const location = event.reason instanceof Error ? getCallSite() : 'unknown';
  
  sendLogToServer('PROMISE_REJECTION', [`Unhandled Promise Rejection: ${reason}`], location);
});

import "@babylonjs/core/Audio/audioSceneComponent";
import "@babylonjs/core/Materials/Node/Blocks";
import "@babylonjs/core/Collisions/collisionCoordinator"; // To enable collisions
import "@babylonjs/loaders/glTF"; // To enable loading .glb meshes
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Helpers/sceneHelpers"; // To enable creating the default XR experience
import 'pepjs'
import { createSceneAsync } from "./scene";
import { setUpEngine } from "./managers/setUpEngine";
import { Engine } from "@babylonjs/core/Engines/engine";

if (import.meta.env.DEV) {
    console.log("Running in development mode");
}

const canvas = document.getElementById("canvas") as unknown as HTMLCanvasElement;

// The stencil engine option is necessary for mesh highlighting to work.
const engine = new Engine(canvas, true, { stencil: true });
setUpEngine(engine);
createSceneAsync(engine).then(scene => {
    engine.runRenderLoop(() => scene.render())
});
