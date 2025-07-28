# 设计文档

## 概述

ChatGPTBox Chrome扩展的现代化UI/UX重新设计将采用当代设计语言，融合毛玻璃效果、流畅动画、渐变色彩和微交互，创造出既美观又实用的用户界面。设计将保持功能完整性的同时，大幅提升视觉吸引力和用户体验。

## 架构

### 设计系统架构

```
现代化设计系统
├── 核心设计令牌 (Design Tokens)
│   ├── 颜色系统 (Color System)
│   ├── 字体系统 (Typography)
│   ├── 间距系统 (Spacing)
│   └── 动画系统 (Animation)
├── 组件库 (Component Library)
│   ├── 基础组件 (Base Components)
│   ├── 复合组件 (Composite Components)
│   └── 布局组件 (Layout Components)
└── 主题系统 (Theme System)
    ├── 浅色主题 (Light Theme)
    ├── 深色主题 (Dark Theme)
    └── 自动主题 (Auto Theme)
```

### UI组件层次结构

```
UI组件架构
├── 弹出窗口 (Popup)
│   ├── 现代化标签页导航
│   ├── 设置面板卡片
│   └── 底部信息栏
├── 内容脚本界面 (Content Script UI)
│   ├── 浮动聊天框
│   ├── 选择工具栏
│   └── 侧边栏面板
├── 独立页面 (Standalone Pages)
│   ├── 对话页面
│   └── 设置页面
└── 共享组件 (Shared Components)
    ├── 按钮系统
    ├── 输入框系统
    ├── 卡片系统
    └── 通知系统
```

## 组件和接口

### 1. 现代化设计令牌系统

#### 颜色系统
```scss
// 主色调 - 基于现代渐变和品牌色
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
$success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
$warning-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
$error-gradient: linear-gradient(135deg, #fa709a 0%, #fee140 100%);

// 中性色调 - 支持深浅主题
$neutral-50: #fafafa;
$neutral-100: #f5f5f5;
$neutral-200: #e5e5e5;
$neutral-300: #d4d4d4;
$neutral-400: #a3a3a3;
$neutral-500: #737373;
$neutral-600: #525252;
$neutral-700: #404040;
$neutral-800: #262626;
$neutral-900: #171717;

// 毛玻璃效果
$glass-light: rgba(255, 255, 255, 0.25);
$glass-dark: rgba(0, 0, 0, 0.25);
$backdrop-blur: blur(20px);
```

#### 字体系统
```scss
// 现代字体栈
$font-primary: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
$font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;

// 字体大小比例 (1.25 - Major Third)
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
$text-4xl: 2.25rem;   // 36px
```

#### 动画系统
```scss
// 缓动函数
$ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
$ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
$ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

// 动画持续时间
$duration-fast: 150ms;
$duration-normal: 250ms;
$duration-slow: 350ms;
$duration-slower: 500ms;

// 关键帧动画
@keyframes slideInUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeInScale {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
```

### 2. 现代化弹出窗口设计

#### 整体布局
```jsx
// 新的弹出窗口结构
<div className="modern-popup">
  <div className="popup-header">
    <div className="brand-section">
      <div className="logo-container">
        <img src="logo.png" className="logo-modern" />
        <span className="brand-text">ChatGPTBox</span>
      </div>
      <div className="version-badge">v{version}</div>
    </div>
  </div>
  
  <div className="popup-navigation">
    <ModernTabNavigation />
  </div>
  
  <div className="popup-content">
    <div className="content-container">
      {/* 动态内容区域 */}
    </div>
  </div>
  
  <div className="popup-footer">
    <ModernFooter />
  </div>
</div>
```

#### 现代化标签页导航
```scss
.modern-tab-navigation {
  display: flex;
  background: $glass-light;
  backdrop-filter: $backdrop-blur;
  border-radius: 12px;
  padding: 4px;
  margin: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  .tab-item {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    text-align: center;
    font-weight: 500;
    font-size: $text-sm;
    cursor: pointer;
    transition: all $duration-normal $ease-out-cubic;
    position: relative;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    
    &.active {
      background: $primary-gradient;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      
      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background: $primary-gradient;
        border-radius: 50%;
      }
    }
  }
}
```

### 3. 浮动聊天框重新设计

#### 毛玻璃聊天容器
```scss
.modern-chat-container {
  background: $glass-light;
  backdrop-filter: $backdrop-blur;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 380px;
  max-width: 480px;
  min-height: 300px;
  max-height: 600px;
  
  // 拖拽时的视觉反馈
  &.dragging {
    transform: rotate(2deg) scale(1.02);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    transition: all $duration-fast $ease-out-cubic;
  }
  
  // 响应式调整
  @media (max-width: 768px) {
    min-width: 320px;
    max-width: calc(100vw - 32px);
  }
}
```

#### 聊天头部栏
```jsx
<div className="chat-header">
  <div className="header-content">
    <div className="chat-status">
      <div className="status-indicator online"></div>
      <span className="status-text">ChatGPT Ready</span>
    </div>
    <div className="header-actions">
      <button className="action-btn minimize">
        <MinimizeIcon />
      </button>
      <button className="action-btn close">
        <CloseIcon />
      </button>
    </div>
  </div>
  <div className="progress-bar">
    <div className="progress-fill"></div>
  </div>
</div>
```

