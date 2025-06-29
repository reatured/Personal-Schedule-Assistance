# 🗓️ Time Schedule Builder + CS 基础 两周计划（Full Stack Roadmap）

## 🎯 总目标

- 完成 Time Schedule Builder 的后端与前端连接
- 实现用户注册 / 登录 / JWT 验证
- 构建数据库模型，完成 TimeSlot CRUD 功能
- 补充操作系统、文件系统、数据结构等 CS 基础
- 项目部署上线，并完善简历与投递准备
- 准备系统设计与行为面试（System Design & Behavioral Interview）

---

## 🧱 Week 1 - 项目功能开发 + CS 入门

### Day 1 - 项目初始化 + 登录系统
- [ ] 创建 FastAPI 项目文件结构：main.py、routers、models、schemas、database
- [ ] 安装依赖（fastapi, uvicorn, sqlmodel, passlib[bcrypt], python-jose, fastapi-users）
- [ ] 配置 PostgreSQL 数据库连接，并创建基本 User 模型
- [ ] 初始化数据库并测试注册、登录、获取当前用户信息的 API

### Day 2 - TimeSlot 模型 + API
- [ ] 创建 TimeSlot 数据模型（title, start_time, end_time, color, user_id）
- [ ] 建立数据表并关联用户模型
- [ ] 完成 /schedule 接口的创建、读取、删除逻辑
- [ ] 添加依赖注入，实现用户权限控制（只能访问自己的数据）

### Day 3 - 前端连接登录 + 获取数据
- [ ] 使用 React/Next.js 创建登录界面和主页面
- [ ] 设置 JWT 登录逻辑，获取 token 并存储
- [ ] 使用前端连接 `/schedule` API 展示数据
- [ ] 实现新增与删除时间块功能

### Day 4 - 表单与交互优化
- [ ] 添加前后端校验逻辑（表单空值、时间格式、冲突检测）
- [ ] 加入 loading 状态、用户通知、错误提示
- [ ] 实现编辑功能（PUT /schedule/{id}，选做）

### Day 5 - 文件系统基础（CS）
- [ ] 学习文件系统基础概念（read/write、stream、buffer）
- [ ] Node.js 实战练习：递归遍历文件夹，统计文件大小与总数

### Day 6 - 数据结构基础 + LeetCode
- [ ] 学习 Stack、Queue、LinkedList、HashMap 等基础数据结构
- [ ] 用 JavaScript 实现 Stack / Queue 类
- [ ] LeetCode 刷题：Two Sum, Merge Intervals, Valid Parentheses

### Day 7 - 项目整理 & 小结
- [ ] 清理项目结构，优化代码与注释
- [ ] 编写 API 文档 / README
- [ ] 总结经验并写下可优化点，准备部署

---

## 🚀 Week 2 - 部署上线 + CS 强化 + 简历准备

### Day 8 - 项目部署
- [ ] 使用 Railway / Render 部署后端 API（含数据库）
- [ ] 使用 Vercel 部署前端页面
- [ ] 配置 .env 文件与跨域支持，联调测试

### Day 9 - 操作系统基础（CS）
- [ ] 理解进程、线程、同步与异步的区别
- [ ] 实战演练：Node.js 模拟异步写入大文件

### Day 10 - 算法练习 + 中等题挑战
- [ ] 继续刷 Leetcode：Binary Search, LRU Cache, Reverse Linked List

### Day 11 - 数据库原理入门
- [ ] 学习 SQL 查询、索引原理、ORM 映射机制
- [ ] 使用 raw SQL 与 ORM 比较性能

### Day 12 - 项目增强（可选）
- [ ] 增加拖拽排序、复制时间表、到点提醒等高级功能
- [ ] 加入 Notification API 或 Email 提醒模块

### Day 13 - 简历撰写 + 项目描述
- [ ] 使用 STAR 法撰写项目描述
- [ ] 突出全栈能力、问题解决与系统设计思维
- [ ] 简历中加入关键技能词（FastAPI, PostgreSQL, React, JWT 等）

### Day 14 - 投递第一波 + 面试准备启动
- [ ] 完成项目部署、录制 Demo、制作展示图
- [ ] 撰写项目总结与博客文章
- [ ] 开始准备行为面试：整理 5 个 STAR 故事
- [ ] 系统设计准备：阅读系统设计入门资料 + 看 ByteByteGo 视频

---

## ✅ 进阶建议（Week 3 起）
- 开始正式系统设计训练：练习设计 Feed、Scheduler、Notification 系统
- 用 STAR 模型准备行为面试常见问题答案
- 学习 GitHub Actions 自动部署，使用 Docker 打包服务
- 开启第二个全栈项目或继续系统刷题计划

---

## 📌 今日目标（Today's Focus）

- [ ] 完成本地开发环境搭建（后端虚拟环境、依赖安装、数据库连接、.env 配置）
- [ ] 初始化 FastAPI 项目结构
- [ ] 成功运行第一个 API（如 /ping 返回 pong）
- [ ] 阅读 backend-basics.md，理解后端各部分作用
- [ ] 记录遇到的问题与解决方法 