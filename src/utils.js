/**
 * Utility functions for web-copy-cat
 */

/**
 * Delay execution (sleep)
 */
export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse command-line arguments into object
 */
export function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1]?.startsWith('--') ? true : args[++i];
      result[key] = value === 'true' ? true : value === 'false' ? false : value;
    }
  }
  return result;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];
  
  if (!config.targetUrl) {
    errors.push('TARGET_URL is required');
  } else if (!isValidUrl(config.targetUrl)) {
    errors.push('TARGET_URL must be a valid URL');
  }
  
  if (config.maxDepth && isNaN(config.maxDepth)) {
    errors.push('MAX_DEPTH must be a number');
  }
  
  if (config.maxPages && isNaN(config.maxPages)) {
    errors.push('MAX_PAGES must be a number');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Load environment configuration
 */
export function loadConfig() {
  return {
    targetUrl: process.env.TARGET_URL,
    outputDir: process.env.OUTPUT_DIR || './cloned-site',
    maxDepth: parseInt(process.env.MAX_DEPTH) || 2,
    maxPages: parseInt(process.env.MAX_PAGES) || 50,
    timeout: parseInt(process.env.TIMEOUT) || 10000,
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0',
    verbose: process.env.VERBOSE === 'true',
    respectRobots: process.env.RESPECT_ROBOTS !== 'false',
    requestDelay: parseInt(process.env.REQUEST_DELAY) || 1000
  };
}