#### 现代化消息气泡
```scss
.message-bubble {
  margin: 16px;
  animation: slideInUp $duration-normal $ease-out-cubic;
  
  &.user {
    .bubble-content {
      background: $primary-gradient;
      color: white;
      margin-left: 40px;
      border-radius: 18px 18px 4px 18px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
  
  &.assistant {
    .bubble-content {
      background: $glass-light;
      backdrop-filter: $backdrop-blur;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-right: 40px;
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }
  
  .bubble-content {
    padding: 12px 16px;
    font-size: $text-sm;
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  .message-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: $text-xs;
    opacity: 0.7;
    
    .timestamp {
      color: $neutral-500;
    }
    
    .actions {
      display: flex;
      gap: 4px;
      
      .action-btn {
        padding: 4px;
        border-radius: 4px;
        opacity: 0;
        transition: opacity $duration-fast;
        
        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
  
  &:hover .message-meta .actions .action-btn {
    opacity: 1;
  }
}
```

### 4. 选择工具栏现代化

#### 浮动工具栏设计
```scss
.modern-selection-toolbar {
  background: $glass-dark;
  backdrop-filter: $backdrop-blur;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  gap: 4px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  animation: fadeInScale $duration-normal $ease-spring;
  
  .tool-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    transition: all $duration-fast $ease-out-cubic;
    position: relative;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
      
      .tooltip {
        opacity: 1;
        transform: translateY(-100%) translateX(-50%) scale(1);
      }
    }
    
    &:active {
      transform: translateY(0) scale(0.95);
    }
    
    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateY(-8px) translateX(-50%) scale(0.9);
      background: $neutral-800;
      color: white;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: $text-xs;
      white-space: nowrap;
      opacity: 0;
      transition: all $duration-normal $ease-out-cubic;
      pointer-events: none;
      
      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: $neutral-800;
      }
    }
  }
}
```

### 5. 侧边栏现代化设计

#### 侧边栏容器
```scss
.modern-sidebar {
  width: 380px;
  height: 100vh;
  background: $glass-light;
  backdrop-filter: $backdrop-blur;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  
  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .header-title {
      font-size: $text-lg;
      font-weight: 600;
      background: $primary-gradient;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header-subtitle {
      font-size: $text-sm;
      color: $neutral-500;
      margin-top: 4px;
    }
  }
  
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }
  
  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}
```

### 6. 现代化输入系统

#### 智能输入框
```scss
.modern-input-container {
  position: relative;
  
  .input-field {
    width: 100%;
    min-height: 44px;
    max-height: 120px;
    padding: 12px 48px 12px 16px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: $glass-light;
    backdrop-filter: $backdrop-blur;
    font-size: $text-sm;
    line-height: 1.5;
    resize: none;
    transition: all $duration-normal $ease-out-cubic;
    
    &:focus {
      outline: none;
      border-color: rgba(102, 126, 234, 0.5);
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      background: rgba(255, 255, 255, 0.9);
    }
    
    &::placeholder {
      color: $neutral-400;
    }
  }
  
  .input-actions {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    gap: 4px;
    
    .send-button {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: $primary-gradient;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all $duration-fast $ease-out-cubic;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    }
  }
  
  .input-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    margin-top: 4px;
    overflow: hidden;
    z-index: 1000;
    
    .suggestion-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color $duration-fast;
      
      &:hover {
        background: $neutral-50;
      }
      
      .suggestion-text {
        font-size: $text-sm;
        color: $neutral-700;
      }
      
      .suggestion-shortcut {
        font-size: $text-xs;
        color: $neutral-400;
        margin-top: 2px;
      }
    }
  }
}
```

## 数据模型

### 主题配置模型
```typescript
interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  animationSpeed: 'fast' | 'normal' | 'slow' | 'disabled';
  glassEffect: boolean;
  customCSS?: string;
}
```

### UI状态模型
```typescript
interface UIState {
  popup: {
    isOpen: boolean;
    activeTab: string;
    size: { width: number; height: number };
  };
  chatBox: {
    isVisible: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    isDragging: boolean;
  };
  sidebar: {
    isOpen: boolean;
    width: number;
    conversations: ConversationItem[];
  };
  selectionToolbar: {
    isVisible: boolean;
    position: { x: number; y: number };
    selectedText: string;
    availableTools: ToolItem[];
  };
}
```

### 动画配置模型
```typescript
interface AnimationConfig {
  enabled: boolean;
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    default: string;
    spring: string;
    smooth: string;
  };
  effects: {
    fadeIn: boolean;
    slideIn: boolean;
    scale: boolean;
    blur: boolean;
  };
}
```

## 错误处理

