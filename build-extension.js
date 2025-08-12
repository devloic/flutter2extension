#!/usr/bin/env node

/**
 * Flutter to Chrome Extension Builder (Node.js)
 * Converts a Flutter web app to a Chrome extension with WASM and JavaScript support
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Configuration defaults
const config = {
  flutterProjectDir: '.',
  buildDir: 'build/web',
  extensionDir: '',
  extensionName: 'Flutter App Extension',
  extensionVersion: '1.0.0',
  extensionDescription: '',
  buildType: 'wasm', // Default to WASM
  extensionMode: 'popup', // Default to popup
  debugMode: true, // Default to debug mode
  noBuild: false
};

// Helper functions for logging
function logInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// Helper function to check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Helper function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper function to remove directory recursively
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  let extensionDirSet = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
        config.extensionDir = args[++i];
        extensionDirSet = true;
        break;
      case '--name':
        config.extensionName = args[++i];
        break;
      case '--version':
        config.extensionVersion = args[++i];
        break;
      case '--description':
        config.extensionDescription = args[++i];
        break;
      case '--no-build':
        config.noBuild = true;
        break;
      case '--no-debug':
        config.debugMode = false;
        break;
      case '--web':
        config.buildType = 'web';
        break;
      case '--wasm':
        config.buildType = 'wasm';
        break;
      case '--popup':
        config.extensionMode = 'popup';
        break;
      case '--content_scripts':
        config.extensionMode = 'content_scripts';
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        logError(`Unknown option: ${arg}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }
  
  // Validate required parameters
  if (!extensionDirSet || !config.extensionDir) {
    logError('Output directory is required!');
    console.log('');
    console.log('Usage: node build-extension.js --output DIRECTORY [OPTIONS]');
    console.log('');
    console.log('Examples:');
    console.log('  node build-extension.js --output chrome-extension');
    console.log('  node build-extension.js --output my-extension --name "My Flutter Extension"');
    console.log('');
    console.log('Use --help for more information');
    process.exit(1);
  }
}

function showHelp() {
  console.log('Flutter to Chrome Extension Builder (Node.js)');
  console.log('');
  console.log('Usage: node build-extension.js --output DIRECTORY [OPTIONS]');
  console.log('');
  console.log('Required:');
  console.log('  --output DIR             Output directory for Chrome extension');
  console.log('');
  console.log('Optional:');
  console.log(`  --name NAME              Extension name (default: '${config.extensionName}')`);
  console.log(`  --version VERSION        Extension version (default: '${config.extensionVersion}')`);
  console.log('  --description DESC       Extension description');
  console.log('  --web                    Build JavaScript version (dart2js)');
  console.log('  --wasm                   Build WebAssembly version (dart2wasm) [default]');
  console.log('  --popup                  Generate popup mode extension [default]');
  console.log('  --content_scripts        Generate content scripts mode extension');
  console.log('  --no-build               Skip Flutter build step');
  console.log('  --no-debug               Remove console debug messages for production');
  console.log('  --help                   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node build-extension.js --output chrome-extension');
  console.log('  node build-extension.js --output my-extension --name "My Flutter Extension" --version "2.0.0"');
  console.log('  node build-extension.js --output web-extension --web        # JavaScript version');
  console.log('  node build-extension.js --output wasm-extension --wasm       # WebAssembly version');
  console.log('  node build-extension.js --output popup-ext --popup          # Popup mode');
  console.log('  node build-extension.js --output content-ext --content_scripts  # Content scripts mode');
}

// Validation functions
function validateEnvironment() {
  // Check if pubspec.yaml exists
  if (!fs.existsSync('pubspec.yaml')) {
    logError('No pubspec.yaml found. Please run this script from the Flutter project root directory.');
    process.exit(1);
  }
  
  // Check if Flutter is installed
  if (!commandExists('flutter')) {
    logError('Flutter is not installed or not in PATH');
    process.exit(1);
  }
}

// Set description based on build type and mode if not provided
function setDefaultDescription() {
  if (!config.extensionDescription) {
    if (config.extensionMode === 'content_scripts') {
      if (config.buildType === 'wasm') {
        config.extensionDescription = 'A Chrome content script running Flutter with WebAssembly';
      } else {
        config.extensionDescription = 'A Chrome content script running Flutter with JavaScript';
      }
    } else {
      if (config.buildType === 'wasm') {
        config.extensionDescription = 'A Chrome extension popup running Flutter with WebAssembly';
      } else {
        config.extensionDescription = 'A Chrome extension popup running Flutter with JavaScript';
      }
    }
  }
}

// Build Flutter web
function buildFlutterWeb() {
  if (config.noBuild) {
    logInfo('Step 1/7: Skipping Flutter build (--no-build flag)');
    return;
  }
  
  if (config.buildType === 'wasm') {
    logInfo('Step 1/7: Building Flutter web with WASM support...');
    execSync('flutter build web --wasm --debug', { stdio: 'inherit' });
  } else {
    logInfo('Step 1/7: Building Flutter web with JavaScript (dart2js)...');
    execSync('flutter build web --debug', { stdio: 'inherit' });
  }
  logSuccess('Flutter web build completed');
}

// Create extension directory
function setupExtensionDirectory() {
  logInfo('Step 2/7: Setting up Chrome extension directory...');
  
  if (fs.existsSync(config.extensionDir)) {
    logWarning('Extension directory exists, cleaning up...');
    removeDir(config.extensionDir);
  }
  
  fs.mkdirSync(config.extensionDir, { recursive: true });
  logSuccess('Extension directory created');
}

// Copy Flutter build files
function copyFlutterFiles() {
  logInfo('Step 3/7: Copying Flutter build files...');
  copyDir(config.buildDir, config.extensionDir);
  logSuccess('Flutter files copied');
}

// Create Chrome extension manifest
function createManifest() {
  logInfo('Step 4/7: Creating Chrome extension manifest...');
  
  const baseManifest = {
    manifest_version: 3,
    name: config.extensionName,
    version: config.extensionVersion,
    description: config.extensionDescription,
    permissions: ['activeTab'],
    icons: {
      '16': 'icons/Icon-192.png',
      '48': 'icons/Icon-192.png',
      '128': 'icons/Icon-512.png'
    },
    web_accessible_resources: [{
      resources: [
        'assets/*',
        'canvaskit/*',
        'canvaskit/skwasm.js',
        'canvaskit/skwasm.wasm',
        'canvaskit/skwasm_heavy.js',
        'canvaskit/skwasm_heavy.wasm',
        'canvaskit/canvaskit.js',
        'canvaskit/canvaskit.wasm',
        '*.js',
        '*.mjs',
        '*.wasm',
        'flutter.js',
        'flutter_bootstrap.js',
        'flutter_init.js',
        'flutter_service_worker.js',
        'main.dart.js',
        'main.dart.mjs',
        'main.dart.wasm'
      ],
      matches: ['<all_urls>']
    }]
  };
  
  if (config.extensionMode === 'popup') {
    baseManifest.action = {
      default_popup: 'popup.html',
      default_title: config.extensionName
    };
    baseManifest.content_security_policy = {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' data: blob: https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com;"
    };
  } else if (config.extensionMode === 'content_scripts') {
    baseManifest.content_scripts = [{
      matches: ['<all_urls>'],
      js: ['content_script.js'],
      css: ['content_script.css'],
      run_at: 'document_end'
    }];
    baseManifest.permissions.push('scripting', 'storage');
    baseManifest.content_security_policy = {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' data: blob: https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com;"
    };
  }
  
  const manifestPath = path.join(config.extensionDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(baseManifest, null, 2));
  logSuccess('Manifest created');
}

// Get conditional debug message variables
function getDebugVariables() {
  if (config.debugMode) {
    return {
      LOG_PATCH_START: "console.log('Applying Chrome extension Flutter patch...');",
      LOG_EXT_ID: "console.log('Extension ID detected:', extensionId);",
      LOG_BUILD_CONFIG_WASM: "console.log('Setting buildConfig for WASM build');",
      LOG_BUILD_CONFIG_JS: "console.log('Setting buildConfig for JavaScript build');",
      LOG_INIT_START: "console.log('Starting Flutter initialization with Chrome extension configuration...');",
      LOG_WASM_LOAD: "console.log('Loading WASM build with Skwasm renderer...');",
      LOG_WASM_ENTRYPOINT: "console.log('Flutter WASM entrypoint loaded via loader.load...');",
      LOG_WASM_HOST: "console.log('Using Chrome extension container as Flutter host:', container);",
      LOG_WASM_HOST_ERR: "console.error('Flutter container not found! Falling back to body');",
      LOG_WASM_ENGINE: "console.log('Flutter WASM engine initialized, running app...');",
      LOG_WASM_SUCCESS: "console.log('Flutter WASM app started successfully in Chrome extension container');",
      LOG_WASM_ERROR: "console.error('Error initializing Flutter WASM engine in Chrome extension:', error);",
      LOG_JS_LOAD: "console.log('Loading JavaScript build with CanvasKit renderer...');",
      LOG_JS_URL: "console.log('Using Chrome extension URL for entrypoint:', url);",
      LOG_JS_URL_WARN: "console.warn('Extension ID not available, using relative URL');",
      LOG_JS_ENTRYPOINT: "console.log('Flutter JS entrypoint loaded, initializing with Chrome extension container...');",
      LOG_JS_HOST: "console.log('Using Chrome extension container as Flutter host:', container);",
      LOG_JS_HOST_ERR: "console.error('Flutter container not found! Falling back to body');",
      LOG_JS_ENGINE: "console.log('Flutter JS engine initialized, running app...');",
      LOG_JS_SUCCESS: "console.log('Flutter JS app started successfully in Chrome extension container');",
      LOG_JS_ERROR: "console.error('Error initializing Flutter JS engine in Chrome extension:', error);",
      LOG_PATCH_END: "console.log('Chrome extension Flutter patch applied');",
      LOG_FETCH_INT: "console.log('Flutter fetch intercepted:', url);",
      LOG_FETCH_RED: "console.log('Flutter fetch redirected:', url, '->', newUrl);",
      LOG_IMPORT_INT: "console.log('Dynamic import intercepted:', url);",
      LOG_IMPORT_RED: "console.log('Dynamic import redirected:', url, '->', newUrl);",
      LOG_C_FUNC: "console.log('Flutter c() function redirected:', parts, '->', fullUrl);",
      LOG_EXT_ID_ERR: "console.error('Extension ID not detected - Flutter URLs will not work properly');",
      // Content script debug messages
      LOG_INIT_CONFIG: "console.log('Configuring Flutter for Chrome extension environment...');",
      LOG_CONTENT_CONFIG: "console.log('Configuring Flutter for Chrome content script environment...');",
      LOG_CONTENT_FETCH_INT: "console.log('Flutter fetch intercepted:', url);",
      LOG_CONTENT_FETCH_RED: "console.log('Flutter fetch redirected:', url, '->', newUrl);",
      LOG_CONTENT_IMPORT_INT: "console.log('Dynamic import intercepted:', url);",
      LOG_CONTENT_IMPORT_RED: "console.log('Dynamic import redirected:', url, '->', newUrl);",
      LOG_CONTENT_READY: "console.log('Flutter loader ready, starting Chrome content script initialization...');",
      LOG_CONTENT_DELEGATED: "console.log('Flutter initialization delegated to patched bootstrap - no additional setup needed');",
      LOG_CONTENT_LOADED: "console.log('Flutter Extension Content Script loaded');",
      LOG_OVERLAY_CREATE: "console.log('Creating Flutter overlay window...');",
      LOG_OVERLAY_CREATED: "console.log('Flutter overlay window created');",
      LOG_OVERLAY_SHOWN: "console.log('Flutter overlay shown');",
      LOG_OVERLAY_INIT: "console.log('Starting Flutter initialization after overlay is ready...');",
      LOG_OVERLAY_HIDDEN: "console.log('Flutter overlay hidden');",
      LOG_CONTENT_INIT: "console.log('Initializing Flutter in content script...');",
      LOG_CONTENT_SKIP: "console.log('Flutter already initialized, skipping...');",
      LOG_CONTENT_EXT_ID: "console.log('Setting global extension ID for Flutter:', extensionId);",
      LOG_CONTENT_INIT_SUCCESS: "console.log('Flutter init script loaded successfully in content script');",
      LOG_CONTENT_BOOTSTRAP_SUCCESS: "console.log('Flutter bootstrap loaded successfully in content script');",
      LOG_CONTENT_BOOTSTRAP_ERROR: "console.error('Failed to load Flutter bootstrap script in content script');",
      LOG_CONTENT_INIT_ERROR: "console.error('Failed to load Flutter initialization script in content script');",
      LOG_CONTENT_INITIALIZED: "console.log('Flutter Extension Content Script initialized. Press Ctrl+Shift+F to toggle.');"
    };
  } else {
    // Return commented-out versions for all debug variables
    return Object.fromEntries(
      Object.keys({
        LOG_PATCH_START: '', LOG_EXT_ID: '', LOG_BUILD_CONFIG_WASM: '', LOG_BUILD_CONFIG_JS: '',
        LOG_INIT_START: '', LOG_WASM_LOAD: '', LOG_WASM_ENTRYPOINT: '', LOG_WASM_HOST: '',
        LOG_WASM_HOST_ERR: '', LOG_WASM_ENGINE: '', LOG_WASM_SUCCESS: '', LOG_WASM_ERROR: '',
        LOG_JS_LOAD: '', LOG_JS_URL: '', LOG_JS_URL_WARN: '', LOG_JS_ENTRYPOINT: '',
        LOG_JS_HOST: '', LOG_JS_HOST_ERR: '', LOG_JS_ENGINE: '', LOG_JS_SUCCESS: '',
        LOG_JS_ERROR: '', LOG_PATCH_END: '', LOG_FETCH_INT: '', LOG_FETCH_RED: '',
        LOG_IMPORT_INT: '', LOG_IMPORT_RED: '', LOG_C_FUNC: '', LOG_EXT_ID_ERR: '',
        LOG_INIT_CONFIG: '', LOG_CONTENT_CONFIG: '', LOG_CONTENT_FETCH_INT: '', LOG_CONTENT_FETCH_RED: '',
        LOG_CONTENT_IMPORT_INT: '', LOG_CONTENT_IMPORT_RED: '', LOG_CONTENT_READY: '', LOG_CONTENT_DELEGATED: '',
        LOG_CONTENT_LOADED: '', LOG_OVERLAY_CREATE: '', LOG_OVERLAY_CREATED: '', LOG_OVERLAY_SHOWN: '',
        LOG_OVERLAY_INIT: '', LOG_OVERLAY_HIDDEN: '', LOG_CONTENT_INIT: '', LOG_CONTENT_SKIP: '',
        LOG_CONTENT_EXT_ID: '', LOG_CONTENT_INIT_SUCCESS: '', LOG_CONTENT_BOOTSTRAP_SUCCESS: '',
        LOG_CONTENT_BOOTSTRAP_ERROR: '', LOG_CONTENT_INIT_ERROR: '', LOG_CONTENT_INITIALIZED: ''
      }).map(([key]) => [key, '//'])
    );
  }
}

// Patch Flutter files for Chrome extension compatibility
function patchFlutterFiles() {
  logInfo('Step 5/7: Patching Flutter files for Chrome extension compatibility...');
  logInfo('Patching Flutter bootstrap file...');
  
  const bootstrapPath = path.join(config.extensionDir, 'flutter_bootstrap.js');
  
  if (!fs.existsSync(bootstrapPath)) {
    logError('flutter_bootstrap.js not found in Flutter build output');
    process.exit(1);
  }
  
  // Create backup
  const backupPath = bootstrapPath + '.backup';
  fs.copyFileSync(bootstrapPath, backupPath);
  
  // Read the current bootstrap content
  let bootstrapContent = fs.readFileSync(bootstrapPath, 'utf8');
  
  // Remove existing auto-initialization to prevent conflicts
  bootstrapContent = bootstrapContent.replace(/_flutter\.loader\.load\({[\s\S]*?}\);/g, '');
  
  // Also remove any buildConfig that conflicts
  bootstrapContent = bootstrapContent.replace(/_flutter\.buildConfig = [^;]*;/g, '');
  
  // Get debug variables
  const debugVars = getDebugVariables();
  
  // Create the Chrome extension patch
  const isWasmBuild = config.buildType === 'wasm';
  const chromeExtensionPatch = `

// CHROME EXTENSION PATCH: Complete Flutter initialization override
${debugVars.LOG_PATCH_START}

// Apply URL resolution fixes BEFORE Flutter initialization
// Get extension ID for resource URLs - make it global for use in initialization
(function() {
  // Safely declare or reuse existing extensionId variable
  if (typeof window.extensionId === 'undefined') {
    window.extensionId = '';
  }
  var extensionId = window.extensionId;
  
  // Try multiple methods to get the extension ID
  try {
    // Method 1: From chrome.runtime (may not work in content script context)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      extensionId = chrome.runtime.id;
    }
  } catch (e) {}
  
  // Method 2: From global variable set by content script
  if (!extensionId && window.FLUTTER_EXTENSION_ID) {
    extensionId = window.FLUTTER_EXTENSION_ID;
  }
  
  // Method 3: From script src tags (existing approach)
  if (!extensionId) {
    const scripts = document.querySelectorAll('script[src*="chrome-extension://"]');
    if (scripts.length > 0) {
      const match = scripts[0].src.match(/chrome-extension:\\/\\/([^/]+)/);
      if (match) extensionId = match[1];
    }
  }
  
  // Method 4: Extract from current script URL if possible
  if (!extensionId) {
    try {
      const currentScript = document.currentScript;
      if (currentScript && currentScript.src && currentScript.src.includes('chrome-extension://')) {
        const match = currentScript.src.match(/chrome-extension:\\/\\/([^/]+)/);
        if (match) extensionId = match[1];
      }
    } catch (e) {}
  }
  
  ${debugVars.LOG_EXT_ID}

  if (extensionId) {
    // Override document.baseURI to help Flutter resolve relative URLs correctly
    const originalBaseURI = document.baseURI;
    Object.defineProperty(document, 'baseURI', {
      get: function() {
        return 'chrome-extension://' + extensionId + '/';
      },
      configurable: true
    });

    // Override fetch to handle Chrome extension URLs
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      ${debugVars.LOG_FETCH_INT}
      if (typeof url === 'string') {
        // If it's a relative URL or doesn't start with chrome-extension://, convert it
        if (!url.startsWith('http') && !url.startsWith('chrome-extension://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\\/+/, '');
          ${debugVars.LOG_FETCH_RED}
          url = newUrl;
        }
      }
      return originalFetch.call(this, url, options);
    };

    // Override dynamic imports for .mjs files
    const originalImport = window.import;
    if (originalImport) {
      window.import = function(url) {
        ${debugVars.LOG_IMPORT_INT}
        if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('chrome-extension://')) {
          const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\\/+/, '');
          ${debugVars.LOG_IMPORT_RED}
          url = newUrl;
        }
        return originalImport.call(this, url);
      };
    }
    
    // CRITICAL: Override Flutter's internal URL resolution function 'c'
    // This is defined at the very beginning of flutter_bootstrap.js
    // We need to patch it to use Chrome extension URLs
    if (typeof window.c === 'undefined') {
      // Define our own version of the 'c' function that resolves to Chrome extension URLs
      window.c = function(...parts) {
        const path = parts.filter(p => !!p).map((p, i) => {
          if (i === 0) return p.replace(/^\\/+|\\/+$/g, '');
          return p.replace(/^\\/+|\\/+$/g, '');
        }).filter(p => p.length).join('/');
        
        const fullUrl = 'chrome-extension://' + extensionId + '/' + path;
        ${debugVars.LOG_C_FUNC}
        return fullUrl;
      };
    }
  } else {
    ${debugVars.LOG_EXT_ID_ERR}
  }
  
  // Save extensionId to window for global access
  window.extensionId = extensionId;
})();

// Ensure Flutter objects exist
if (!window._flutter) {
  window._flutter = {};
}

// Force Flutter to use local CanvasKit files instead of CDN
window._flutter_web_locale_use_local_canvaskit = true;
if (!window._flutter.engineInitializer) {
  window._flutter.engineInitializer = {};
}
window._flutter.engineInitializer.useLocalCanvasKit = true;
window._flutter.engineInitializer.canvasKitBaseUrl = "canvaskit/";

// Comprehensive override for CanvasKit CDN loading
(function() {
  // Override document.createElement to intercept script tag creation
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && typeof value === 'string' && value.includes('gstatic.com/flutter-canvaskit')) {
          // Extract filename and map to local path
          const urlParts = value.split('/');
          const filename = urlParts[urlParts.length - 1];
          let localPath = 'canvaskit/' + filename;
          
          // Handle chromium variant
          if (value.includes('/chromium/')) {
            localPath = 'canvaskit/chromium/' + filename;
          }
          
          console.log('🚫 Blocking CDN CanvasKit load:', value);
          console.log('✅ Redirecting to local:', localPath);
          originalSetAttribute.call(this, name, localPath);
        } else {
          originalSetAttribute.call(this, name, value);
        }
      };
      
      // Also override the src property directly
      const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src') || 
                                    Object.getOwnPropertyDescriptor(Element.prototype, 'src') ||
                                    { set: function(value) { this.setAttribute('src', value); }, get: function() { return this.getAttribute('src'); } };
      
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (typeof value === 'string' && value.includes('gstatic.com/flutter-canvaskit')) {
            const urlParts = value.split('/');
            const filename = urlParts[urlParts.length - 1];
            let localPath = 'canvaskit/' + filename;
            
            if (value.includes('/chromium/')) {
              localPath = 'canvaskit/chromium/' + filename;
            }
            
            console.log('🚫 Blocking CDN CanvasKit load via src property:', value);
            console.log('✅ Redirecting to local:', localPath);
            originalSrcDescriptor.set.call(this, localPath);
          } else {
            originalSrcDescriptor.set.call(this, value);
          }
        },
        get: originalSrcDescriptor.get,
        configurable: true
      });
    }
    return element;
  };
})();

// Set buildConfig for the correct build type
const IS_WASM_BUILD = ${isWasmBuild};

if (IS_WASM_BUILD) {
  ${debugVars.LOG_BUILD_CONFIG_WASM}
  window._flutter.buildConfig = {
    "engineRevision": "1c9c20e7c3dd48c66f400a24d48ea806b4ab312a",
    "builds": [{
      "compileTarget": "dart2wasm",
      "renderer": "skwasm",
      "mainWasmPath": "main.dart.wasm",
      "jsSupportRuntimePath": "main.dart.mjs"
    }]
  };
} else {
  ${debugVars.LOG_BUILD_CONFIG_JS}
  window._flutter.buildConfig = {
    "engineRevision": "1c9c20e7c3dd48c66f400a24d48ea806b4ab312a",
    "builds": [{
      "compileTarget": "dart2js",
      "renderer": "canvaskit",
      "mainJsPath": "main.dart.js"
    }]
  };
}

// Initialize Flutter directly with our configuration
${debugVars.LOG_INIT_START}

// Load Flutter with proper container targeting
if (IS_WASM_BUILD) {
  ${debugVars.LOG_WASM_LOAD}
  
  window._flutter.loader.load({
    serviceWorkerSettings: null,
    config: {
      hostElement: (function() {
        const container = document.getElementById('flutter-extension-container');
        if (container) {
          ${debugVars.LOG_WASM_HOST}
          return container;
        } else {
          ${debugVars.LOG_WASM_HOST_ERR}
          return document.body;
        }
      })(),
      renderer: "skwasm",
      canvasKitVariant: "auto",
      useLocalCanvasKit: true,
      canvasKitBaseUrl: "canvaskit/"
    },
    onEntrypointLoaded: async function(engineInitializer) {
      ${debugVars.LOG_WASM_ENTRYPOINT}
      
      try {
        const appRunner = await engineInitializer.initializeEngine({
          hostElement: (function() {
            const container = document.getElementById('flutter-extension-container');
            if (container) {
              ${debugVars.LOG_WASM_HOST}
              return container;
            } else {
              ${debugVars.LOG_WASM_HOST_ERR}
              return document.body;
            }
          })(),
          renderer: "skwasm",
          canvasKitVariant: "auto",
          useLocalCanvasKit: true,
          canvasKitBaseUrl: "canvaskit/"
        });
        
        ${debugVars.LOG_WASM_ENGINE}
        await appRunner.runApp();
        ${debugVars.LOG_WASM_SUCCESS}
        
      } catch (error) {
        ${debugVars.LOG_WASM_ERROR}
      }
    }
  });
} else {
  ${debugVars.LOG_JS_LOAD}
  
  window._flutter.loader.loadEntrypoint({
    entrypointUrl: (function() {
      // Use the detected extension ID to build the URL
      if (window.extensionId) {
        const url = 'chrome-extension://' + window.extensionId + '/main.dart.js';
        ${debugVars.LOG_JS_URL}
        return url;
      } else {
        ${debugVars.LOG_JS_URL_WARN}
        return 'main.dart.js';
      }
    })(),
    onEntrypointLoaded: async function(engineInitializer) {
      ${debugVars.LOG_JS_ENTRYPOINT}
      
      try {
        const appRunner = await engineInitializer.initializeEngine({
          hostElement: (function() {
            const container = document.getElementById('flutter-extension-container');
            if (container) {
              ${debugVars.LOG_JS_HOST}
              return container;
            } else {
              ${debugVars.LOG_JS_HOST_ERR}
              return document.body;
            }
          })(),
          renderer: "canvaskit",
          canvasKitVariant: "auto",
          useLocalCanvasKit: true,
          canvasKitBaseUrl: "canvaskit/"
        });
        
        ${debugVars.LOG_JS_ENGINE}
        await appRunner.runApp();
        ${debugVars.LOG_JS_SUCCESS}
        
      } catch (error) {
        ${debugVars.LOG_JS_ERROR}
      }
    }
  });
}

${debugVars.LOG_PATCH_END}`;

  // Append the Chrome extension patch to the bootstrap file
  bootstrapContent += chromeExtensionPatch;
  
  // Write the patched content back
  fs.writeFileSync(bootstrapPath, bootstrapContent);
  
  logSuccess('Flutter bootstrap patched with container targeting and build type selection');
}

// Create Flutter initialization files
function createFlutterInitFiles() {
  logInfo('Step 6/7: Creating Flutter initialization files...');
  
  const debugVars = getDebugVariables();
  
  if (config.extensionMode === 'popup') {
    createPopupFiles(debugVars);
  } else if (config.extensionMode === 'content_scripts') {
    createContentScriptFiles(debugVars);
  }
}

function createPopupFiles(debugVars) {
  // Create flutter_init.js for popup mode
  const flutterInitPath = path.join(config.extensionDir, 'flutter_init.js');
  const flutterInitContent = `// Chrome extension configuration for Flutter
${debugVars.LOG_INIT_CONFIG}

// Override fetch to handle Chrome extension URLs
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('chrome-extension://')) {
    if (url.includes('main.dart.') || url.includes('canvaskit/') || url.includes('skwasm') || url.includes('.wasm') || url.includes('.mjs')) {
      url = chrome.runtime.getURL(url);
    }
  }
  return originalFetch.call(this, url, options);
};

// Load the patched Flutter bootstrap
const script = document.createElement('script');
script.src = 'flutter_bootstrap.js';
script.async = true;
document.head.appendChild(script);`;

  fs.writeFileSync(flutterInitPath, flutterInitContent);
  
  // Create popup.html
  const popupHtmlPath = path.join(config.extensionDir, 'popup.html');
  const popupHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="description" content="${config.extensionDescription}">
  <title>${config.extensionName}</title>
  
  <style>
    body {
      width: 500px;
      height: 600px;
      min-width: 500px;
      min-height: 600px;
      max-width: 500px;
      max-height: 600px;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      box-sizing: border-box;
    }
    
    #loading {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 500px;
      height: 600px;
      color: #666;
      font-size: 14px;
      position: absolute;
      top: 0;
      left: 0;
    }
    
    #flutter-extension-container {
      width: 500px;
      height: 600px;
      min-width: 500px;
      min-height: 600px;
      max-width: 500px;
      max-height: 600px;
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: border-box;
    }
    
    /* Flutter app container - force specific dimensions */
    flt-glass-pane {
      width: 500px !important;
      height: 600px !important;
      min-width: 500px !important;
      min-height: 600px !important;
      max-width: 500px !important;
      max-height: 600px !important;
    }
    
    /* Flutter view and renderer containers */
    flt-scene-host {
      width: 500px !important;
      height: 600px !important;
    }
    
    /* Canvas element */
    canvas {
      width: 500px !important;
      height: 500px !important;
    }
  </style>
