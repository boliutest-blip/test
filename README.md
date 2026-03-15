# excaliapp

一个基于 Tauri 2、React、TypeScript 和 Excalidraw 的本地桌面应用，用来浏览、创建、编辑和保存本地 `.excalidraw` 文件。

## 功能

当前项目已实现的核心功能：

- 打开本地工作目录并扫描其中的 `.excalidraw` 文件
- 在左侧侧边栏展示文件列表，并支持切换当前文件
- 在主编辑区内嵌 Excalidraw 编辑器，直接查看和编辑图表
- 支持新建 `Untitled.excalidraw` 文件
- 支持 `Ctrl + S` / `Cmd + S` 手动保存
- 支持通过原生菜单触发“打开目录”和“保存”
- 切换文件或切换目录前自动保存当前未保存内容
- 对脏文档执行定时自动保存
- 启动时恢复上次打开的目录和文件
- 提供无目录、空目录、加载失败、保存失败等状态提示

## 启动方式

### 1. 安装依赖

```bash
npm install
```

### 2. 启动桌面应用开发环境

```bash
npm run tauri dev
```

该命令会启动 Vite 开发服务器，并同时启动 Tauri 桌面应用。

### 3. 仅启动前端开发服务器

```bash
npm run dev
```

默认使用 Vite 开发服务器，适合单独调试前端界面。

## 常用命令

### 运行测试

```bash
npm run test
```

### 构建前端产物

```bash
npm run build
```

### 预览前端构建结果

```bash
npm run preview
```

### 构建桌面应用

```bash
npm run tauri build
```

## 技术栈

- Tauri 2
- Rust
- React
- TypeScript
- Vite
- Excalidraw React SDK