### 1. 主题切换错误处理
```typescript
class ThemeManager {
  async switchTheme(newTheme: ThemeMode): Promise<void> {
    try {
      // 预加载主题资源
      await this.preloadThemeAssets(newTheme);
      
      // 应用主题变更
      this.applyTheme(newTheme);
      
      // 保存用户偏好
      await this.saveThemePreference(newTheme);
      
    } catch (error) {
      // 回退到默认主题
      console.warn('Theme switch failed, falling back to default:', error);
      this.applyTheme('auto');
      
      // 显示用户友好的错误提示
      this.showNotification('主题切换失败，已恢复默认设置', 'warning');
    }
  }
}
```

### 2. 动画性能降级
```typescript
class AnimationManager {
  constructor() {
    this.performanceMode = this.detectPerformanceCapability();
  }
  
  private detectPerformanceCapability(): 'high' | 'medium' | 'low' {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return 'low';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    // 基于GPU信息判断性能等级
    if (renderer.includes('Intel HD') || vendor.includes('Intel')) {
      return 'low';
    }
    
    return 'high';
  }
  
  getAnimationConfig(): AnimationConfig {
    switch (this.performanceMode) {
      case 'low':
        return {
          enabled: false,
          duration: { fast: 0, normal: 0, slow: 0 },
          effects: { fadeIn: false, slideIn: false, scale: false, blur: false }
        };
      case 'medium':
        return {
          enabled: true,
          duration: { fast: 100, normal: 200, slow: 300 },
          effects: { fadeIn: true, slideIn: false, scale: true, blur: false }
        };
      default:
        return this.getFullAnimationConfig();
    }
  }
}
```

### 3. 响应式布局错误处理
```typescript
class ResponsiveManager {
  private breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };
  
  handleLayoutError(error: Error, component: string): void {
    console.error(`Layout error in ${component}:`, error);
    
    // 应用安全的回退样式
    this.applySafeLayout(component);
    
    // 记录错误用于分析
    this.logLayoutError(error, component);
  }
  
  private applySafeLayout(component: string): void {
    const safeStyles = {
      popup: { width: '400px', height: '600px' },
      chatBox: { width: '350px', height: '400px' },
      sidebar: { width: '300px', height: '100vh' }
    };
    
    const element = document.querySelector(`[data-component="${component}"]`);
    if (element) {
      Object.assign(element.style, safeStyles[component] || {});
    }
  }
}
```

## 测试策略

### 1. 视觉回归测试
```typescript
describe('Visual Regression Tests', () => {
  test('popup appearance in different themes', async () => {
    const themes = ['light', 'dark', 'auto'];
    
    for (const theme of themes) {
      await setTheme(theme);
      await openPopup();
      
      const screenshot = await takeScreenshot();
      expect(screenshot).toMatchSnapshot(`popup-${theme}.png`);
    }
  });
  
  test('chat box animations', async () => {
    await openChatBox();
    
    // 测试打开动画
    const openAnimation = await captureAnimation('chat-box-open');
    expect(openAnimation.duration).toBeLessThan(500);
    expect(openAnimation.smoothness).toBeGreaterThan(0.9);
    
    // 测试拖拽动画
    await dragChatBox({ x: 100, y: 100 });
    const dragAnimation = await captureAnimation('chat-box-drag');
    expect(dragAnimation.responsiveness).toBeGreaterThan(0.95);
  });
});
```

### 2. 性能测试
```typescript
describe('Performance Tests', () => {
  test('animation frame rate', async () => {
    const frameRates = [];
    
    await startPerformanceMonitoring();
    await triggerComplexAnimation();
    
    const metrics = await getPerformanceMetrics();
    expect(metrics.averageFPS).toBeGreaterThan(55);
    expect(metrics.droppedFrames).toBeLessThan(5);
  });
  
  test('memory usage during theme switching', async () => {
    const initialMemory = await getMemoryUsage();
    
    // 快速切换主题多次
    for (let i = 0; i < 10; i++) {
      await switchTheme(i % 2 === 0 ? 'light' : 'dark');
      await wait(100);
    }
    
    const finalMemory = await getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 小于10MB
  });
});
```

### 3. 可访问性测试
```typescript
describe('Accessibility Tests', () => {
  test('keyboard navigation', async () => {
    await openPopup();
    
    // 测试Tab键导航
    await pressKey('Tab');
    expect(await getFocusedElement()).toHaveAttribute('data-testid', 'first-tab');
    
    await pressKey('Tab');
    expect(await getFocusedElement()).toHaveAttribute('data-testid', 'second-tab');
    
    // 测试Enter键激活
    await pressKey('Enter');
    expect(await getActiveTab()).toBe('second-tab');
  });
  
  test('screen reader compatibility', async () => {
    const ariaLabels = await getAllAriaLabels();
    expect(ariaLabels).not.toContain('');
    
    const headingStructure = await getHeadingStructure();
    expect(headingStructure).toHaveValidHierarchy();
  });
});
```

这个设计文档提供了ChatGPTBox扩展现代化UI/UX重新设计的全面方案，包括设计系统、组件架构、数据模型、错误处理和测试策略。设计注重现代化视觉效果、流畅的用户体验和可维护性。