</head>
<body>
  <div id="loading">Loading Flutter app...</div>
  <div id="flutter-extension-container"></div>
  
  <script src="flutter_bootstrap.js"></script>
</body>
</html>`;

  fs.writeFileSync(popupHtmlPath, popupHtmlContent);
  
  logSuccess('Flutter initialization configured for Chrome extension');
  logSuccess('Popup Flutter initialization files created');
}

function createContentScriptFiles(debugVars) {
  // Create flutter_init.js for content scripts
  const flutterInitPath = path.join(config.extensionDir, 'flutter_init.js');
  const flutterInitContent = `// Chrome content script configuration for Flutter
${debugVars.LOG_CONTENT_CONFIG}

// Get extension ID for resource URLs
let extensionId = '';
try {
  extensionId = chrome.runtime.id || '';
} catch (e) {
  // Fallback: get extension ID from script src
  const scripts = document.querySelectorAll('script[src*="chrome-extension://"]');
  if (scripts.length > 0) {
    const match = scripts[0].src.match(/chrome-extension:\\/\\/([^/]+)/);
    if (match) extensionId = match[1];
  }
}

// Override document.baseURI to help Flutter resolve relative URLs correctly
const originalBaseURI = document.baseURI;
Object.defineProperty(document, 'baseURI', {
  get: function() {
    return extensionId ? 'chrome-extension://' + extensionId + '/' : originalBaseURI;
  },
  configurable: true
});

