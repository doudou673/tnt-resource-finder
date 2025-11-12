# 时代少年团资源搜索系统

一个专为时代少年团（TNT）设计的全平台资源搜索和管理系统。

## 🎯 功能特性

### 🔍 智能搜索
- **全平台搜索**: 支持哔哩哔哩、抖音等主流平台
- **多维度筛选**: 按成员、活动、资源类型、平台筛选
- **实时搜索**: 支持本地数据库和在线实时搜索
- **智能识别**: 自动识别资源和时代少年团成员的关联性

### 📊 数据管理
- **成员管理**: 完整的7位成员信息（马嘉祺、丁程鑫、宋亚轩、刘耀文、张真源、严浩翔、贺峻霖）
- **活动记录**: 演唱会、综艺节目、专辑发布等活动信息
- **资源分类**: 视频、音频、电影等资源类型管理
- **去重机制**: 智能识别和过滤重复资源

### 🛠 技术特性
- **高性能搜索**: 数据库索引优化，亚秒级响应
- **响应式设计**: 支持桌面和移动设备
- **实时更新**: 自动抓取最新资源
- **API接口**: 完整的RESTful API

## 🏗 技术架构

### 前端
- **框架**: Next.js 15 + React 19
- **UI组件**: shadcn/ui + Tailwind CSS
- **状态管理**: React Hook Form + Zod
- **类型安全**: TypeScript

### 后端
- **数据库**: PostgreSQL + Drizzle ORM
- **API**: Next.js API Routes
- **爬虫**: Axios + Cheerio + Playwright
- **验证**: Zod Schema Validation

### 部署
- **平台**: Vercel (推荐) 或 Docker
- **数据库**: PostgreSQL (Vercel Postgres 或 自建)
- **定时任务**: GitHub Actions

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd tnt-resource-finder

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
# 设置 DATABASE_URL 和其他配置
```

### 2. 数据库设置

```bash
# 启动PostgreSQL (使用Docker)
npm run db:up

# 生成并应用数据库迁移
npm run db:push

# 填充初始数据 (成员和活动)
npm run db:seed
```

### 3. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
# http://localhost:3000/dashboard (资源搜索界面)
```

## 📋 可用脚本

### 数据库管理
```bash
npm run db:push      # 推送数据库架构变更
npm run db:studio    # 打开数据库管理界面
npm run db:seed      # 填充初始数据
npm run db:reset     # 重置数据库
```

### 爬虫管理
```bash
npm run scrapers:run  # 运行所有爬虫抓取资源
```

### 开发服务器
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
```

## 🎭 使用指南

### 基本搜索

1. **简单搜索**: 在搜索框中输入关键词
   ```
   马嘉祺
   时代少年团 演唱会
   要你管 MV
   ```

2. **高级筛选**: 点击"高级筛选"展开更多选项
   - 选择资源类型（视频/音频/电影）
   - 选择特定成员
   - 选择活动
   - 选择平台
   - 启用在线搜索

3. **查看结果**: 支持列表视图和卡片视图切换
   - 点击"查看"按钮打开资源链接
   - 有下载链接时显示"下载"按钮

### 管理面板

访问 `/dashboard` 并切换到"管理面板"标签页：

- **数据统计**: 查看资源数量统计
- **数据管理**: 导出数据、清理重复、手动抓取

## 🔧 配置说明

### 环境变量

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/tnt_resources

# 认证配置
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### 爬虫配置

爬虫配置在 `lib/scrapers/` 目录中：

- **延迟时间**: 默认2-3秒请求间隔，避免被限制
- **重试机制**: 指数退避重试策略
- **用户代理**: 旋转User-Agent避免检测
- **平台配置**: 每个平台独立的爬虫实现

## 📊 数据结构

### 核心表结构

#### members (成员表)
- `id`: 主键
- `name`: 真实姓名
- `stageName`: 艺名
- `groupRole`: 队内角色

#### events (活动表)
- `id`: 主键
- `title`: 活动标题
- `eventDate`: 活动日期
- `description`: 活动描述
- `venue`: 活动地点

#### resources (资源表)
- `id`: 主键
- `title`: 资源标题
- `url`: 资源链接
- `downloadUrl`: 下载链接
- `resourceType`: 资源类型
- `platform`: 来源平台
- `memberId`: 关联成员
- `eventId`: 关联活动

## 🚀 部署指南

### Vercel部署 (推荐)

1. **连接GitHub仓库**
   - 在Vercel中导入项目
   - 连接GitHub仓库

2. **配置环境变量**
   - 在Vercel控制台添加环境变量
   - 添加 `DATABASE_URL` (使用Vercel Postgres)

3. **数据库设置**
   - 创建Vercel Postgres数据库
   - 运行数据库迁移

4. **部署完成**
   - 自动部署到 `.vercel.app` 域名
   - 自动配置定时任务

### Docker部署

```bash
# 构建镜像
npm run docker:build

