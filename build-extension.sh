#!/bin/bash

# Flutter to Chrome Extension Builder (Unified)
# Converts a Flutter web app to a Chrome extension with WASM and JavaScript support

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FLUTTER_PROJECT_DIR="."
BUILD_DIR="build/web"
EXTENSION_DIR=""  # Will be set as mandatory parameter
EXTENSION_NAME="Flutter App Extension"
EXTENSION_VERSION="1.0.0"
EXTENSION_DESCRIPTION=""  # Will be set based on build type and mode
BUILD_TYPE="wasm"  # Default to WASM, can be changed with --web option
EXTENSION_MODE="popup"  # Default to popup, can be changed with --content_scripts option
DEBUG_MODE="true"  # Default to debug mode, can be changed with --no-debug option

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
EXTENSION_DIR_SET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            EXTENSION_DIR="$2"
            EXTENSION_DIR_SET=true
            shift 2
            ;;
        --name)
            EXTENSION_NAME="$2"
            shift 2
            ;;
        --version)
            EXTENSION_VERSION="$2"
            shift 2
            ;;
        --description)
            EXTENSION_DESCRIPTION="$2"
            shift 2
            ;;
        --no-build)
            NO_BUILD=true
            shift 1
            ;;
        --no-debug)
            DEBUG_MODE="false"
            shift 1
            ;;
        --web)
            BUILD_TYPE="web"
            shift 1
            ;;
        --wasm)
            BUILD_TYPE="wasm"
            shift 1
            ;;
        --popup)
            EXTENSION_MODE="popup"
            shift 1
            ;;
        --content_scripts)
            EXTENSION_MODE="content_scripts"
            shift 1
            ;;
        --help)
            echo "Flutter to Chrome Extension Builder (Unified)"
            echo ""
            echo "Usage: $0 --output DIRECTORY [OPTIONS]"
            echo ""
            echo "Required:"
            echo "  --output DIR             Output directory for Chrome extension"
            echo ""
            echo "Optional:"
            echo "  --name NAME              Extension name (default: '$EXTENSION_NAME')"
            echo "  --version VERSION        Extension version (default: '$EXTENSION_VERSION')"
            echo "  --description DESC       Extension description"
            echo "  --web                    Build JavaScript version (dart2js)"
            echo "  --wasm                   Build WebAssembly version (dart2wasm) [default]"
            echo "  --popup                  Generate popup mode extension [default]"
            echo "  --content_scripts        Generate content scripts mode extension"
            echo "  --no-build               Skip Flutter build step"
            echo "  --no-debug               Remove console debug messages for production"
            echo "  --help                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --output chrome-extension"
            echo "  $0 --output my-extension --name 'My Flutter Extension' --version '2.0.0'"
            echo "  $0 --output web-extension --web        # JavaScript version"
            echo "  $0 --output wasm-extension --wasm       # WebAssembly version"
            echo "  $0 --output popup-ext --popup          # Popup mode"
            echo "  $0 --output content-ext --content_scripts  # Content scripts mode"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if output directory was provided
if [ "$EXTENSION_DIR_SET" = false ] || [ -z "$EXTENSION_DIR" ]; then
    log_error "Output directory is required!"
    echo ""
    echo "Usage: $0 --output DIRECTORY [OPTIONS]"
    echo ""
    echo "Examples:"
    echo "  $0 --output chrome-extension"
    echo "  $0 --output my-extension --name 'My Flutter Extension'"
    echo ""
    echo "Use --help for more information"
    exit 1
fi

# Validation
if [ ! -f "pubspec.yaml" ]; then
    log_error "No pubspec.yaml found. Please run this script from the Flutter project root directory."
    exit 1
fi

if ! command -v flutter &> /dev/null; then
    log_error "Flutter is not installed or not in PATH"
    exit 1
fi

# Set description based on build type and mode if not provided
if [ -z "$EXTENSION_DESCRIPTION" ]; then
    if [ "$EXTENSION_MODE" = "content_scripts" ]; then
        if [ "$BUILD_TYPE" = "wasm" ]; then
            EXTENSION_DESCRIPTION="A Chrome content script running Flutter with WebAssembly"
        else
            EXTENSION_DESCRIPTION="A Chrome content script running Flutter with JavaScript"
        fi
    else
        if [ "$BUILD_TYPE" = "wasm" ]; then
            EXTENSION_DESCRIPTION="A Chrome extension popup running Flutter with WebAssembly"
        else
            EXTENSION_DESCRIPTION="A Chrome extension popup running Flutter with JavaScript"
        fi
    fi
