---
name: npm-publish
description: "为 @lxchinesszz 专用的 npm 包发布技能。当用户需要将包发布到 npm registry 时使用。触发场景：npm publish、发布到 npm、提交 npm 包、更新 npm 版本。发布前自动打开 npm token 页面提醒用户获取 token，支持 scope 包 public 访问、缓存权限处理。"
---

# NPM Publish

为 `@lxchinesszz` 账号定制的 npm 发布流程。

## 发布流程

### 1. 获取 Token

发布前需要用户提供 npm token。自动打开 [npm token 页面](https://www.npmjs.com/settings)，提醒用户：

- 生成 **Granular Access Token**
- 勾选 **"Bypass two-factor authentication (2FA)"**
- 复制 token 提供

### 2. 执行发布

使用内置脚本，传入 token：

```bash
bash scripts/publish.sh <npm_token> [version-bump]
```

**参数：**
- `npm_token`：必填，从 npmjs.com 获取的 token
- `version-bump`：可选 `patch`、`minor`、`major`，自动升级版本号

**示例：**
```bash
# 直接发布当前版本
bash scripts/publish.sh npm_xxxx

# 升级 patch 版本并发布
bash scripts/publish.sh npm_xxxx patch
```

## 手动发布

如果脚本无法满足需求：

```bash
mkdir -p /tmp/npm-cache-sks
npm publish --access=public --cache /tmp/npm-cache-sks \
  --//registry.npmjs.org/:_authToken=<用户提供的token>
```

## 注意事项

- 始终需要沙箱外执行（`require_escalated`），需要网络访问 npm registry
- 如果包名被占用，改用 `@lxchinesszz/<name>` scope
- scope 包首次发布必须加 `--access=public`
- `--cache /tmp/npm-cache-sks` 绕过本地缓存目录权限问题
- 不要将 token 写入 skill 文件，每次由用户提供
