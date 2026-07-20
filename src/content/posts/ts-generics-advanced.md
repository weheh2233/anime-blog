---
title: "TypeScript 泛型高级用法笔记"
description: "条件类型、模板字面量类型、infer 关键字……泛型远比你想象的强大。"
publishDate: 2026-07-08
heroImage: "/images/hero-banner.webp"
zone: "学习"
tags: ["TypeScript", "前端"]
draft: false
---

# TypeScript 泛型高级用法笔记

TypeScript 的泛型远不止 `Array<T>` 和 `Promise<T>`。条件类型、映射类型、模板字面量类型组合起来，能表达极其精确的类型约束。本文记录几个最有用的高级模式。

## 条件类型与 infer

条件类型根据条件选择不同的类型分支，`infer` 则从类型中"提取"出信息：

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取 Promise 内部类型
type Unwrap<T> = T extends Promise<infer U> ? U : T;

type A = Unwrap<Promise<string>>;  // string
type B = Unwrap<number>;           // number
```

`infer` 在嵌套类型中尤其强大，可以逐层深入到复杂类型的内部。

## 映射类型

映射类型让你基于已有类型创建新类型，通常配合 keyof 使用：

```typescript
// 把所有属性变为可选
type Partial<T> = { [K in keyof T]?: T[K] };

// 把所有属性变为只读
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// 选中部分属性
type Pick<T, K extends keyof T> = { [P in K]: T[P] };

// 排除部分属性
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

以下是实际开发中的实用场景——将下划线命名转为驼峰命名：

```typescript
type CamelCase<S extends string> =
  S extends `${infer P}_${infer Q}`
    ? `${P}${CamelCase<Capitalize<Q>>}`
    : S;

type User = { first_name: string; last_name: string };
type CamelUser = {
  [K in keyof User as CamelCase<K>]: User[K];
  // { firstName: string; lastName: string; }
};
```

## 模板字面量类型

TypeScript 4.1 引入的模板字面量类型，能基于字符串模式创建精确的类型：

```typescript
type EventName = `on${Capitalize<string>}`;
// 所有以 "on" 开头且首字母大写的字符串

type Color = "red" | "green" | "blue";
type Size = "sm" | "md" | "lg";
type CSSClass = `${Color}-${Size}`;
// "red-sm" | "red-md" | "red-lg" | "green-sm" | ...
```

配合条件类型和 infer，可以解析路由参数：

```typescript
type ExtractParams<T extends string> =
  T extends `${string}/:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<Rest>]: string }
    : T extends `${string}/:${infer Param}`
      ? { [K in Param]: string }
      : {};

type RouteParams = ExtractParams<"/users/:id/posts/:postId">;
// { id: string; postId: string; }
```

## 实用模式：深度 Partial

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

适用于处理部分更新请求体的场景，递归地将所有嵌套属性变为可选。

## 实用模式：类型安全的 Builder

```typescript
class QueryBuilder<T extends Record<string, any>> {
  private conditions: string[] = [];

  where<K extends keyof T>(key: K, value: T[K]): this {
    this.conditions.push(`${String(key)} = ${value}`);
    return this;
  }

  build(): string {
    return this.conditions.join(" AND ");
  }
}

const qb = new QueryBuilder<{ name: string; age: number }>();
qb.where("name", "Alice");  // 类型安全
// qb.where("name", 42);    // 编译错误！
```

Builder 模式配合泛型约束，能提供 IDE 级别的最优补全体验。

## 总结

TypeScript 的高级类型系统本质上是一门小型函数式语言。掌握这些模式后，你可以用类型来描述业务规则，让无效状态在编译期就被排除。写好泛型的关键是：从具体的使用场景推导类型约束，而不是为了炫技而过度设计。
