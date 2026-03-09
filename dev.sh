#!/bin/bash

echo "🔄 Reiniciando ADB..."
adb kill-server
adb start-server
adb reverse tcp:8081 tcp:8081

if [ "$1" = "build" ]; then
  echo "📦 Buildando e instalando..."
  npx expo run:android
else
  echo "🚀 Iniciando Metro..."
  npx expo start --dev-client
fi