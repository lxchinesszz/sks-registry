#!/bin/bash
# npm-publish: @lxchinesszz 专用 npm 发布脚本
# 用法: bash publish.sh <token> [version-bump]

set -euo pipefail

TOKEN="${1:-}"
BUMP="${2:-none}"
CACHE_DIR="/tmp/npm-cache-sks"

if [ -z "$TOKEN" ]; then
  echo "❌ 请提供 npm token"
  echo "用法: bash publish.sh <npm_token> [patch|minor|major]"
  exit 1
fi

echo "🔑 打开 npm token 页面..."
open "https://www.npmjs.com/settings" 2>/dev/null || echo "⚠️  请手动打开 https://www.npmjs.com/settings 获取 token"

mkdir -p "$CACHE_DIR"

case "$BUMP" in
  patch|minor|major)
    echo "📦 升级版本: $BUMP"
    npm version "$BUMP" --no-git-tag-version
    ;;
  none) ;;
  *)
    echo "用法: bash publish.sh <npm_token> [patch|minor|major]"
    exit 1
    ;;
esac

PACKAGE_NAME=$(node -e "console.log(require('./package.json').name)")
ACCESS_FLAG=""
if [[ "$PACKAGE_NAME" == @* ]]; then
  ACCESS_FLAG="--access=public"
fi

echo "🚀 发布 $PACKAGE_NAME ..."
npm publish $ACCESS_FLAG --cache "$CACHE_DIR" --//registry.npmjs.org/:_authToken="$TOKEN" 2>&1

echo "✅ 发布成功: $PACKAGE_NAME@$(node -e "console.log(require('./package.json').version)")"