# 启动服务
npm run docker:up

# 查看日志
npm run docker:logs
```

## ⚡ 定时任务

系统配置了自动抓取定时任务：

- **频率**: 每天凌晨2点 (UTC时间)
- **任务**: 自动抓取各平台最新资源
- **触发**: GitHub Actions

### 手动触发

```bash
# 本地运行
npm run scrapers:run

# GitHub Actions手动触发
# 在仓库Actions页面手动运行工作流
```

## 🛡 安全考虑

### 爬虫安全
- **请求限制**: 合理的请求频率限制
- **用户代理**: 使用标准浏览器User-Agent
- **错误处理**: 完善的错误处理和重试机制
- **数据验证**: 严格的输入验证和清理

### 数据安全
- **SQL注入防护**: 使用参数化查询
- **XSS防护**: 输出内容转义
- **CSRF防护**: 跨站请求伪造防护
- **访问控制**: 基于角色的权限管理

## 🔄 API文档

### 搜索接口

```http
GET /api/search?query=关键词&type=video&member=成员ID
```

**参数**:
- `query`: 搜索关键词 (必需)
- `type`: 资源类型 (可选)
- `member`: 成员ID (可选)
- `event`: 活动ID (可选)
- `platform`: 平台 (可选)
- `searchOnline`: 是否在线搜索 (可选)
- `limit`: 返回数量限制 (默认20)
- `offset`: 分页偏移量 (默认0)

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 成员接口

```http
GET /api/members?search=马嘉祺
```

### 活动接口

```http
GET /api/events?search=演唱会
```

### 爬虫接口

```http
POST /api/scrape
```

**请求体**:
```json
{
  "query": "马嘉祺",
  "platforms": ["bilibili", "douyin"],
  "maxResults": 20
}
```

## 🎨 自定义开发

### 添加新平台爬虫

1. 创建新的爬虫类 `lib/scrapers/newplatform.ts`
2. 继承 `BaseScraperImpl` 类
3. 实现必要方法：`search`, `extractResourceDetails`, `isValidUrl`
4. 在 `ScraperManager` 中注册新平台

### 添加新功能

系统采用模块化设计，易于扩展：

- **新页面**: 在 `app/` 目录下添加路由
- **新组件**: 在 `components/` 目录下添加组件
- **新API**: 在 `app/api/` 目录下添加API端点

## 🐛 故障排除

### 常见问题

**Q: 搜索没有结果？**
A: 检查数据库是否已填充数据，尝试运行 `npm run db:seed`

**Q: 爬虫运行失败？**
A: 检查网络连接，某些平台可能有反爬虫限制

**Q: 数据库连接失败？**
A: 检查 `DATABASE_URL` 环境变量配置

**Q: 页面加载很慢？**
A: 检查数据库索引，运行 `npm run db:push` 确保索引正确

### 日志查看

```bash
# 开发服务器日志
npm run dev

# 数据库日志
npm run db:logs

# Docker日志
npm run docker:logs
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目仅供学习和研究使用，请遵守相关平台的robots.txt和服务条款。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建Issue
- 发送邮件
- 加入讨论群

---

**⚠️ 免责声明**: 本系统仅供学习和研究使用，请尊重内容创作者的版权。所有资源版权归原作者和平台所有。