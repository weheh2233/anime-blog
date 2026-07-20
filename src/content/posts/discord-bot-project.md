---
title: "做了个 Discord 机器人玩"
description: "用 Node.js 写了个 Discord Bot，可以播放音乐、查天气、翻译消息。"
publishDate: 2026-06-22
zone: "编程"
tags: ["Node.js", "项目"]
heroImage: "/images/gallery-1.webp"
draft: false
---

# 做了个 Discord 机器人玩

前段时间在 Discord 服务器里闲逛，萌生了自己写个机器人的想法。前后花了大概一周，实现了一个功能还算丰富的中文 Discord Bot。

## 技术选型

机器人的核心是 **discord.js** 库，这是 Node.js 生态中最成熟的 Discord API 封装。使用 v14 版本，支持 Slash Command 和 Modal 交互。

```bash
npm install discord.js @discordjs/voice dotenv
```

项目结构按照功能模块组织：

```
src/
  commands/     # 斜杠命令定义
  events/       # 事件监听
  services/     # 业务逻辑（音乐、天气等）
  utils/        # 工具函数
index.js        # 入口文件
```

## 功能实现

### 音乐播放

音乐功能是最复杂的模块，使用了 `@discordjs/voice` 连接语音频道，配合 `ytdl-core` 从 YouTube 拉取音频流。

```javascript
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');

async function play(interaction, url) {
  const connection = joinVoiceChannel({
    channelId: interaction.member.voice.channelId,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  });
  const stream = ytdl(url, { filter: 'audioonly' });
  const resource = createAudioResource(stream);
  const player = createAudioPlayer();
  player.play(resource);
  connection.subscribe(player);
}
```

主要实现了播放、暂停、跳过、队列管理、音量调节等功能。

### 天气查询

调用了和风天气的 API，支持城市名模糊搜索。查询结果会渲染成一个精美的 Embed 卡片，包含温度、湿度、风速和未来三天的天气预报。

### 翻译功能

集成了翻译 API，支持中、英、日、韩四种语言的互译。使用 `!translate <目标语言> <文本>` 的格式触发，适合在聊天中快速翻译外文消息。

## 部署与运维

机器人部署在阿里云轻量服务器上，使用 PM2 进行进程管理：

```bash
npm install -g pm2
pm2 start index.js --name discord-bot
pm2 save
pm2 startup
```

设置了自动重启策略，内存占用超过 200MB 时自动重启。同时通过 Webhook 将错误日志发送到专门的日志频道，方便排查问题。

## 收获

这个项目的最大收获是深入了解了 Discord API 的设计哲学和 Node.js 流式处理的实战用法。社区生态非常活跃，`discord.js` 的文档和类型定义质量很高，开发体验不错。
