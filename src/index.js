import WebCloner from './cloner.js';
import * as utils from './utils.js';

/**
 * Web Copy Cat - Main entry point
 * Exports WebCloner class and utility functions
 */

export { WebCloner as default };
export { utils };

/**
 * Usage example:
 * import WebCloner from './src/index.js';
 * 
 * const cloner = new WebCloner();
 * await cloner.clone('https://example.com');
 */
