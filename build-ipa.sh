#!/bin/bash
set -e

# Check macOS
if [ "$(uname)" != "Darwin" ]; then
  echo ""
  echo "ERROR: Este script solo funciona en macOS con Xcode."
  echo "Los builds de iOS requieren Xcode, que solo esta disponible en Mac."
  exit 1
fi

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
  echo "ERROR: Xcode no encontrado."
  echo "Instala Xcode desde la App Store: https://apps.apple.com/app/xcode/id497799835"
  exit 1
fi

# Check CocoaPods
if ! command -v pod &> /dev/null; then
  echo "ERROR: CocoaPods no encontrado."
  echo "Instala con: sudo gem install cocoapods"
  exit 1
fi

echo "Build IPA - Roba Politicos"
echo ""

OUTPUT_DIR="$(pwd)/info/ipa-build"
mkdir -p "$OUTPUT_DIR"

# Build web app
echo "1/4 Compilando la app web..."
npx vite build

# Add iOS platform if first time
if [ ! -d "ios" ]; then
  echo "   Añadiendo plataforma iOS (primera vez, puede tardar)..."
  npx cap add ios
fi

# Sync web assets to iOS
echo "2/4 Sincronizando con iOS..."
npx cap sync ios

# Force landscape orientation in Info.plist (after sync para que no se sobreescriba)
PLIST="ios/App/App/Info.plist"
if [ -f "$PLIST" ]; then
  /usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations~ipad" "$PLIST" 2>/dev/null || true

  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationLandscapeLeft" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations:1 string UIInterfaceOrientationLandscapeRight" "$PLIST"

  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad array" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad:0 string UIInterfaceOrientationLandscapeLeft" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad:1 string UIInterfaceOrientationLandscapeRight" "$PLIST"
fi

# Generate iOS icons from public/icon-apk/icon.png using sips (built-in macOS)
ICON_SRC="public/icon-apk/icon.png"
if [ -f "$ICON_SRC" ]; then
  echo "3/4 Generando iconos iOS..."
  ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
  mkdir -p "$ICON_DIR"

  for SIZE in 20 29 40 58 60 76 80 87 120 152 167 180 1024; do
    sips -z $SIZE $SIZE "$ICON_SRC" --out "$ICON_DIR/icon-${SIZE}.png" > /dev/null 2>&1
  done

  cat > "$ICON_DIR/Contents.json" << 'CONTENTS'
{
  "images": [
    {"idiom": "iphone", "scale": "2x", "size": "20x20",   "filename": "icon-40.png"},
    {"idiom": "iphone", "scale": "3x", "size": "20x20",   "filename": "icon-60.png"},
    {"idiom": "iphone", "scale": "2x", "size": "29x29",   "filename": "icon-58.png"},
    {"idiom": "iphone", "scale": "3x", "size": "29x29",   "filename": "icon-87.png"},
    {"idiom": "iphone", "scale": "2x", "size": "40x40",   "filename": "icon-80.png"},
    {"idiom": "iphone", "scale": "3x", "size": "40x40",   "filename": "icon-120.png"},
    {"idiom": "iphone", "scale": "2x", "size": "60x60",   "filename": "icon-120.png"},
    {"idiom": "iphone", "scale": "3x", "size": "60x60",   "filename": "icon-180.png"},
    {"idiom": "ipad",   "scale": "1x", "size": "20x20",   "filename": "icon-20.png"},
    {"idiom": "ipad",   "scale": "2x", "size": "20x20",   "filename": "icon-40.png"},
    {"idiom": "ipad",   "scale": "1x", "size": "29x29",   "filename": "icon-29.png"},
    {"idiom": "ipad",   "scale": "2x", "size": "29x29",   "filename": "icon-58.png"},
    {"idiom": "ipad",   "scale": "1x", "size": "40x40",   "filename": "icon-40.png"},
    {"idiom": "ipad",   "scale": "2x", "size": "40x40",   "filename": "icon-80.png"},
    {"idiom": "ipad",   "scale": "1x", "size": "76x76",   "filename": "icon-76.png"},
    {"idiom": "ipad",   "scale": "2x", "size": "76x76",   "filename": "icon-152.png"},
    {"idiom": "ipad",   "scale": "2x", "size": "83.5x83.5","filename": "icon-167.png"},
    {"idiom": "ios-marketing", "scale": "1x", "size": "1024x1024", "filename": "icon-1024.png"}
  ],
  "info": {"author": "xcode", "version": 1}
}
CONTENTS
  echo "   Iconos iOS generados OK"
fi

# Build IPA
echo "4/4 Generando IPA..."
cd ios/App

xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -archivePath "$OUTPUT_DIR/App.xcarchive" \
  CODE_SIGN_STYLE=Automatic \
  archive 2>&1 | grep -E "(error:|warning: |BUILD |Signing)" || true

xcodebuild \
  -exportArchive \
  -archivePath "$OUTPUT_DIR/App.xcarchive" \
  -exportPath "$OUTPUT_DIR" \
  -exportOptionsPlist "../../ExportOptions.plist" \
  2>&1 | grep -E "(error:|warning: |BUILD |Exported)" || true

cd ../..

IPA_FILE=$(find "$OUTPUT_DIR" -name "*.ipa" ! -name "roba-politicos.ipa" | head -1)
if [ -n "$IPA_FILE" ]; then
  mv "$IPA_FILE" "$OUTPUT_DIR/roba-politicos.ipa"
elif [ ! -f "$OUTPUT_DIR/roba-politicos.ipa" ]; then
  echo ""
  echo "ERROR: No se genero la IPA."
  echo "Abre el proyecto en Xcode para configurar el equipo de firma:"
  echo "  npm run cap:ios"
  exit 1
fi

echo ""
echo "IPA generada: info/ipa-build/roba-politicos.ipa"
echo "Ruta: $OUTPUT_DIR/roba-politicos.ipa"
echo ""
echo "Para instalar en un dispositivo iOS usa Apple Configurator 2 o Xcode."
