---
title: "Spring Boot 3.x 新特性一览"
description: "记录 Spring Boot 3.x 的关键新特性，包括虚拟线程、GraalVM 原生编译等。"
publishDate: 2026-07-18
zone: "学习"
tags: ["Spring Boot", "Java"]
heroImage: "/images/gallery-2.webp"
draft: false
---

# Spring Boot 3.x 新特性一览

Spring Boot 3.0 于 2022 年底发布，是自 2.0 以来最大的一次升级。到了 3.4 版本（截至 2026 年），生态已经非常成熟。本文梳理关键新特性。

## Java 17+ 基线

Spring Boot 3 最低要求 Java 17，这意味着正式支持密封类、模式匹配、Records、Switch 表达式等现代 Java 特性。

```java
// 用 Record 定义 DTO
public record UserResponse(Long id, String name, String email) {}

// 在控制器中直接使用
@GetMapping("/users/{id}")
public UserResponse getUser(@PathVariable Long id) {
    return userService.findById(id);
}
```

Record 天然适合作为 DTO，省去了手动编写 equals、hashCode、toString 的繁琐。

## 虚拟线程支持

Spring Boot 3.2+ 引入了对虚拟线程的一等支持，只需一行配置即可切换：

```properties
spring.threads.virtual.enabled=true
```

配置后，Tomcat 请求处理线程和 `@Async` 执行器都会自动使用虚拟线程。在高 IO 场景下吞吐量提升显著，而且代码无需任何改动。

```java
@Configuration
public class VirtualThreadConfig {
    @Bean
    public TaskExecutor taskExecutor() {
        return new SimpleAsyncTaskExecutor().withVirtualThreads();
    }
}
```

## GraalVM 原生编译

Spring Boot 3 正式引入 **AOT (Ahead-of-Time)** 编译支持，通过 GraalVM 将应用编译为原生可执行文件。启动时间从几秒降到几十毫秒，内存占用减少约 70%。

```xml
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
</plugin>
```

目前 Spring 的 AOT 支持已经覆盖了大部分常用功能，包括 JPA、Security、Actuator 等。不过需要注意：动态代理、反射、CGLIB 等需要提前在提示文件中注册。

## 声明式 HTTP 客户端

```java
@HttpExchange("/api/users")
public interface UserClient {
    @GetExchange("/{id}")
    UserResponse getUser(@PathVariable Long id);
}
```

替代 OpenFeign 和 RestTemplate，不再需要引入额外的库。接口定义清晰，配合虚拟线程效果更佳。

## 更完善的配置管理

- **@ConfigurationProperties 的 Validation**：支持 Jakarta Validation API，在属性绑定阶段即校验
- **Docker Compose 集成**：`spring-boot-docker-compose` 在开发时自动启动依赖的容器
- **服务连接**：`ConnectionDetails` 抽象，统一管理数据库、Redis、RabbitMQ 等中间件的连接信息

## 总结

Spring Boot 3 的演进方向很清晰：拥抱现代 Java、拥抱云原生。虚拟线程解决了 IO 密集型场景的容量问题，GraalVM 原生编译让微服务启动时间不再是痛点。如果你还在用 2.x，建议尽早规划迁移。
