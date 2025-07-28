# 现代化UI组件库

ChatGPTBox的现代化UI组件库，提供了一套完整的现代化界面组件，包括毛玻璃效果、流畅动画、渐变色彩和微交互。

## 组件概览

### 🎨 设计系统
- **设计令牌系统** - 统一的颜色、字体、间距和动画变量
- **主题系统** - 支持浅色、深色和自动主题切换
- **动画系统** - 丰富的动画效果和过渡

### 🧩 核心组件

#### ModernPopup - 现代化弹出窗口
现代化的扩展弹出窗口，具有毛玻璃效果和流畅的标签页导航。

```jsx
import { ModernPopup } from '../components/ModernUI'

<ModernPopup
  activeTab="general"
  onTabChange={setActiveTab}
  tabs={[
    { id: 'general', label: '常规', icon: '⚙️' },
    { id: 'advanced', label: '高级', icon: '🔬' }
  ]}
>
  <div className="tab-content">
    {/* 标签页内容 */}
  </div>
</ModernPopup>
```

#### ModernChatBox - 现代化聊天框
具有毛玻璃效果的浮动聊天框，支持拖拽、最小化和实时状态指示。

```jsx
import { ModernChatBox } from '../components/ModernUI'

<ModernChatBox
  messages={messages}
  onSendMessage={handleSendMessage}
  onClose={handleClose}
  onMinimize={handleMinimize}
  isGenerating={isGenerating}
  status="online"
  statusText="ChatGPT Ready"
/>
```

#### ModernSelectionToolbar - 现代化选择工具栏
现代化的文本选择工具栏，具有优雅的动画效果和工具提示。

```jsx
import { ModernSelectionToolbar } from '../components/ModernUI'

<ModernSelectionToolbar
  tools={[
    {
      id: 'translate',
      icon: <TranslateIcon />,
      label: '翻译',
      shortcut: '1'
    }
  ]}
  selectedText="选中的文本"
  position={{ x: 100, y: 200 }}
  onToolClick={handleToolClick}
  isVisible={true}
/>
```

#### ModernSidebar - 现代化侧边栏
功能丰富的侧边栏，支持对话管理、搜索和虚拟滚动。

```jsx
import { ModernSidebar } from '../components/ModernUI'

<ModernSidebar
  conversations={conversations}
  activeConversationId={activeId}
  onConversationSelect={handleSelect}
  onConversationDelete={handleDelete}
  onConversationRename={handleRename}
  onNewConversation={handleNew}
  isOpen={true}
  width={380}
/>
```

## 🎯 特性

### 现代化设计
- **毛玻璃效果** - 使用backdrop-filter实现现代化的毛玻璃背景
- **渐变色彩** - 丰富的渐变色彩系统
- **圆角设计** - 统一的圆角设计语言
- **微妙阴影** - 层次分明的阴影效果

### 流畅动画
- **入场动画** - 组件出现时的优雅动画
- **交互反馈** - 悬停、点击等交互的即时反馈
- **状态过渡** - 平滑的状态切换动画
- **性能优化** - 硬件加速和动画降级

### 响应式设计
- **移动端适配** - 完全响应式设计
- **触摸友好** - 适配触摸交互
- **断点管理** - 智能的断点系统

### 可访问性
- **键盘导航** - 完整的键盘导航支持
- **屏幕阅读器** - ARIA标签和语义化HTML
- **高对比度** - 支持高对比度模式
- **减少动画** - 尊重用户的动画偏好

## 🛠️ 使用方法

### 1. 导入样式
```scss
// 导入完整的现代化UI样式
@import '../styles/modern-ui.scss';
```

### 2. 使用组件
```jsx
// 导入需要的组件
import { 
  ModernPopup, 
  ModernChatBox, 
  ModernSelectionToolbar,
  ModernSidebar 
} from '../components/ModernUI'

// 在你的组件中使用
function MyComponent() {
  return (
    <ModernChatBox
      messages={messages}
      onSendMessage={handleSendMessage}
      // ... 其他props
    />
  )
}
```

### 3. 主题配置
```jsx
// 设置主题
document.documentElement.dataset.theme = 'dark' // 'light' | 'dark' | 'auto'
```

## 🎨 自定义样式

### CSS变量
所有组件都使用CSS变量，可以轻松自定义：

```css
:root {
  --primary-500: #your-color;
  --radius-lg: 12px;
  --duration-normal: 300ms;
}
```

### 主题扩展
```scss
// 自定义主题
[data-theme='custom'] {
  --theme-bg-primary: #your-bg-color;
  --theme-text-primary: #your-text-color;
  // ... 其他变量
}
```

## 📱 响应式断点

```scss
// 移动端
@media (max-width: 768px) {
  // 移动端样式
}

// 平板
@media (max-width: 1024px) {
  // 平板样式
}
```

## ⚡ 性能优化

### 动画性能
- 使用`transform`和`opacity`进行动画
- 启用硬件加速
- 支持`prefers-reduced-motion`

### 虚拟滚动
侧边栏组件支持虚拟滚动，可以处理大量对话记录：

```jsx
<ModernSidebar
  conversations={largeConversationList}
  // 自动启用虚拟滚动
/>
```

## 🔧 开发指南

### 添加新组件
1. 在`src/components/`下创建组件文件夹
2. 创建`.jsx`和`.scss`文件
3. 在`src/components/ModernUI/index.js`中导出
4. 在`src/styles/modern-ui.scss`中导入样式

### 样式规范
- 使用CSS变量而不是硬编码值
- 遵循BEM命名规范
- 使用语义化的类名
- 支持主题切换

### 动画规范
- 使用设计令牌中定义的动画变量
- 提供动画降级选项
- 考虑性能影响

## 🐛 故障排除

### 样式不生效
确保导入了完整的样式文件：
```scss
@import '../styles/modern-ui.scss';
```

### 主题切换问题
检查`data-theme`属性是否正确设置：
```jsx
document.documentElement.dataset.theme = theme
```

### 动画性能问题
启用硬件加速：
```css
.your-component {
  transform: translateZ(0);
  will-change: transform;
}
```

## 📄 许可证

本组件库遵循与ChatGPTBox相同的许可证。
