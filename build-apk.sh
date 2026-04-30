#!/bin/bash
set -e

# Detect Android SDK
if [ -z "$ANDROID_HOME" ]; then
  UNIX_APPDATA=$(cygpath -u "$LOCALAPPDATA" 2>/dev/null)
  if [ -n "$UNIX_APPDATA" ] && [ -d "$UNIX_APPDATA/Android/Sdk" ]; then
    export ANDROID_HOME="$UNIX_APPDATA/Android/Sdk"
  fi
fi

if [ -z "$ANDROID_HOME" ] || [ ! -d "$ANDROID_HOME" ]; then
  echo ""
  echo "ERROR: Android SDK no encontrado."
  echo "Instala Android Studio desde: https://developer.android.com/studio"
  echo "O establece: export ANDROID_HOME=/ruta/al/sdk"
  exit 1
fi

export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH"
echo "Usando Android SDK: $ANDROID_HOME"
echo ""

# Generate icons from public/icon-apk/icon.png
ICON_SRC="public/icon-apk/icon.png"
if [ -f "$ICON_SRC" ]; then
  echo "0/4 Generando iconos..."
  declare -A SIZES=(
    ["android/app/src/main/res/mipmap-mdpi"]=48
    ["android/app/src/main/res/mipmap-hdpi"]=72
    ["android/app/src/main/res/mipmap-xhdpi"]=96
    ["android/app/src/main/res/mipmap-xxhdpi"]=144
    ["android/app/src/main/res/mipmap-xxxhdpi"]=192
  )
  for DIR in "${!SIZES[@]}"; do
    SIZE="${SIZES[$DIR]}"
    magick "$ICON_SRC" -resize "${SIZE}x${SIZE}" "$DIR/ic_launcher.png"
    magick "$ICON_SRC" -resize "${SIZE}x${SIZE}" "$DIR/ic_launcher_round.png"
    magick "$ICON_SRC" -resize "${SIZE}x${SIZE}" "$DIR/ic_launcher_foreground.png"
  done
  echo "   Iconos generados OK"
else
  echo "AVISO: No se encontro $ICON_SRC, se usara el icono por defecto"
fi

# Build web app
echo "1/3 Compilando la app web..."
npx vite build

# Sync to Android
echo "2/3 Sincronizando con Android..."
npx cap sync android

# Build APK
echo "3/3 Generando APK..."
cd android
chmod +x gradlew 2>/dev/null || true
./gradlew assembleDebug

# Copy APK to output directory
APK_SRC="app/build/outputs/apk/debug/app-debug.apk"
APK_OUT_DIR="../info/apk-build"
APK_DST="$APK_OUT_DIR/roba-politicos.apk"

mkdir -p "$APK_OUT_DIR"

if [ -f "$APK_SRC" ]; then
  cp "$APK_SRC" "$APK_DST"
  echo ""
  echo "APK generada: info/apk-build/roba-politicos.apk"
  echo "Ruta: $(cd .. && pwd)/info/apk-build/roba-politicos.apk"
else
  echo "ERROR: No se genero la APK en $APK_SRC"
  exit 1
fi
