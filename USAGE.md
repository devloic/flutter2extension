# Flutter to Chrome Extension Builder

Convert Flutter web apps into Chrome extensions with WebAssembly and JavaScript support.

## Available Scripts

### Bash Version
```bash
./build-extension.sh --output DIRECTORY [OPTIONS]
```

### Node.js Version
```bash
node build-extension.js --output DIRECTORY [OPTIONS]
# or
./build-extension.js --output DIRECTORY [OPTIONS]
```

Both scripts provide identical functionality and command-line interface.

## Features

- ✅ **Dual Build Support**: WebAssembly (dart2wasm) and JavaScript (dart2js)
- ✅ **Extension Modes**: Popup and Content Scripts
- ✅ **Debug Control**: Production builds with --no-debug flag
- ✅ **Chrome Extension Manifest V3**: Full compatibility
- ✅ **Flutter Integration**: Automatic patching for Chrome extension environment
- ✅ **Container Targeting**: Proper Flutter rendering within extension context
- ✅ **URL Resolution**: Fixed Chrome extension resource loading
- ✅ **CSP Compliance**: Content Security Policy configuration

## Usage

### Basic Usage
```bash
# Bash version
./build-extension.sh --output my-extension

# Node.js version  
node build-extension.js --output my-extension
```

### Advanced Options
```bash
# WebAssembly popup extension with custom name
./build-extension.sh --output wasm-popup --wasm --popup --name "My Flutter App"

# JavaScript content script extension without debug messages
node build-extension.js --output js-content --web --content_scripts --no-debug

# Custom extension with all options
./build-extension.sh --output custom-ext \
  --name "Custom Flutter Extension" \
  --version "2.0.0" \
  --description "My custom Flutter Chrome extension" \
  --wasm --content_scripts --no-debug
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output DIR` | **Required**: Output directory for extension | - |
| `--name NAME` | Extension name | "Flutter App Extension" |
| `--version VERSION` | Extension version | "1.0.0" |
| `--description DESC` | Extension description | Auto-generated |
| `--web` | Build JavaScript version (dart2js) | - |
| `--wasm` | Build WebAssembly version (dart2wasm) | ✅ Default |
| `--popup` | Generate popup mode extension | ✅ Default |
| `--content_scripts` | Generate content scripts mode extension | - |
| `--no-build` | Skip Flutter build step | - |
| `--no-debug` | Remove console debug messages | - |
| `--help` | Show help message | - |

## Extension Modes

### Popup Mode (Default)
- Extension appears as popup when clicking the extension icon
- Fixed 500x600px dimensions
- Best for standalone app experiences

### Content Scripts Mode
- Extension injects into web pages as floating overlay
- Resizable and draggable window
- Toggle with Ctrl+Shift+F
- Best for tools that enhance web browsing

## Build Types

### WebAssembly (Default)
- Uses `dart2wasm` compilation
- Skwasm renderer for better performance
- True WebAssembly execution
- Larger initial bundle size

### JavaScript
- Uses `dart2js` compilation
- CanvasKit renderer with WASM files
- Smaller initial bundle size
- Broader compatibility

## Installation Instructions

1. Build your extension:
   ```bash
   ./build-extension.sh --output my-extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" button

5. Select your generated extension directory (`my-extension`)

6. The extension should now appear in your extensions list

## Requirements

- Flutter SDK installed and in PATH
- Node.js (for Node.js version only)
- Chrome browser for testing
- Flutter project with `pubspec.yaml` in current directory

## Generated Files Structure

```
my-extension/
├── manifest.json              # Chrome extension configuration
├── popup.html                 # Popup interface (popup mode)
├── content_script.js          # Content injection (content scripts mode)
├── content_script.css         # Overlay styling (content scripts mode)
├── flutter_bootstrap.js       # Patched Flutter bootstrap
├── flutter_init.js           # Flutter initialization
├── main.dart.js/.wasm        # Compiled Flutter app
├── canvaskit/                # Rendering engine
├── assets/                   # Flutter assets
└── BUILD_INFO.md             # Build documentation
```

## Technical Details

### Chrome Extension Integration
- **Manifest V3**: Full compatibility with modern Chrome extension standards
- **CSP Configuration**: Proper Content Security Policy for WASM and JavaScript
- **Resource Loading**: Fixed URL resolution for Chrome extension context
- **Container Targeting**: Flutter renders within extension-specific containers

### Flutter Patching
- **Bootstrap Override**: Complete Flutter initialization replacement
- **URL Resolution**: Chrome extension protocol support
- **CDN Blocking**: Forces local CanvasKit usage instead of Google CDN
- **Debug Control**: Conditional debug message inclusion/exclusion

### Error Handling
- **Syntax Validation**: All generated JavaScript is syntax-validated
- **Fallback Mechanisms**: Multiple extension ID detection methods
- **Environment Checks**: Validates Flutter installation and project structure

## Troubleshooting

### Common Issues

1. **"Identifier 'extensionId' has already been declared"**
   - Fixed in latest version with safe variable scoping

2. **Flutter app shows "Loading Flutter app..." indefinitely**
   - Check browser console for errors
   - Verify extension has proper permissions
   - Ensure Flutter build completed successfully

3. **CSP violations in console**
   - Normal for some Flutter internal operations
   - Extension should still function correctly

### Debug Mode
Use debug builds during development to see detailed console logs:
```bash
# Enable debug messages (default)
./build-extension.sh --output debug-extension

# Disable debug messages for production
./build-extension.sh --output prod-extension --no-debug
```

## Contributing

Both bash and Node.js versions are functionally equivalent. Choose based on your preference:
- **Bash version**: No dependencies, works everywhere
- **Node.js version**: More maintainable, better error handling

## License

This tool is provided as-is for Flutter developers wanting to create Chrome extensions.
