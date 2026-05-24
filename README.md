# SKS 使用指南

> SKS — AI Skills 包管理器
> GitHub-based AI Skill Registry + Symlink Projection System

---

## 一、普通用户使用指南

普通用户只需要从 Registry 安装 Skill，然后自动同步到 AI 工具即可使用。

### 1. 安装 SKS

```bash
# 全局安装
npm install -g .

# 验证安装
sks --version
```

### 2. 常用命令

#### 搜索 Skill
```bash
sks search java          # 搜索关键词
sks search               # 列出全部 Skill
```

#### 安装 Skill
```bash
sks install java-expert          # 安装并自动同步
sks install java-expert --force  # 强制重装
```

#### 查看已安装的 Skill
```bash
sks list
```

#### 删除 Skill
```bash
sks remove java-expert
```

#### 手动同步（修复 symlink）
```bash
sks sync          # 同步所有 Skill 到 AI 工具
sks sync --prune  # 同时清理孤立的 symlink
```

### 3. 工作流程

```
搜索 Skill → 安装 Skill → 自动同步 → 在 AI 工具中使用
```

---

## 二、开发者使用指南

开发者可以创建自己的 Skill，本地开发调试后发布到 Registry。

### 1. 创建新 Skill

```bash
mkdir my-skill && cd my-skill
sks init
```

按提示填写：
- Skill name: 技能名称（如 `java-expert`）
- Version: 版本号（默认 `1.0.0`）
- Description: 描述
- Author: 作者
- Tags: 标签（如 `java,spring,backend`）
- Targets: 同步目标（如 `claude,codex`）

### 2. 编辑 Skill 内容

编辑生成的 `prompt.md`，写入 AI 提示词：

```markdown
你是一个 Java 高级开发专家。

## 能力

- 精通 Spring Boot、Spring Cloud 微服务架构
- 熟悉 MyBatis Plus、JPA 数据访问层
- 掌握 Kafka、RabbitMQ 消息队列

## 工作方式

1. 分析需求，给出最佳实践方案
2. 编写高质量、可维护的代码
3. 提供详细的代码注释和文档
```

### 3. 本地开发调试

```bash
# 链接到本地 SKS（开发模式）
sks link .

# 同步到 AI 工具
sks sync
```

> 链接后，修改本地文件会立即生效，无需重新安装。

### 4. 发布到 Registry

```bash
# 登录 GitHub
sks login

# 发布（通过 Pull Request）
sks publish

# 仅校验，不发布
sks publish --dry-run
```

发布后会输出 PR 链接，等待审核通过即可。

### 5. 取消开发链接

```bash
sks unlink my-skill
sks sync
```

---

## 三、命令速查表

### 用户侧命令

| 命令 | 别名 | 说明 |
|------|------|------|
| `sks install <skill>` | `sks i` | 安装 Skill |
| `sks list` | `sks ls` | 列出已安装 Skill |
| `sks search [keyword]` | `sks s` | 搜索 Registry |
| `sks remove <skill>` | `sks rm` | 删除 Skill |
| `sks sync` | - | 同步 symlinks |

### 开发者侧命令

| 命令 | 说明 |
|------|------|
| `sks init` | 初始化新 Skill |
| `sks link <path>` | 链接本地 Skill |
| `sks unlink <skill>` | 取消链接 |
| `sks login` | GitHub 登录 |
| `sks publish` | 发布到 Registry |

### 系统命令

| 命令 | 说明 |
|------|------|
| `sks doctor` | 系统健康检查 |
| `sks config list` | 查看配置 |
| `sks config get <key>` | 获取配置项 |
| `sks config set <key> <value>` | 设置配置项 |

---

## 四、配置说明

配置文件路径：`~/.sks/config.json`

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `registryUrl` | Registry 地址 | `https://raw.githubusercontent.com/sks-hub/sks-registry/main/index.json` |
| `githubToken` | GitHub Token | - |
| `syncTargets` | 全局同步目标 | `["claude", "codex", "cursor"]` |
| `cacheMaxAge` | 缓存有效期（秒） | `3600` |

### 常用配置命令

```bash
# 设置 GitHub Token
sks config set githubToken ghp_xxxxxxxxxxxx

# 修改缓存有效期为 2 小时
sks config set cacheMaxAge 7200

# 使用私有 Registry
sks config set registryUrl https://raw.githubusercontent.com/my-org/my-registry/main/index.json
```

---

## 五、常见问题

### Q: 安装后 AI 工具看不到 Skill？

检查：
```bash
# 1. 查看 symlink 是否存在
ls -la ~/.claude/skills/

# 2. 检查 targets 是否包含 claude
cat ~/.sks/skills/<skill-name>/sks.yaml
```

### Q: 出现 broken symlink？

```bash
sks sync        # 自动修复
sks sync --prune # 同时清理孤立 symlink
```

### Q: 如何测试新版本？

```bash
# 链接新版本（覆盖已安装版本）
sks link /path/to/new-version
sks sync

# 测试完成后恢复
sks unlink <skill>
sks sync
```

---

## 六、Skill 结构

```
skill-name/
├── sks.yaml      # 必须：描述文件
├── prompt.md     # 必须：提示词内容
├── README.md     # 推荐：说明文档
└── tools/        # 可选：附加工具
```

### sks.yaml 示例

```yaml
name: java-expert
version: 1.0.0
description: Java 高级开发专家
author: tongzhi
tags:
  - java
  - spring
  - backend
targets:
  - claude
  - codex
```
