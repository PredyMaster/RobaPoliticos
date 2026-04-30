#!/bin/bash

# Convierte "C:\Users\foo\bar" a "/c/Users/foo/bar" o "/mnt/c/Users/foo/bar"
# $1 = ruta Windows, $2 = prefijo de mount ("" para Git Bash, "/mnt" para WSL)
win_to_unix_path() {
  local DRIVE REST
  DRIVE=$(echo "$1" | cut -c1 | tr 'A-Z' 'a-z')
  REST=$(echo "$1" | cut -c4- | sed 's|\\|/|g')
  echo "${2}/$DRIVE/$REST"
}

# Detect Android SDK
if [ -z "$ANDROID_HOME" ]; then
  WIN_APPDATA=$(cmd.exe /c "echo %LOCALAPPDATA%" 2>/dev/null | tr -d '\r\n')
  if [ -n "$WIN_APPDATA" ] && [ "$WIN_APPDATA" != "%LOCALAPPDATA%" ]; then
    # Probar prefijos de mount: Git Bash usa /c/, WSL usa /mnt/c/
    for MOUNT_PREFIX in "" "/mnt"; do
      CANDIDATE=$(win_to_unix_path "$WIN_APPDATA" "$MOUNT_PREFIX")/Android/Sdk
      if [ -d "$CANDIDATE" ]; then
        export ANDROID_HOME="$CANDIDATE"
        break
      fi
    done
  fi
fi

if [ -z "$ANDROID_HOME" ]; then
  # Buscar con glob en rutas comunes (Git Bash y WSL)
  for SDK_PATH in \
    /c/Users/*/AppData/Local/Android/Sdk \
    /d/Users/*/AppData/Local/Android/Sdk \
    /mnt/c/Users/*/AppData/Local/Android/Sdk \
    /mnt/d/Users/*/AppData/Local/Android/Sdk \
    /c/Android/Sdk \
    /mnt/c/Android/Sdk; do
    if [ -d "$SDK_PATH" ]; then
      export ANDROID_HOME="$SDK_PATH"
      break
    fi
  done
fi

if [ -z "$ANDROID_HOME" ] || [ ! -d "$ANDROID_HOME" ]; then
  WIN_APPDATA=$(cmd.exe /c "echo %LOCALAPPDATA%" 2>/dev/null | tr -d '\r\n')
  echo ""
  echo "ERROR: Android SDK no encontrado."
  echo "  HOME         : $HOME"
  echo "  LOCALAPPDATA : $WIN_APPDATA"
  echo "  Ruta probada : $(win_to_unix_path "$WIN_APPDATA" "")/Android/Sdk"
  echo "  Ruta probada : $(win_to_unix_path "$WIN_APPDATA" "/mnt")/Android/Sdk"
  echo ""
  echo "Instala Android Studio desde: https://developer.android.com/studio"
  echo "O ejecuta antes: export ANDROID_HOME=/ruta/al/sdk"
  exit 1
fi

export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH"
echo "Usando Android SDK: $ANDROID_HOME"

# Detect JAVA_HOME
if [ -z "$JAVA_HOME" ] || ! command -v java &>/dev/null; then
  # 1. JDK incluido en Android Studio (jbr = JetBrains Runtime, versiones recientes)
  for JDK_PATH in \
    "/mnt/c/Program Files/Android/Android Studio/jbr" \
    "/mnt/c/Program Files/Android/Android Studio/jre" \
    /c/Program\ Files/Android/Android\ Studio/jbr \
    /c/Program\ Files/Android/Android\ Studio/jre; do
    if [ -d "$JDK_PATH" ]; then
      export JAVA_HOME="$JDK_PATH"
      break
    fi
  done
fi

if [ -z "$JAVA_HOME" ] || ! [ -d "$JAVA_HOME" ]; then
  # 2. JDK standalone instalado en Program Files (cualquier version)
  for JDK_PATH in \
    /mnt/c/Program\ Files/Java/jdk* \
    /mnt/c/Program\ Files/Eclipse\ Adoptium/jdk* \
    /mnt/c/Program\ Files/Microsoft/jdk* \
    /mnt/c/Program\ Files/OpenJDK/jdk* \
    /c/Program\ Files/Java/jdk*; do
    if [ -d "$JDK_PATH" ]; then
      export JAVA_HOME="$JDK_PATH"
      break
    fi
  done
fi

if [ -z "$JAVA_HOME" ] || ! [ -d "$JAVA_HOME" ]; then
  # 3. Preguntar a cmd.exe donde esta Java
  WIN_JAVA=$(cmd.exe /c "where java" 2>/dev/null | head -1 | tr -d '\r\n')
  if [ -n "$WIN_JAVA" ]; then
    # java.exe esta en C:\...\bin\java.exe, JAVA_HOME es dos niveles arriba
    WIN_JDK=$(echo "$WIN_JAVA" | sed 's|\\bin\\java.exe||I; s|\\bin\\java||I')
    DRIVE=$(echo "$WIN_JDK" | cut -c1 | tr 'A-Z' 'a-z')
    REST=$(echo "$WIN_JDK" | cut -c4- | sed 's|\\|/|g')
    for MOUNT_PREFIX in "/mnt" ""; do
      CANDIDATE="${MOUNT_PREFIX}/$DRIVE/$REST"
      if [ -d "$CANDIDATE" ]; then
        export JAVA_HOME="$CANDIDATE"
        break
      fi
    done
  fi
