#!/bin/bash

# Test Build Script for Vercel Deployment
# This script tests the production build locally

echo "🔧 Testing production build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf .angular/cache/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️ Building for production..."
npm run build:prod

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Check if dist folder exists
    if [ -d "dist/uffizi-shop-temp/browser" ]; then
        echo "✅ Output directory exists: dist/uffizi-shop-temp/browser"
        
        # Check if index.html exists
        if [ -f "dist/uffizi-shop-temp/browser/index.html" ]; then
            echo "✅ index.html found"
            
            # Show directory structure
            echo "📁 Build output structure:"
            ls -la dist/uffizi-shop-temp/browser/
            
            # Optional: Start local server to test
            echo ""
            echo "🌐 To test locally, run:"
            echo "   npx http-server dist/uffizi-shop-temp/browser -p 8080"
            echo "   Then visit: http://localhost:8080"
            
        else
            echo "❌ index.html not found in build output"
            exit 1
        fi
    else
        echo "❌ Output directory not found: dist/uffizi-shop-temp/browser"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Build test complete! Ready for Vercel deployment." 