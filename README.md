# CNFLIX - 免费流媒体播放平台

CNFLIX是一个现代化的流媒体播放平台，提供海量高清影视资源，每日更新，永久免费在线观看。

## 功能特色

- 🎬 **海量影视资源** - 涵盖电影、电视剧、综艺、动漫等各类内容
- 📱 **多端适配** - 支持PC、手机、平板等多种设备
- 🔄 **实时更新** - 每日更新最新影视内容
- 💯 **完全免费** - 无需付费，永久免费观看
- 🎯 **智能推荐** - 根据观看历史推荐个性化内容

## 技术栈

- **前端框架**: Next.js 14
- **UI组件**: Radix UI + Tailwind CSS
- **数据库**: Supabase
- **实时通信**: Supabase Realtime
- **状态管理**: React Hooks
- **类型安全**: TypeScript

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env.local` 文件并配置以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
cnflix-streaming-platform/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── rules/             # 使用说明页面
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   ├── cnflix-logo.tsx   # CNFLIX Logo组件
│   └── ...               # 其他组件
├── lib/                  # 工具库
│   ├── supabase/         # Supabase配置
│   └── game-logic.ts     # 游戏逻辑
├── hooks/                # 自定义Hooks
└── public/               # 静态资源
```

## 主要功能

### 观影体验
- 高清视频播放
- 多语言字幕支持
- 播放历史记录
- 收藏夹功能

### 内容管理
- 分类浏览
- 搜索功能
- 热门推荐
- 最新更新

### 用户系统
- 用户注册登录
- 个人资料管理
- 观看历史
- 个性化推荐

## 部署

### Vercel部署

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署完成

### 其他平台

项目支持部署到任何支持Next.js的平台，如：
- Netlify
- Railway
- DigitalOcean
- AWS

## 贡献

欢迎提交Issue和Pull Request来帮助改进项目。

## 许可证

本项目采用MIT许可证。

## 联系我们

- 官网: [https://www.cnflix.tv](https://www.cnflix.tv)
- 邮箱: support@cnflix.tv

---

© 2025 CNFLIX. All rights reserved.
