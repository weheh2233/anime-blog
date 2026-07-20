---
title: "从零搭建 CI/CD 流水线"
description: "用 GitHub Actions 实现自动测试、构建、部署的完整流程。"
publishDate: 2026-06-10
zone: "编程"
tags: ["DevOps", "GitHub Actions"]
heroImage: "/images/gallery-1.webp"
draft: false
---

# 从零搭建 CI/CD 流水线

持续集成和持续交付是现代软件开发的基础设施。本文用一个实际的前端项目为例，展示如何用 GitHub Actions 搭建完整的 CI/CD 流水线。

## 流水线设计

一条完整的流水线通常包含三个阶段：

- **CI 阶段**：代码推送后自动运行 lint、类型检查、单元测试
- **构建阶段**：通过后构建生产产物
- **CD 阶段**：将构建产物部署到目标环境

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

## 缓存优化

流水线速度直接影响开发体验。GitHub Actions 的 `actions/cache` 可以显著加速依赖安装：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

`hashFiles` 对 lock 文件生成哈希，只有依赖变化时才重新下载。配合 `npm ci` 的 `--prefer-offline` 标志，二次运行能节省 60% 以上的时间。

## 多环境部署

生产环境和预览环境应该分开管理。对于 PR 分支，可以自动部署到预览环境并留下评论：

```yaml
deploy-preview:
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  steps:
    - run: echo "Deploying preview for PR #${{ github.event.number }}"
    # 实际部署命令
```

主分支推送则触发生产部署，并附加版本标签。通过 GitHub Environments 可以配置审批流程，生产环境部署需要手动确认，增加安全 gate。

## 常见问题

### 密钥管理

使用 GitHub Secrets 存储敏感信息，不要在 YAML 中硬编码。部署密钥、API Token、环境变量都通过 `${{ secrets.XXX }}` 引用。

### 失败通知

流水线失败后及时通知团队很重要。可以用 Slack/GitHub Actions 的 Webhook 通知功能，在 `on:failure` 条件下发送告警。

## 总结

CI/CD 流水线的价值在于自动化重复劳动、减少人为失误、加快反馈循环。从简单的 lint + test 开始，逐步加部署、通知、审批，迭代完善即可。
