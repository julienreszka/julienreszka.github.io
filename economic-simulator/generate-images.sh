#!/bin/bash

# Open Graph Image Generation Script
# Generates preview images for social media sharing

echo "🎨 Economic Curves Simulator - OG Image Generator"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "📸 Generating Open Graph images..."
node generate-og-images.js

if [ $? -eq 0 ]; then
    echo "🎉 Open Graph images generated successfully!"
    echo ""
    echo "Generated files:"
    ls -la *.png 2>/dev/null | grep -E "(armey|laffer|j-curve|supply|division|hockey).*preview\.png" || echo "No preview images found"
    echo ""
    echo "✨ These images are now ready to use as Open Graph previews!"
    echo "They will be automatically referenced in the meta tags."
else
    echo "❌ Failed to generate images"
    echo "You can try the manual browser method instead:"
    echo "1. Open index.html in a browser"
    echo "2. Open browser developer tools console"
    echo "3. Run the canvas generation script from generate-og-images.js"
fi