// Override fetch to handle Chrome extension URLs
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  ${debugVars.LOG_CONTENT_FETCH_INT}
  if (typeof url === 'string') {
    // If it's a relative URL or doesn't start with chrome-extension://, convert it
    if (!url.startsWith('http') && !url.startsWith('chrome-extension://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      if (extensionId) {
        const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\\/+/, '');
        ${debugVars.LOG_CONTENT_FETCH_RED}
        url = newUrl;
      }
    }
  }
  return originalFetch.call(this, url, options);
};

// Override dynamic imports for .mjs files
const originalImport = window.import;
if (originalImport) {
  window.import = function(url) {
    ${debugVars.LOG_CONTENT_IMPORT_INT}
    if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('chrome-extension://')) {
      if (extensionId) {
        const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\\/+/, '');
        ${debugVars.LOG_CONTENT_IMPORT_RED}
        url = newUrl;
      }
    }
    return originalImport.call(this, url);
  };
}

// Chrome content script Flutter initialization - simplified
${debugVars.LOG_CONTENT_READY}

// The patched Flutter bootstrap will handle all initialization automatically
${debugVars.LOG_CONTENT_DELEGATED}`;

  fs.writeFileSync(flutterInitPath, flutterInitContent);
  
  // Create content_script.css
  const contentCssPath = path.join(config.extensionDir, 'content_script.css');
  const contentCssContent = `/* Flutter Extension Content Script Styles */
