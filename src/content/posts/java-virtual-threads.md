---
title: "深入理解 Java 虚拟线程"
description: "Project Loom 带来的虚拟线程到底解决了什么问题？实际性能对比测试。"
publishDate: 2026-06-25
zone: "学习"
tags: ["Java", "并发"]
heroImage: "/images/hero-banner.webp"
draft: false
---

# 深入理解 Java 虚拟线程

Java 19 引入预览、Java 21 正式转正的虚拟线程（Virtual Threads），是近年来 Java 生态中最重磅的特性之一。它从根本上改变了 Java 并发编程的模型。

## 虚拟线程解决了什么？

传统 Java 并发基于平台线程（Platform Thread），每个线程直接映射到操作系统线程。OS 线程是稀缺资源，创建成本高（栈空间通常 1MB），上下文切换开销大。这导致两个问题：

- **线程池模式**：不敢为每个任务创建独立线程，必须用线程池复用，迫使开发者学习 `ExecutorService`、`Future`、`CompletableFuture` 等抽象。
- **响应式编程**：Vert.x、WebFlux 等框架通过事件驱动避免线程阻塞，但编程模型陡峭，调试困难。

虚拟线程的目标是：让线程像对象一样轻量，可以为每个并发任务创建一个虚拟线程。

## 代码对比

传统线程池写法：

```java
ExecutorService executor = Executors.newFixedThreadPool(10);
for (Task task : tasks) {
    executor.submit(task);
}
```

虚拟线程写法：

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Task task : tasks) {
        executor.submit(task);
    }
}
```

代码几乎一样，但关键在于：虚拟线程是**每个任务一条线程**，不需要估算线程池大小。在高 IO 场景下，虚拟线程会在阻塞时自动挂起并让出 carrier 线程，不浪费 CPU。

## 实际性能测试

我在一台 4 核 8GB 的机器上做了简单测试：模拟 10000 个请求，每个请求包含一次 100ms 的 IO 操作（`Thread.sleep` 模拟）。

| 方案 | 耗时 | 备注 |
|------|------|------|
| 固定线程池 (10) | ~100s | 排队严重 |
| 固定线程池 (100) | ~10s | 调优后 |
| 虚拟线程 | ~1s | 无需调优 |

虚拟线程方案的耗时约等于单次 IO 时间，因为 10000 个虚拟线程基本同时阻塞同时恢复。

## 注意事项

1. **不要池化虚拟线程**：创建虚拟线程几乎没有开销，池化反而增加复杂度
2. **避免 synchronized**：虚拟线程在 `synchronized` 块内无法 yield，可能导致 carrier 线程被固定（pinning）；推荐使用 `ReentrantLock`
3. **ThreadLocal 要节制**：虚拟线程数量可能很大，ThreadLocal 占用的内存会放大
4. **CPU 密集任务不适合**：虚拟线程的优势在于 IO 密集型，CPU 密集任务用平台线程 + 并行流更合适

## 总结

虚拟线程不是让代码跑得更快，而是让资源利用率更高、编程模型更简单。如果你的应用有大量 IO 等待（数据库查询、HTTP 调用、文件读写），迁移到虚拟线程后能看到显著改善。