fi

log_info "Starting Flutter to Chrome Extension build process..."
log_info "Extension Name: $EXTENSION_NAME"
log_info "Extension Version: $EXTENSION_VERSION"
log_info "Output Directory: $EXTENSION_DIR"
log_info "Build Type: $BUILD_TYPE"
log_info "Extension Mode: $EXTENSION_MODE"

# Step 1: Build Flutter web
if [ "$NO_BUILD" = true ]; then
    log_info "Step 1/6: Skipping Flutter build (--no-build flag)"
else
    if [ "$BUILD_TYPE" = "wasm" ]; then
        log_info "Step 1/7: Building Flutter web with WASM support..."
        flutter build web --wasm --debug
    else
        log_info "Step 1/7: Building Flutter web with JavaScript (dart2js)..."
        flutter build web --debug
    fi
    log_success "Flutter web build completed"
fi

# Step 2: Create extension directory
log_info "Step 2/6: Setting up Chrome extension directory..."
if [ -d "$EXTENSION_DIR" ]; then
    log_warning "Extension directory exists, cleaning up..."
    rm -rf "$EXTENSION_DIR"
fi
mkdir -p "$EXTENSION_DIR"
log_success "Extension directory created"

# Step 3: Copy Flutter build files
log_info "Step 3/6: Copying Flutter build files..."
cp -r "$BUILD_DIR"/* "$EXTENSION_DIR/"
log_success "Flutter files copied"

# Step 4: Create Chrome extension manifest
log_info "Step 4/6: Creating Chrome extension manifest..."

# Create base manifest
cat > "$EXTENSION_DIR/manifest.json" << EOF
{
  "manifest_version": 3,
  "name": "$EXTENSION_NAME",
  "version": "$EXTENSION_VERSION",
  "description": "$EXTENSION_DESCRIPTION",
  "permissions": [
    "activeTab"
  ],
  "icons": {
    "16": "icons/Icon-192.png",
    "48": "icons/Icon-192.png",
    "128": "icons/Icon-512.png"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "assets/*",
        "canvaskit/*",
        "canvaskit/skwasm.js",
        "canvaskit/skwasm.wasm",
        "canvaskit/skwasm_heavy.js",
        "canvaskit/skwasm_heavy.wasm",
        "canvaskit/canvaskit.js",
        "canvaskit/canvaskit.wasm",
        "*.js",
        "*.mjs",
        "*.wasm",
        "flutter.js",
        "flutter_bootstrap.js",
        "flutter_init.js",
        "flutter_service_worker.js",
        "main.dart.js",
        "main.dart.mjs",
        "main.dart.wasm"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
EOF

# Add mode-specific configuration using jq or manual editing
if [ "$EXTENSION_MODE" = "popup" ]; then
    # Add popup configuration
    jq '.action = {"default_popup": "popup.html", "default_title": "'"$EXTENSION_NAME"'"} | .content_security_policy = {"extension_pages": "script-src '\''self'\'' '\''wasm-unsafe-eval'\''; object-src '\''self'\''; connect-src '\''self'\'' data: blob: https://fonts.gstatic.com; font-src '\''self'\'' https://fonts.gstatic.com;"}' "$EXTENSION_DIR/manifest.json" > "$EXTENSION_DIR/manifest_temp.json" && mv "$EXTENSION_DIR/manifest_temp.json" "$EXTENSION_DIR/manifest.json" 2>/dev/null || {
        # Fallback if jq is not available - recreate the manifest with popup config
        cat > "$EXTENSION_DIR/manifest.json" << EOF
{
  "manifest_version": 3,
  "name": "$EXTENSION_NAME",
  "version": "$EXTENSION_VERSION",
  "description": "$EXTENSION_DESCRIPTION",
  "permissions": [
    "activeTab"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "$EXTENSION_NAME"
  },
  "icons": {
    "16": "icons/Icon-192.png",
    "48": "icons/Icon-192.png",
    "128": "icons/Icon-512.png"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "assets/*",
        "canvaskit/*",
        "canvaskit/skwasm.js",
        "canvaskit/skwasm.wasm",
        "canvaskit/skwasm_heavy.js",
        "canvaskit/skwasm_heavy.wasm",
        "canvaskit/canvaskit.js",
        "canvaskit/canvaskit.wasm",
        "*.js",
        "*.mjs",
        "*.wasm",
        "flutter.js",
        "flutter_bootstrap.js",
        "flutter_init.js",
        "flutter_service_worker.js",
        "main.dart.js",
        "main.dart.mjs",
        "main.dart.wasm"
      ],
      "matches": ["<all_urls>"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' data: blob: https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com;"
  }
}
EOF
    }
elif [ "$EXTENSION_MODE" = "content_scripts" ]; then
    # Add content scripts configuration
    jq '.content_scripts = [{"matches": ["<all_urls>"], "js": ["content_script.js"], "css": ["content_script.css"], "run_at": "document_end"}] | .permissions += ["scripting", "storage"] | .content_security_policy = {"extension_pages": "script-src '\''self'\'' '\''wasm-unsafe-eval'\''; object-src '\''self'\''; connect-src '\''self'\'' data: blob: https://fonts.gstatic.com; font-src '\''self'\'' https://fonts.gstatic.com;"}' "$EXTENSION_DIR/manifest.json" > "$EXTENSION_DIR/manifest_temp.json" && mv "$EXTENSION_DIR/manifest_temp.json" "$EXTENSION_DIR/manifest.json" 2>/dev/null || {
        # Fallback if jq is not available - recreate the manifest with content scripts config
        cat > "$EXTENSION_DIR/manifest.json" << EOF
{
  "manifest_version": 3,
  "name": "$EXTENSION_NAME",
  "version": "$EXTENSION_VERSION",
  "description": "$EXTENSION_DESCRIPTION",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_script.js"],
      "css": ["content_script.css"],
      "run_at": "document_end"
    }
  ],
  "icons": {
    "16": "icons/Icon-192.png",
    "48": "icons/Icon-192.png",
    "128": "icons/Icon-512.png"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "assets/*",
        "canvaskit/*",
        "canvaskit/skwasm.js",
        "canvaskit/skwasm.wasm",
        "canvaskit/skwasm_heavy.js",
        "canvaskit/skwasm_heavy.wasm",
        "canvaskit/canvaskit.js",
        "canvaskit/canvaskit.wasm",
        "*.js",
        "*.mjs",
        "*.wasm",
        "flutter.js",
        "flutter_bootstrap.js",
        "flutter_init.js",
        "flutter_service_worker.js",
        "main.dart.js",
        "main.dart.mjs",
        "main.dart.wasm"
      ],
      "matches": ["<all_urls>"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' data: blob: https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com;"
  }
}
EOF
    }
fi
log_success "Manifest created"

# Step 5: Patch Flutter files for container targeting
log_info "Step 5/7: Patching Flutter files for Chrome extension compatibility..."

# Function to patch Flutter files to use our container
patch_flutter_files() {
    log_info "Patching Flutter bootstrap file..."
    
    # Patch flutter_bootstrap.js to inject container targeting
    if [ -f "$EXTENSION_DIR/flutter_bootstrap.js" ]; then
        # Create backup
        cp "$EXTENSION_DIR/flutter_bootstrap.js" "$EXTENSION_DIR/flutter_bootstrap.js.backup"
        
        # Remove existing auto-initialization to prevent conflicts
        sed -i '/_flutter\.loader\.load({/,/});$/d' "$EXTENSION_DIR/flutter_bootstrap.js"
        
        # Also remove any buildConfig that conflicts
        sed -i '/_flutter\.buildConfig = /d' "$EXTENSION_DIR/flutter_bootstrap.js"
        
        # Add completely rewritten Chrome extension patch with conditional debug messages
        if [ "$DEBUG_MODE" = "true" ]; then
            LOG_PATCH_START="console.log('Applying Chrome extension Flutter patch...');"
            LOG_EXT_ID="console.log('Extension ID detected:', extensionId);"
            LOG_BUILD_CONFIG_WASM="console.log('Setting buildConfig for WASM build');"
            LOG_BUILD_CONFIG_JS="console.log('Setting buildConfig for JavaScript build');"
            LOG_INIT_START="console.log('Starting Flutter initialization with Chrome extension configuration...');"
            LOG_WASM_LOAD="console.log('Loading WASM build with Skwasm renderer...');"
            LOG_WASM_ENTRYPOINT="console.log('Flutter WASM entrypoint loaded via loader.load...');"
            LOG_WASM_HOST="console.log('Using Chrome extension container as Flutter host:', container);"
            LOG_WASM_HOST_ERR="console.error('Flutter container not found! Falling back to body');"
            LOG_WASM_ENGINE="console.log('Flutter WASM engine initialized, running app...');"
            LOG_WASM_SUCCESS="console.log('Flutter WASM app started successfully in Chrome extension container');"
            LOG_WASM_ERROR="console.error('Error initializing Flutter WASM engine in Chrome extension:', error);"
            LOG_JS_LOAD="console.log('Loading JavaScript build with CanvasKit renderer...');"
            LOG_JS_URL="console.log('Using Chrome extension URL for entrypoint:', url);"
            LOG_JS_URL_WARN="console.warn('Extension ID not available, using relative URL');"
            LOG_JS_ENTRYPOINT="console.log('Flutter JS entrypoint loaded, initializing with Chrome extension container...');"
            LOG_JS_HOST="console.log('Using Chrome extension container as Flutter host:', container);"
            LOG_JS_HOST_ERR="console.error('Flutter container not found! Falling back to body');"
            LOG_JS_ENGINE="console.log('Flutter JS engine initialized, running app...');"
            LOG_JS_SUCCESS="console.log('Flutter JS app started successfully in Chrome extension container');"
            LOG_JS_ERROR="console.error('Error initializing Flutter JS engine in Chrome extension:', error);"
            LOG_PATCH_END="console.log('Chrome extension Flutter patch applied');"
            LOG_FETCH_INT="console.log('Flutter fetch intercepted:', url);"
            LOG_FETCH_RED="console.log('Flutter fetch redirected:', url, '->', newUrl);"
            LOG_IMPORT_INT="console.log('Dynamic import intercepted:', url);"
            LOG_IMPORT_RED="console.log('Dynamic import redirected:', url, '->', newUrl);"
            LOG_C_FUNC="console.log('Flutter c() function redirected:', parts, '->', fullUrl);"
            LOG_EXT_ID_ERR="console.error('Extension ID not detected - Flutter URLs will not work properly');"
            # Content script debug messages
            LOG_INIT_CONFIG="console.log('Configuring Flutter for Chrome extension environment...');"
            LOG_CONTENT_CONFIG="console.log('Configuring Flutter for Chrome content script environment...');"
            LOG_CONTENT_FETCH_INT="console.log('Flutter fetch intercepted:', url);"
            LOG_CONTENT_FETCH_RED="console.log('Flutter fetch redirected:', url, '->', newUrl);"
            LOG_CONTENT_IMPORT_INT="console.log('Dynamic import intercepted:', url);"
            LOG_CONTENT_IMPORT_RED="console.log('Dynamic import redirected:', url, '->', newUrl);"
            LOG_CONTENT_READY="console.log('Flutter loader ready, starting Chrome content script initialization...');"
            LOG_CONTENT_DELEGATED="console.log('Flutter initialization delegated to patched bootstrap - no additional setup needed');"
            LOG_CONTENT_LOADED="console.log('Flutter Extension Content Script loaded');"
            LOG_OVERLAY_CREATE="console.log('Creating Flutter overlay window...');"
            LOG_OVERLAY_CREATED="console.log('Flutter overlay window created');"
            LOG_OVERLAY_SHOWN="console.log('Flutter overlay shown');"
            LOG_OVERLAY_INIT="console.log('Starting Flutter initialization after overlay is ready...');"
            LOG_OVERLAY_HIDDEN="console.log('Flutter overlay hidden');"
            LOG_CONTENT_INIT="console.log('Initializing Flutter in content script...');"
            LOG_CONTENT_SKIP="console.log('Flutter already initialized, skipping...');"
            LOG_CONTENT_EXT_ID="console.log('Setting global extension ID for Flutter:', extensionId);"
            LOG_CONTENT_INIT_SUCCESS="console.log('Flutter init script loaded successfully in content script');"
            LOG_CONTENT_BOOTSTRAP_SUCCESS="console.log('Flutter bootstrap loaded successfully in content script');"
            LOG_CONTENT_BOOTSTRAP_ERROR="console.error('Failed to load Flutter bootstrap script in content script');"
            LOG_CONTENT_INIT_ERROR="console.error('Failed to load Flutter initialization script in content script');"
            LOG_CONTENT_INITIALIZED="console.log('Flutter Extension Content Script initialized. Press Ctrl+Shift+F to toggle.');"
        else
            LOG_PATCH_START="//"
            LOG_EXT_ID="//"
            LOG_BUILD_CONFIG_WASM="//"
            LOG_BUILD_CONFIG_JS="//"
            LOG_INIT_START="//"
            LOG_WASM_LOAD="//"
            LOG_WASM_ENTRYPOINT="//"
            LOG_WASM_HOST="//"
            LOG_WASM_HOST_ERR="//"
            LOG_WASM_ENGINE="//"
            LOG_WASM_SUCCESS="//"
            LOG_WASM_ERROR="//"
            LOG_JS_LOAD="//"
            LOG_JS_URL="//"
            LOG_JS_URL_WARN="//"
            LOG_JS_ENTRYPOINT="//"
            LOG_JS_HOST="//"
            LOG_JS_HOST_ERR="//"
            LOG_JS_ENGINE="//"
            LOG_JS_SUCCESS="//"
            LOG_JS_ERROR="//"
            LOG_PATCH_END="//"
            LOG_FETCH_INT="//"
            LOG_FETCH_RED="//"
            LOG_IMPORT_INT="//"
            LOG_IMPORT_RED="//"
            LOG_C_FUNC="//"
            LOG_EXT_ID_ERR="//"
            # Content script debug messages (disabled)
            LOG_INIT_CONFIG="//"
            LOG_CONTENT_CONFIG="//"
            LOG_CONTENT_FETCH_INT="//"
            LOG_CONTENT_FETCH_RED="//"
            LOG_CONTENT_IMPORT_INT="//"
            LOG_CONTENT_IMPORT_RED="//"
            LOG_CONTENT_READY="//"
            LOG_CONTENT_DELEGATED="//"
            LOG_CONTENT_LOADED="//"
            LOG_OVERLAY_CREATE="//"
            LOG_OVERLAY_CREATED="//"
            LOG_OVERLAY_SHOWN="//"
            LOG_OVERLAY_INIT="//"
            LOG_OVERLAY_HIDDEN="//"
            LOG_CONTENT_INIT="//"
            LOG_CONTENT_SKIP="//"
            LOG_CONTENT_EXT_ID="//"
            LOG_CONTENT_INIT_SUCCESS="//"
            LOG_CONTENT_BOOTSTRAP_SUCCESS="//"
            LOG_CONTENT_BOOTSTRAP_ERROR="//"
            LOG_CONTENT_INIT_ERROR="//"
            LOG_CONTENT_INITIALIZED="//"
        fi
        
        cat >> "$EXTENSION_DIR/flutter_bootstrap.js" << FLUTTER_PATCH_EOF

// CHROME EXTENSION PATCH: Complete Flutter initialization override
$LOG_PATCH_START

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
      const match = scripts[0].src.match(/chrome-extension:\/\/([^/]+)/);
      if (match) extensionId = match[1];
    }
  }
  
  // Method 4: Extract from current script URL if possible
  if (!extensionId) {
    try {
      const currentScript = document.currentScript;
      if (currentScript && currentScript.src && currentScript.src.includes('chrome-extension://')) {
        const match = currentScript.src.match(/chrome-extension:\/\/([^/]+)/);
        if (match) extensionId = match[1];
      }
    } catch (e) {}
  }
  
  $LOG_EXT_ID

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
      $LOG_FETCH_INT
      if (typeof url === 'string') {
        // If it's a relative URL or doesn't start with chrome-extension://, convert it
        if (!url.startsWith('http') && !url.startsWith('chrome-extension://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\/+/, '');
          $LOG_FETCH_RED
          url = newUrl;
        }
      }
      return originalFetch.call(this, url, options);
    };

    // Override dynamic imports for .mjs files
    const originalImport = window.import;
    if (originalImport) {
      window.import = function(url) {
        $LOG_IMPORT_INT
        if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('chrome-extension://')) {
          const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\/+/, '');
          $LOG_IMPORT_RED
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
          if (i === 0) return p.replace(/^\/+|\/+$/g, '');
          return p.replace(/^\/+|\/+$/g, '');
        }).filter(p => p.length).join('/');
        
        const fullUrl = 'chrome-extension://' + extensionId + '/' + path;
        $LOG_C_FUNC
        return fullUrl;
      };
    }
  } else {
    $LOG_EXT_ID_ERR
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
const IS_WASM_BUILD = \$IS_WASM_BUILD; // Will be replaced during build

if (IS_WASM_BUILD) {
  $LOG_BUILD_CONFIG_WASM
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
  $LOG_BUILD_CONFIG_JS
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
$LOG_INIT_START

// Load Flutter with proper container targeting
if (IS_WASM_BUILD) {
  $LOG_WASM_LOAD
  
  window._flutter.loader.load({
    serviceWorkerSettings: null,
    config: {
      hostElement: (function() {
        const container = document.getElementById('flutter-extension-container');
        if (container) {
          $LOG_WASM_HOST
          return container;
        } else {
          $LOG_WASM_HOST_ERR
          return document.body;
        }
      })(),
      renderer: "skwasm",
      canvasKitVariant: "auto",
      useLocalCanvasKit: true,
      canvasKitBaseUrl: "canvaskit/"
    },
    onEntrypointLoaded: async function(engineInitializer) {
      $LOG_WASM_ENTRYPOINT
      
      try {
        const appRunner = await engineInitializer.initializeEngine({
          hostElement: (function() {
            const container = document.getElementById('flutter-extension-container');
            if (container) {
              $LOG_WASM_HOST
              return container;
            } else {
              $LOG_WASM_HOST_ERR
              return document.body;
            }
          })(),
          renderer: "skwasm",
          canvasKitVariant: "auto",
          useLocalCanvasKit: true,
          canvasKitBaseUrl: "canvaskit/"
        });
        
        $LOG_WASM_ENGINE
        await appRunner.runApp();
        $LOG_WASM_SUCCESS
        
      } catch (error) {
        $LOG_WASM_ERROR
      }
    }
  });
} else {
  $LOG_JS_LOAD
  
  window._flutter.loader.loadEntrypoint({
    entrypointUrl: (function() {
      // Use the detected extension ID to build the URL
      if (window.extensionId) {
        const url = 'chrome-extension://' + window.extensionId + '/main.dart.js';
        $LOG_JS_URL
        return url;
      } else {
        $LOG_JS_URL_WARN
        return 'main.dart.js';
      }
    })(),
    onEntrypointLoaded: async function(engineInitializer) {
      $LOG_JS_ENTRYPOINT
      
      try {
        const appRunner = await engineInitializer.initializeEngine({
          hostElement: (function() {
            const container = document.getElementById('flutter-extension-container');
            if (container) {
              $LOG_JS_HOST
              return container;
            } else {
              $LOG_JS_HOST_ERR
              return document.body;
            }
          })(),
          renderer: "canvaskit",
          canvasKitVariant: "auto",
          useLocalCanvasKit: true,
          canvasKitBaseUrl: "canvaskit/"
        });
        
        $LOG_JS_ENGINE
        await appRunner.runApp();
        $LOG_JS_SUCCESS
        
      } catch (error) {
        $LOG_JS_ERROR
      }
    }
  });
}

$LOG_PATCH_END
FLUTTER_PATCH_EOF
        
        # Replace the build type marker in the bootstrap patch
        if [ "$BUILD_TYPE" = "wasm" ]; then
            sed -i 's/\$IS_WASM_BUILD/true/g' "$EXTENSION_DIR/flutter_bootstrap.js"
        else
            sed -i 's/\$IS_WASM_BUILD/false/g' "$EXTENSION_DIR/flutter_bootstrap.js"
        fi
        
        log_success "Flutter bootstrap patched with container targeting and build type selection"
    fi
    
    # No additional patching needed - the bootstrap patch handles everything
}

# Apply patches
patch_flutter_files

# Step 6: Create Flutter initialization files
log_info "Step 6/7: Creating Flutter initialization files..."

if [ "$EXTENSION_MODE" = "popup" ]; then
    # Create simple flutter_init.js based on working JavaScript version
    if [ -f "$EXTENSION_DIR/flutter_bootstrap.js" ]; then
        # Create minimal flutter_init.js that just loads the patched bootstrap
        cat > "$EXTENSION_DIR/flutter_init.js" << FLUTTER_CONFIG_EOF
// Chrome extension configuration for Flutter
$LOG_INIT_CONFIG

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
document.head.appendChild(script);
FLUTTER_CONFIG_EOF
        
        log_success "Flutter initialization configured for Chrome extension"
    else
        log_error "flutter_bootstrap.js not found in Flutter build output"
        exit 1
    fi

    # Create popup.html
    cat > "$EXTENSION_DIR/popup.html" << POPUP_HTML_EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="description" content="$EXTENSION_DESCRIPTION">
  <title>$EXTENSION_NAME</title>
  
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
</html>
POPUP_HTML_EOF

    log_success "Popup Flutter initialization files created"

elif [ "$EXTENSION_MODE" = "content_scripts" ]; then
    # Content script implementation - inline to avoid function call issues
    if [ ! -f "$EXTENSION_DIR/flutter_bootstrap.js" ]; then
        log_error "flutter_bootstrap.js not found in Flutter build output"
        exit 1
    fi

    # Create complete flutter_init.js for content script without copying from bootstrap
    cat > "$EXTENSION_DIR/flutter_init.js" << CONTENT_SCRIPT_INIT_EOF
// Chrome content script configuration for Flutter
$LOG_CONTENT_CONFIG

// Get extension ID for resource URLs
let extensionId = '';
try {
  extensionId = chrome.runtime.id || '';
} catch (e) {
  // Fallback: get extension ID from script src
  const scripts = document.querySelectorAll('script[src*="chrome-extension://"]');
  if (scripts.length > 0) {
    const match = scripts[0].src.match(/chrome-extension:\/\/([^/]+)/);
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
  $LOG_CONTENT_FETCH_INT
  if (typeof url === 'string') {
    // If it's a relative URL or doesn't start with chrome-extension://, convert it
    if (!url.startsWith('http') && !url.startsWith('chrome-extension://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      if (extensionId) {
        const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\/+/, '');
        $LOG_CONTENT_FETCH_RED
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
    $LOG_CONTENT_IMPORT_INT
    if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('chrome-extension://')) {
      if (extensionId) {
        const newUrl = 'chrome-extension://' + extensionId + '/' + url.replace(/^\/+/, '');
        $LOG_CONTENT_IMPORT_RED
        url = newUrl;
      }
    }
    return originalImport.call(this, url);
  };
}

CONTENT_SCRIPT_INIT_EOF
    
    # Add simple content script initialization without buildConfig conflicts
    cat >> "$EXTENSION_DIR/flutter_init.js" << CONTENT_SCRIPT_LOAD_EOF

// Chrome content script Flutter initialization - simplified
$LOG_CONTENT_READY

// The patched Flutter bootstrap will handle all initialization automatically
$LOG_CONTENT_DELEGATED
CONTENT_SCRIPT_LOAD_EOF

    # Create content script CSS
    cat > "$EXTENSION_DIR/content_script.css" << 'CONTENT_SCRIPT_CSS_EOF'
/* Flutter Extension Content Script Styles */
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
}
CONTENT_SCRIPT_CSS_EOF

    # Create content script JavaScript
    cat > "$EXTENSION_DIR/content_script.js" << CONTENT_SCRIPT_JS_EOF