fi

if [ -z "$JAVA_HOME" ] || ! [ -d "$JAVA_HOME" ]; then
  echo ""
  echo "ERROR: Java (JDK) no encontrado."
  echo "Android Studio incluye un JDK. Asegurate de tenerlo instalado."
  echo "O ejecuta antes: export JAVA_HOME=/ruta/al/jdk"
  exit 1
fi

echo "Usando Java: $JAVA_HOME"
echo ""

# Generate icons from public/icon-apk/icon.png (optional, no falla si magick no esta)
ICON_SRC="public/icon-apk/icon.png"
if [ -f "$ICON_SRC" ] && command -v magick &>/dev/null; then
  echo "0/4 Generando iconos..."
  magick "$ICON_SRC" -resize "48x48"   "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"     2>/dev/null || true
  magick "$ICON_SRC" -resize "48x48"   "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "48x48"   "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "72x72"   "android/app/src/main/res/mipmap-hdpi/ic_launcher.png"     2>/dev/null || true
  magick "$ICON_SRC" -resize "72x72"   "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "72x72"   "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "96x96"   "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"    2>/dev/null || true
  magick "$ICON_SRC" -resize "96x96"   "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "96x96"   "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "144x144" "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"   2>/dev/null || true
  magick "$ICON_SRC" -resize "144x144" "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "144x144" "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "192x192" "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"  2>/dev/null || true
  magick "$ICON_SRC" -resize "192x192" "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png" 2>/dev/null || true
  magick "$ICON_SRC" -resize "192x192" "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png" 2>/dev/null || true
  echo "   Iconos generados OK"
else
  echo "AVISO: No se generaron iconos (icon.png no encontrado o ImageMagick no instalado)"
fi

# Build web app
echo "1/3 Compilando la app web..."
npx vite build
if [ $? -ne 0 ]; then
  echo "ERROR: Fallo la compilacion web."
  exit 1
fi

# Sync to Android
echo "2/3 Sincronizando con Android..."
npx cap sync android
if [ $? -ne 0 ]; then
  echo "ERROR: Fallo cap sync android."
  exit 1
fi

# Escribir local.properties con la ruta Windows del SDK (necesario para Gradle en WSL)
if command -v wslpath &>/dev/null; then
  WIN_SDK=$(wslpath -w "$ANDROID_HOME")
  WIN_SDK_ESCAPED=$(echo "$WIN_SDK" | sed 's|\\|\\\\|g')
  echo "sdk.dir=$WIN_SDK_ESCAPED" > android/local.properties
  echo "Generado android/local.properties con sdk.dir=$WIN_SDK"
fi

# Build APK
echo "3/3 Generando APK..."
if command -v wslpath &>/dev/null; then
  # Estamos en WSL: usar powershell.exe para manejar rutas con espacios
  WIN_ANDROID_DIR=$(wslpath -w "$(pwd)/android")
  powershell.exe -NoProfile -Command "Push-Location -LiteralPath '$WIN_ANDROID_DIR'; .\gradlew.bat assembleDebug; \$ec = \$LASTEXITCODE; Pop-Location; exit \$ec"
  GRADLE_EXIT=$?
else
  cd android
  chmod +x gradlew 2>/dev/null || true
  ./gradlew assembleDebug
  GRADLE_EXIT=$?
  cd ..
fi

if [ $GRADLE_EXIT -ne 0 ]; then
  echo "ERROR: Fallo el build con Gradle."
  exit 1
fi

# Copy APK to output directory with auto-numbering if already exists
APK_SRC="android/app/build/outputs/apk/debug/app-debug.apk"
APK_OUT_DIR="info/apk-build"
BASE_NAME="roba-politicos"

mkdir -p "$APK_OUT_DIR"

if [ ! -f "$APK_SRC" ]; then
  echo "ERROR: No se genero la APK en $APK_SRC"
  exit 1
fi

# Find a unique filename
APK_DST="$APK_OUT_DIR/${BASE_NAME}.apk"
if [ -f "$APK_DST" ]; then
  COUNTER=2
  while [ -f "$APK_OUT_DIR/${BASE_NAME}-${COUNTER}.apk" ]; do
    COUNTER=$((COUNTER + 1))
  done
  APK_DST="$APK_OUT_DIR/${BASE_NAME}-${COUNTER}.apk"
fi

cp "$APK_SRC" "$APK_DST"
echo ""
echo "APK generada: $APK_DST"
echo "Ruta completa: $(pwd)/$APK_DST"
