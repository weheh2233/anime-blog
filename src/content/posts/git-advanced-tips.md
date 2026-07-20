---
title: "Git 进阶：你可能不知道的 10 个实用技巧"
description: "从 interactive rebase 到 bisect，让你的 Git 操作更加游刃有余。"
publishDate: 2026-07-03
zone: "编程"
tags: ["Git", "工具"]
heroImage: "/images/gallery-2.webp"
draft: false
---

# Git 进阶：你可能不知道的 10 个实用技巧

用的时间越长，越觉得 Git 的设计精妙。下面这些技巧是我日常工作中最常用的，分享给大家。

## 1. 交互式变基（Interactive Rebase）

```bash
git rebase -i HEAD~3
```

这个命令让你对最近 3 次提交进行重新编排。`pick` 保留、`reword` 改信息、`squash` 合并到上一个、`drop` 删除。提交历史混乱时，这是整理的最强工具。

## 2. 二分查找 Bug（Bisect）

```bash
git bisect start
git bisect bad          # 当前版本有 bug
git bisect good v1.0    # v1.0 没有 bug
```

Git 会用二分法帮你找到第一个引入 bug 的提交。每次 Git 会 checkout 一个中间提交，你测试后标记 `git bisect good` 或 `git bisect bad`，通常 10 步内就能定位到问题。

## 3. 部分暂存

```bash
git add -p
```

这个命令交互式地选择要暂存的代码块。当你一个文件改了多处，只想提交其中一部分时，`-p` 比 `git add .` 好太多。可以按 `y`/`n`/`s`（拆分）/`e`（手动编辑）来控制。

## 4. 修复旧提交

```bash
git commit --fixup <SHA>
git rebase -i --autosquash <base>
```

发现某个提交有 bug 时，用 `--fixup` 创建一个标记提交，然后 `--autosquash` 会在 rebase 时自动把修复提交放到正确位置并 squash。

## 5. 查看文件变更历史

```bash
git log -p --follow <file>
git blame <file>
```

`git log -p` 展示文件每次变更的 diff，`git blame` 标注每行是谁在什么时候改的。排查问题时两个命令配合使用。

## 6. 交互式拣选（Cherry-Pick）

```bash
git cherry-pick <SHA1> <SHA3>
```

只想要某个分支上的特定提交，而不是整个合并。配合 `-n` 参数可以暂不提交，继续拼装想要的变更。

## 7. 可搜索的日志输出

```bash
git log --grep="fix" --since="2026-01-01" --author="zhang"
git log -S "特定字符串"  # 搜索新增或删除该字符串的提交
```

`-S`（pickaxe）比 `--grep` 搜索正文更精确，它找的是变更了该字符串的提交，而不仅仅是提交信息中包含。

## 8. Stash 进阶

```bash
git stash push -m "WIP: 修复登录bug"
git stash list
git stash apply stash@{1}
```

`-m` 给 stash 加描述方便识别。`git stash push -p` 可以只暂存部分文件。配合 `git stash show -p` 可以查看某个 stash 的具体改动。

## 9. 配置别名

将高频命令缩短：

```bash
git config --global alias.co checkout
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.graph 'log --graph --oneline --all'
```

之后再输入 `git graph` 就能看到漂亮的提交历史图。

## 10. Worktree 并行开发

```bash
git worktree add ../hotfix hotfix-branch
```

在不影响当前工作目录的情况下，checkout 另一个分支到独立目录。修复紧急 bug 时不需要 stash 当前进度，两个目录互不干扰，可以同时工作。

## 总结

掌握这些技巧后，Git 就不再只是 `add`、`commit`、`push` 三板斧。它是一套强大的版本控制工具箱，每种场景都有对应的专用工具。