#flutter-extension-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  height: 500px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  resize: both;
  min-width: 300px;
  min-height: 200px;
}

#flutter-extension-header {
  background: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 8px 12px;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

#flutter-extension-close {
  background: #ff5f56;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  cursor: pointer;
  font-size: 10px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

#flutter-extension-close:hover {
  background: #ff3b30;
}

#flutter-extension-container {
  width: 100%;
  height: calc(100% - 40px);
  position: relative;
}

#flutter-extension-overlay.hidden {
  display: none;
}

#flutter-extension-overlay * {
  box-sizing: border-box;
}

#flutter-extension-container flt-glass-pane {
  width: 100% !important;
  height: 100% !important;
}

#flutter-extension-container canvas {
  width: 100% !important;
  height: 100% !important;
}`;

  fs.writeFileSync(contentCssPath, contentCssContent);
  
  // Create content_script.js
  const contentScriptPath = path.join(config.extensionDir, 'content_script.js');
  const contentScriptContent = `// Flutter Extension Content Script
${debugVars.LOG_CONTENT_LOADED}

let flutterOverlay = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createFlutterOverlay() {
  if (flutterOverlay) return;
  ${debugVars.LOG_OVERLAY_CREATE}
  
  flutterOverlay = document.createElement('div');
  flutterOverlay.id = 'flutter-extension-overlay';
  flutterOverlay.className = 'hidden';
  
  const header = document.createElement('div');
  header.id = 'flutter-extension-header';
  header.innerHTML = \`<span>${config.extensionName}</span><button id="flutter-extension-close" title="Close">×</button>\`;
  
  const container = document.createElement('div');
  container.id = 'flutter-extension-container';
  
  flutterOverlay.appendChild(header);
  flutterOverlay.appendChild(container);
  document.body.appendChild(flutterOverlay);
  
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  document.getElementById('flutter-extension-close').addEventListener('click', hideFlutterOverlay);
  
  ${debugVars.LOG_OVERLAY_CREATED}
}

function showFlutterOverlay() {
  if (!flutterOverlay) createFlutterOverlay();
  flutterOverlay.classList.remove('hidden');
  ${debugVars.LOG_OVERLAY_SHOWN}
  
  // Wait a bit for the overlay to be rendered before initializing Flutter
  setTimeout(function() {
    ${debugVars.LOG_OVERLAY_INIT}
    initializeFlutter();
  }, 100);
}

function hideFlutterOverlay() {
  if (flutterOverlay) {
    flutterOverlay.classList.add('hidden');
    ${debugVars.LOG_OVERLAY_HIDDEN}
  }
}

function toggleFlutterOverlay() {
  if (!flutterOverlay || flutterOverlay.classList.contains('hidden')) {
    showFlutterOverlay();
  } else {
    hideFlutterOverlay();
  }
}

function startDrag(e) {
  isDragging = true;
  const rect = flutterOverlay.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  e.preventDefault();
}

function drag(e) {
  if (!isDragging) return;
  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;
  flutterOverlay.style.left = Math.max(0, Math.min(x, window.innerWidth - flutterOverlay.offsetWidth)) + 'px';
  flutterOverlay.style.top = Math.max(0, Math.min(y, window.innerHeight - flutterOverlay.offsetHeight)) + 'px';
  flutterOverlay.style.right = 'auto';
}

function endDrag() {
  isDragging = false;
}

function initializeFlutter() {
  ${debugVars.LOG_CONTENT_INIT}
  
  // Check if Flutter is already initialized to prevent duplicate loading
  if (window.flutterInitialized) {
    ${debugVars.LOG_CONTENT_SKIP}
    return;
  }
  
  window.flutterInitialized = true;
  
  // Get extension ID for script loading
  let extensionId = '';
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      extensionId = chrome.runtime.id;
    }
  } catch (e) {
    // Fallback: try to get extension ID from document context
    const scripts = document.querySelectorAll('script[src*="chrome-extension://"]');
    if (scripts.length > 0) {
      const match = scripts[0].src.match(/chrome-extension:\\/\\/([^/]+)/);
      if (match) extensionId = match[1];
    }
  }
  
  // Pass extension ID to Flutter bootstrap via global variable
  if (extensionId) {
    window.FLUTTER_EXTENSION_ID = extensionId;
    ${debugVars.LOG_CONTENT_EXT_ID}
  }
  
  // Load flutter_init.js first to set up the environment
  const initScript = document.createElement('script');
  if (extensionId) {
    initScript.src = 'chrome-extension://' + extensionId + '/flutter_init.js';
  } else {
    initScript.src = 'flutter_init.js'; // Fallback
  }
  initScript.async = false; // Load synchronously to ensure proper order
  
  initScript.onload = function() {
    ${debugVars.LOG_CONTENT_INIT_SUCCESS}
    
    // Now load the bootstrap which will initialize Flutter
    const bootstrapScript = document.createElement('script');
    if (extensionId) {
      bootstrapScript.src = 'chrome-extension://' + extensionId + '/flutter_bootstrap.js';
    } else {
      bootstrapScript.src = 'flutter_bootstrap.js'; // Fallback
    }
    bootstrapScript.async = false;
    
    bootstrapScript.onload = function() {
      ${debugVars.LOG_CONTENT_BOOTSTRAP_SUCCESS}
    };
    
    bootstrapScript.onerror = function() {
      ${debugVars.LOG_CONTENT_BOOTSTRAP_ERROR}
    };
    
    document.head.appendChild(bootstrapScript);
  };
  
  initScript.onerror = function() {
    ${debugVars.LOG_CONTENT_INIT_ERROR}
    window.flutterInitialized = false; // Reset flag on error
  };
  
  document.head.appendChild(initScript);
}

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'F') {
    e.preventDefault();
    toggleFlutterOverlay();
  }
});

setTimeout(showFlutterOverlay, 1000);
${debugVars.LOG_CONTENT_INITIALIZED}`;

  fs.writeFileSync(contentScriptPath, contentScriptContent);
  
  logSuccess('Content script Flutter initialization files created');
}

