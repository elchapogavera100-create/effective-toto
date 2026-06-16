#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import WebCloner from '../src/index.js';
import * as utils from '../src/utils.js';

// Load environment variables
dotenv.config();

const version = '1.0.0';

program
  .name('web-copy-cat')
  .description('A powerful web cloning and scraping tool')
  .version(version);

// Clone command
program
  .command('clone <url>')
  .description('Clone a website')
  .option('-o, --output <dir>', 'Output directory', './cloned-site')
  .option('-d, --depth <n>', 'Maximum crawl depth', '2')
  .option('-p, --pages <n>', 'Maximum pages to clone', '50')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '10000')
  .option('-v, --verbose', 'Verbose logging')
  .option('--delay <ms>', 'Delay between requests in milliseconds', '1000')
  .action(async (url, options) => {
    try {
      // Validate URL
      if (!utils.isValidUrl(url)) {
        console.error('❌ Invalid URL provided');
        process.exit(1);
      }

      console.log(`🚀 Starting web-copy-cat v${version}`);
      console.log(`📋 Target: ${url}`);
      console.log(`📁 Output: ${options.output}`);

      const cloner = new WebCloner({
        baseUrl: url,
        outputDir: options.output,
        maxDepth: parseInt(options.depth),
        maxPages: parseInt(options.pages),
        timeout: parseInt(options.timeout),
        requestDelay: parseInt(options.delay),
        verbose: options.verbose || false
      });

      const result = await cloner.clone(url);
      
      console.log(`\n✅ Success!`);
      console.log(`📊 Pages cloned: ${result.pagesCloned}`);
      console.log(`📂 Location: ${result.output}`);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration from .env')
  .action(() => {
    const config = utils.loadConfig();
    console.log('\n📋 Current Configuration:');
    console.log('─'.repeat(50));
    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key.padEnd(20)}: ${value}`);
    });
    console.log('─'.repeat(50));
  });

// Version command
program
  .command('version')
  .description('Show version')
  .action(() => {
    console.log(`web-copy-cat v${version}`);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
