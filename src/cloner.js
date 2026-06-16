import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import * as utils from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WebCloner - Core web cloning engine
 * Handles crawling, downloading, and asset management
 */
class WebCloner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.outputDir = options.outputDir || './cloned-site';
    this.maxDepth = options.maxDepth || 2;
    this.maxPages = options.maxPages || 50;
    this.timeout = options.timeout || 10000;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.requestDelay = options.requestDelay || 1000;
    this.respectRobots = options.respectRobots !== false;
    this.verbose = options.verbose || false;
    
    this.visitedUrls = new Set();
    this.queue = [];
    this.assetsDir = path.join(this.outputDir, 'assets');
  }

  /**
   * Main clone method
   */
  async clone(startUrl) {
    try {
      this.baseUrl = startUrl;
      this.log(`Starting clone of ${startUrl}`);
      
      // Create output directory
      await fs.ensureDir(this.outputDir);
      await fs.ensureDir(this.assetsDir);
      
      // Start crawling
      await this.crawl(startUrl, 0);
      
      this.log(`✅ Cloning completed! Output: ${this.outputDir}`);
      return { success: true, output: this.outputDir, pagesCloned: this.visitedUrls.size };
    } catch (error) {
      this.log(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recursive crawling function
   */
  async crawl(url, depth) {
    // Check limits
    if (depth > this.maxDepth || this.visitedUrls.size >= this.maxPages || this.visitedUrls.has(url)) {
      return;
    }

    this.visitedUrls.add(url);
    this.log(`Crawling [${depth}]: ${url}`);

    try {
      // Add delay between requests
      await utils.delay(this.requestDelay);

      // Fetch page
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: { 'User-Agent': this.userAgent }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Save page
      await this.savePage(url, html);

      // Download assets
      await this.downloadAssets(url, $);

      // Extract and queue links
      if (depth < this.maxDepth) {
        const links = $('a[href]')
          .map((_, el) => $(el).attr('href'))
          .get()
          .filter(link => this.isValidLink(link));

        for (const link of links) {
          const absoluteUrl = new URL(link, url).href;
          if (this.isInScope(absoluteUrl) && !this.visitedUrls.has(absoluteUrl)) {
            await this.crawl(absoluteUrl, depth + 1);
          }
        }
      }
    } catch (error) {
      this.log(`⚠️ Error crawling ${url}: ${error.message}`);
    }
  }

  /**
   * Save page to disk
   */
  async savePage(url, html) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname === '/' ? 'index.html' : urlObj.pathname;
    const filePath = path.join(this.outputDir, pathname);

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, html);
  }

  /**
   * Download all assets (images, styles, scripts)
   */
  async downloadAssets(pageUrl, $) {
    const assets = [];

    // Images
    $('img[src]').each((_, el) => {
      assets.push({ url: $(el).attr('src'), type: 'image' });
    });

    // Stylesheets
    $('link[rel="stylesheet"][href]').each((_, el) => {
      assets.push({ url: $(el).attr('href'), type: 'stylesheet' });
    });

    // Scripts
    $('script[src]').each((_, el) => {
      assets.push({ url: $(el).attr('src'), type: 'script' });
    });

    for (const asset of assets) {
      try {
        const assetUrl = new URL(asset.url, pageUrl).href;
        if (this.isInScope(assetUrl)) {
          await this.downloadAsset(assetUrl);
        }
      } catch (error) {
        this.log(`⚠️ Error downloading asset: ${error.message}`);
      }
    }
  }

  /**
   * Download individual asset
   */
  async downloadAsset(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        responseType: 'arraybuffer',
        headers: { 'User-Agent': this.userAgent }
      });

      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filePath = path.join(this.outputDir, pathname);

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, response.data);

      this.log(`Downloaded: ${pathname}`);
    } catch (error) {
      this.log(`⚠️ Failed to download asset: ${error.message}`);
    }
  }

  /**
   * Validate if a link should be followed
   */
  isValidLink(link) {
    if (!link) return false;
    if (link.startsWith('#') || link.startsWith('javascript:') || link.startsWith('mailto:')) return false;
    return true;
  }

  /**
   * Check if URL is in scope (same domain)
   */
  isInScope(url) {
    try {
      const baseHost = new URL(this.baseUrl).hostname;
      const urlHost = new URL(url).hostname;
      return baseHost === urlHost;
    } catch {
      return false;
    }
  }

  /**
   * Logging utility
   */
  log(message) {
    if (this.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }
}

export default WebCloner;