// Create build information
function createBuildInfo() {
  logInfo('Step 7/7: Creating build information...');
  
  const buildDate = new Date().toISOString();
  let flutterVersion = '';
  
  try {
    flutterVersion = execSync('flutter --version', { encoding: 'utf8' }).split('\n')[0];
  } catch {
    flutterVersion = 'Unknown';
  }
  
  const buildTypeDescription = config.buildType === 'wasm' 
    ? 'WebAssembly with Skwasm renderer' 
    : 'JavaScript with CanvasKit renderer';
  
  const buildInfoContent = `# Chrome Extension Build Information

**Generated:** ${buildDate}
**Flutter Version:** ${flutterVersion}
**Extension Name:** ${config.extensionName}
**Extension Version:** ${config.extensionVersion}
**Extension Mode:** ${config.extensionMode}
**Build Type:** ${config.buildType}

## Installation Instructions

1. Open Chrome and navigate to \`chrome://extensions/\`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select this \`${config.extensionDir}\` directory
5. The extension should now appear in your extensions list

## Usage

### Popup Mode
1. Click on the extension icon in the Chrome toolbar
2. The Flutter app will load in the popup
3. Enjoy your Flutter app as a Chrome extension!

### Content Scripts Mode
1. The extension will automatically inject into web pages
2. Look for the floating overlay window in the top-right corner
3. Use Ctrl+Shift+F to toggle the overlay on/off
4. Drag the overlay window to move it around
5. Click the × button to close the overlay

## Technical Details

- **Flutter Version**: ${flutterVersion}
- **Extension Mode**: ${config.extensionMode}
- **Build Type**: ${config.buildType} (${buildTypeDescription})
- **Manifest Version**: 3 (Chrome Extensions Manifest V3)
- **Content Security Policy**: Configured for WASM support

## Files Structure

- \`manifest.json\`: Chrome extension configuration
- \`popup.html\`: Extension popup interface (popup mode only)  
- \`content_script.js\`: Content script injection (content scripts mode only)
- \`content_script.css\`: Overlay styling (content scripts mode only)
- \`flutter_init.js\`: Custom Flutter loader
- \`main.dart.js/wasm\`: Compiled Flutter app
- \`canvaskit/\`: Rendering engine files
- \`assets/\`: Flutter app assets

## Development

To rebuild this extension, run:
\`\`\`bash
node build-extension.js --output "${config.extensionDir}" --name "${config.extensionName}" --version "${config.extensionVersion}" --${config.extensionMode} --${config.buildType}
\`\`\``;

  const buildInfoPath = path.join(config.extensionDir, 'BUILD_INFO.md');
  fs.writeFileSync(buildInfoPath, buildInfoContent);
  
  logSuccess('Build information created');
}

