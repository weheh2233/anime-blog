---
title: "Rust 入门笔记：所有权与借用"
description: "Rust 最核心的概念，用通俗的例子理解所有权、移动和借用检查。"
publishDate: 2026-06-15
zone: "学习"
tags: ["Rust", "系统编程"]
heroImage: "/images/gallery-3.webp"
draft: false
---

# Rust 入门笔记：所有权与借用

Rust 的所有权（Ownership）系统是其最独特的语言特性。它无需 GC（垃圾回收）即可保证内存安全，代价是一套编译期规则需要适应。

## 三条核心规则

1. **每个值在 Rust 中都有一个所有者**
2. **同一时间只有一个所有者**
3. **所有者超出作用域时值被销毁**

```rust
{
    let s = String::from("hello");  // s 是所有者
    // 使用 s
}  // 作用域结束，s 被自动释放
```

## 移动语义

与 C++ 的拷贝不同，Rust 默认是移动：

```rust
let s1 = String::from("hello");
let s2 = s1;  // s1 的所有权移动到 s2
// println!("{}", s1);  // 编译错误！s1 已失效
```

这个设计的精妙在于：避免了隐式的深拷贝，又杜绝了 double free。如果你真的需要拷贝，显式调用 `.clone()`：

```rust
let s1 = String::from("hello");
let s2 = s1.clone();  // 显式深拷贝
println!("{} {}", s1, s2);  // 都有效
```

## 借用与引用

函数间传递所有权很麻烦，每次都传完还要返回。借用（Borrowing）解决了这个问题：

```rust
fn calculate_length(s: &String) -> usize {  // & 表示借用
    s.len()  // 借用者只能读，不能改
}  // 借用结束，s 不会释放

let s1 = String::from("hello");
let len = calculate_length(&s1);
println!("{} len = {}", s1, len);  // s1 仍然有效
```

`&` 创建不可变引用，`&mut` 创建可变引用：

```rust
fn append_world(s: &mut String) {
    s.push_str(", world");
}

let mut s = String::from("hello");
append_world(&mut s);
```

## 借用检查器的规则

Rust 编译器的借用检查器严格执行两条规则：

1. **任意时刻只能有一个可变引用，或者多个不可变引用**
2. **引用必须始终有效（不能悬垂）**

```rust
let mut s = String::from("hello");
let r1 = &s;      // OK
let r2 = &s;      // OK，多个不可变引用
let r3 = &mut s;  // 编译错误！已有不可变引用，不能再创建可变引用
```

这条规则在编译期消除了数据竞争（data race）。多线程场景下同样的检查也适用，所以 Rust 能说出"并发恐惧"的口号。

## 生命周期

引用必须关联一个生命周期——值存在的时间范围。大多数情况下编译器的生命周期省略规则会自动推断，但在复杂场景需要显式标注：

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` 表示返回值的生命周期与两个参数中较短的那个一致。

## 学习建议

所有权是 Rust 的第一道门槛。我的经验是先接受规则的约束，不要试图用 C/Java 的思维理解。写两周代码后，你就不再纠结于规则，而是开始欣赏它带来的好处——编译通过即内存安全。