// Flutter Extension Content Script
$LOG_CONTENT_LOADED

let flutterOverlay = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createFlutterOverlay() {
  if (flutterOverlay) return;
  $LOG_OVERLAY_CREATE
  
  flutterOverlay = document.createElement('div');
  flutterOverlay.id = 'flutter-extension-overlay';
  flutterOverlay.className = 'hidden';
  
  const header = document.createElement('div');
  header.id = 'flutter-extension-header';
  header.innerHTML = \`<span>$EXTENSION_NAME</span><button id="flutter-extension-close" title="Close">×</button>\`;
  
  const container = document.createElement('div');
  container.id = 'flutter-extension-container';
  
  flutterOverlay.appendChild(header);
  flutterOverlay.appendChild(container);
  document.body.appendChild(flutterOverlay);
  
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  document.getElementById('flutter-extension-close').addEventListener('click', hideFlutterOverlay);
  
  $LOG_OVERLAY_CREATED
}

function showFlutterOverlay() {
  if (!flutterOverlay) createFlutterOverlay();
  flutterOverlay.classList.remove('hidden');
  $LOG_OVERLAY_SHOWN
  
  // Wait a bit for the overlay to be rendered before initializing Flutter
  setTimeout(function() {
    $LOG_OVERLAY_INIT
    initializeFlutter();
  }, 100);
}

function hideFlutterOverlay() {
  if (flutterOverlay) {
    flutterOverlay.classList.add('hidden');
    $LOG_OVERLAY_HIDDEN
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
  $LOG_CONTENT_INIT
  
  // Check if Flutter is already initialized to prevent duplicate loading
  if (window.flutterInitialized) {
    $LOG_CONTENT_SKIP
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
      const match = scripts[0].src.match(/chrome-extension:\/\/([^/]+)/);
      if (match) extensionId = match[1];
    }
  }
  
  // Pass extension ID to Flutter bootstrap via global variable
  if (extensionId) {
    window.FLUTTER_EXTENSION_ID = extensionId;
    $LOG_CONTENT_EXT_ID
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
    $LOG_CONTENT_INIT_SUCCESS
    
    // Now load the bootstrap which will initialize Flutter
    const bootstrapScript = document.createElement('script');
    if (extensionId) {
      bootstrapScript.src = 'chrome-extension://' + extensionId + '/flutter_bootstrap.js';
    } else {
      bootstrapScript.src = 'flutter_bootstrap.js'; // Fallback
    }
    bootstrapScript.async = false;
    
    bootstrapScript.onload = function() {
      $LOG_CONTENT_BOOTSTRAP_SUCCESS
    };
    
    bootstrapScript.onerror = function() {
      $LOG_CONTENT_BOOTSTRAP_ERROR
    };
    
    document.head.appendChild(bootstrapScript);
  };
  
  initScript.onerror = function() {
    $LOG_CONTENT_INIT_ERROR
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
$LOG_CONTENT_INITIALIZED
CONTENT_SCRIPT_JS_EOF

    log_success "Content script Flutter initialization files created"
fi

# Step 7: Create build information
log_info "Step 7/7: Creating build information..."
cat > "$EXTENSION_DIR/BUILD_INFO.md" << BUILD_INFO_EOF
# Chrome Extension Build Information

**Generated:** $(date)
**Flutter Version:** $(flutter --version | head -n1)
**Extension Name:** $EXTENSION_NAME
**Extension Version:** $EXTENSION_VERSION
**Extension Mode:** $EXTENSION_MODE
**Build Type:** $BUILD_TYPE

## Installation Instructions

1. Open Chrome and navigate to \`chrome://extensions/\`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select this \`$EXTENSION_DIR\` directory
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

- **Flutter Version**: $(flutter --version | head -n1)
- **Extension Mode**: $EXTENSION_MODE
- **Build Type**: $BUILD_TYPE ($([[ "$BUILD_TYPE" = "wasm" ]] && echo "WebAssembly with Skwasm renderer" || echo "JavaScript with CanvasKit renderer"))
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
./build-extension.sh --output "$EXTENSION_DIR" --name "$EXTENSION_NAME" --version "$EXTENSION_VERSION" --$EXTENSION_MODE --$BUILD_TYPE
\`\`\`
BUILD_INFO_EOF

log_success "Build information created"

# Final summary
echo ""
log_success "✅ Chrome extension build completed successfully!"
echo ""
log_info "📁 Extension files are in: $EXTENSION_DIR"
log_info "📦 Extension name: $EXTENSION_NAME"
log_info "🔢 Extension version: $EXTENSION_VERSION"
log_info "🎯 Extension mode: $EXTENSION_MODE"
log_info "⚡ Build type: $BUILD_TYPE"
echo ""
if [ "$EXTENSION_MODE" = "content_scripts" ]; then
    log_info "🚀 Content Scripts Mode Instructions:"
    echo "   1. Open Chrome and go to chrome://extensions/"
    echo "   2. Enable 'Developer mode'"
    echo "   3. Click 'Load unpacked' and select the '$EXTENSION_DIR' directory"
    echo "   4. Visit any website to see the floating Flutter overlay"
    echo "   5. Use Ctrl+Shift+F to toggle the overlay"
else
    log_info "🚀 Popup Mode Instructions:"
    echo "   1. Open Chrome and go to chrome://extensions/"
    echo "   2. Enable 'Developer mode'"
    echo "   3. Click 'Load unpacked' and select the '$EXTENSION_DIR' directory"
    echo "   4. Click the extension icon to test your Flutter app!"
fi
echo ""
log_info "📚 Build info saved in: $EXTENSION_DIR/BUILD_INFO.md"