// Main execution function
function main() {
  try {
    // Parse command line arguments
    parseArguments();
    
    // Validate environment
    validateEnvironment();
    
    // Set default description
    setDefaultDescription();
    
    // Log configuration
    logInfo('Starting Flutter to Chrome Extension build process...');
    logInfo(`Extension Name: ${config.extensionName}`);
    logInfo(`Extension Version: ${config.extensionVersion}`);
    logInfo(`Output Directory: ${config.extensionDir}`);
    logInfo(`Build Type: ${config.buildType}`);
    logInfo(`Extension Mode: ${config.extensionMode}`);
    
    // Execute build steps
    buildFlutterWeb();
    setupExtensionDirectory();
    copyFlutterFiles();
    createManifest();
    patchFlutterFiles();
    createFlutterInitFiles();
    createBuildInfo();
    
    // Final summary
    console.log('');
    logSuccess('✅ Chrome extension build completed successfully!');
    console.log('');
    logInfo(`📁 Extension files are in: ${config.extensionDir}`);
    logInfo(`📦 Extension name: ${config.extensionName}`);
    logInfo(`🔢 Extension version: ${config.extensionVersion}`);
    logInfo(`🎯 Extension mode: ${config.extensionMode}`);
    logInfo(`⚡ Build type: ${config.buildType}`);
    console.log('');
    
    if (config.extensionMode === 'content_scripts') {
      logInfo('🚀 Content Scripts Mode Instructions:');
      console.log('   1. Open Chrome and go to chrome://extensions/');
      console.log('   2. Enable "Developer mode"');
      console.log(`   3. Click "Load unpacked" and select the "${config.extensionDir}" directory`);
      console.log('   4. Visit any website to see the floating Flutter overlay');
      console.log('   5. Use Ctrl+Shift+F to toggle the overlay');
    } else {
      logInfo('🚀 Popup Mode Instructions:');
      console.log('   1. Open Chrome and go to chrome://extensions/');
      console.log('   2. Enable "Developer mode"');
      console.log(`   3. Click "Load unpacked" and select the "${config.extensionDir}" directory`);
      console.log('   4. Click the extension icon to test your Flutter app!');
    }
    
    console.log('');
    logInfo(`📚 Build info saved in: ${config.extensionDir}/BUILD_INFO.md`);
    
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  config,
  logInfo,
  logSuccess,
  logWarning,
  logError
};