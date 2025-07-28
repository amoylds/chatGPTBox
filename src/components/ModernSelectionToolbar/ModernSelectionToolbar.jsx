import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import './ModernSelectionToolbar.scss'

// 工具按钮组件
function ToolButton({ 
  icon, 
  label, 
  onClick, 
  isLoading = false, 
  status = 'default',
  shortcut,
  className = '' 
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const buttonRef = useRef(null)

  const statusConfig = {
    default: 'default',
    success: 'success',
    error: 'error',
    loading: 'loading'
  }

  return (
    <button
      ref={buttonRef}
      className={`tool-button ${statusConfig[status]} ${className}`}
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {isLoading ? (
        <div className="loading-spinner">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="37.7" strokeDashoffset="37.7">
              <animateTransform attributeName="transform" type="rotate" values="0 8 8;360 8 8" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      ) : (
        icon
      )}
      
      {showTooltip && (
        <div className="tooltip">
          <div className="tooltip-content">
            <span className="tooltip-label">{label}</span>
            {shortcut && <span className="tooltip-shortcut">{shortcut}</span>}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </button>
  )
}

// 工具分组组件
function ToolGroup({ title, tools, onToolClick, loadingStates, toolStatuses }) {
  return (
    <div className="tool-group">
      {title && <div className="group-title">{title}</div>}
      <div className="group-tools">
        {tools.map((tool, index) => (
          <ToolButton
            key={tool.id || index}
            icon={tool.icon}
            label={tool.label}
            onClick={() => onToolClick(tool)}
            isLoading={loadingStates[tool.id] || false}
            status={toolStatuses[tool.id] || 'default'}
            shortcut={tool.shortcut}
            className={tool.className}
          />
        ))}
      </div>
    </div>
  )
}

// 进度指示器组件
function ProgressIndicator({ progress, status, message }) {
  if (!message) return null

  return (
    <div className={`progress-indicator ${status}`}>
      <div className="progress-content">
        <span className="progress-message">{message}</span>
        {progress !== undefined && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

// 主选择工具栏组件
export function ModernSelectionToolbar({
  tools = [],
  selectedText = '',
  position = { x: 0, y: 0 },
  onToolClick,
  onClose,
  isVisible = true,
  className = '',
  groupBy = null,
  showProgress = false,
  progressData = null
}) {
  const { t } = useTranslation()
  const [loadingStates, setLoadingStates] = useState({})
  const [toolStatuses, setToolStatuses] = useState({})
  const [isAnimating, setIsAnimating] = useState(false)
  const toolbarRef = useRef(null)

  // 处理工具点击
  const handleToolClick = async (tool) => {
    if (loadingStates[tool.id]) return

    try {
      // 设置加载状态
      setLoadingStates(prev => ({ ...prev, [tool.id]: true }))
      setToolStatuses(prev => ({ ...prev, [tool.id]: 'loading' }))

      // 执行工具操作
      await onToolClick(tool, selectedText)

      // 设置成功状态
      setToolStatuses(prev => ({ ...prev, [tool.id]: 'success' }))
      
      // 2秒后重置状态
      setTimeout(() => {
        setToolStatuses(prev => ({ ...prev, [tool.id]: 'default' }))
      }, 2000)

    } catch (error) {
      console.error('Tool execution failed:', error)
      
      // 设置错误状态
      setToolStatuses(prev => ({ ...prev, [tool.id]: 'error' }))
      
      // 3秒后重置状态
      setTimeout(() => {
        setToolStatuses(prev => ({ ...prev, [tool.id]: 'default' }))
      }, 3000)
    } finally {
      // 清除加载状态
      setLoadingStates(prev => ({ ...prev, [tool.id]: false }))
    }
  }

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return

      // ESC 键关闭工具栏
      if (e.key === 'Escape') {
        onClose?.()
        return
      }

      // 数字键快捷方式
      const num = parseInt(e.key)
      if (num >= 1 && num <= tools.length) {
        const tool = tools[num - 1]
        if (tool && !loadingStates[tool.id]) {
          handleToolClick(tool)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, tools, loadingStates])

  // 入场动画
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // 自动定位调整
  useEffect(() => {
    if (toolbarRef.current && isVisible) {
      const toolbar = toolbarRef.current
      const rect = toolbar.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = position.x
      let adjustedY = position.y

      // 防止超出右边界
      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      // 防止超出下边界
      if (position.y + rect.height > viewportHeight) {
        adjustedY = position.y - rect.height - 10
      }

      // 防止超出左边界
      if (adjustedX < 10) {
        adjustedX = 10
      }

      // 防止超出上边界
      if (adjustedY < 10) {
        adjustedY = position.y + 30
      }

      toolbar.style.left = `${adjustedX}px`
      toolbar.style.top = `${adjustedY}px`
    }
  }, [position, isVisible])

  if (!isVisible || tools.length === 0) {
    return null
  }

  // 按组分类工具
  const groupedTools = groupBy ? 
    tools.reduce((groups, tool) => {
      const group = tool[groupBy] || 'default'
      if (!groups[group]) groups[group] = []
      groups[group].push(tool)
      return groups
    }, {}) : 
    { default: tools }

  return (
    <div
      ref={toolbarRef}
      className={`modern-selection-toolbar ${className} ${isAnimating ? 'animating' : ''}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 2147483647
      }}
    >
      {/* 工具组 */}
      <div className="toolbar-content">
        {Object.entries(groupedTools).map(([groupName, groupTools]) => (
          <ToolGroup
            key={groupName}
            title={groupName !== 'default' ? groupName : null}
            tools={groupTools}
            onToolClick={handleToolClick}
            loadingStates={loadingStates}
            toolStatuses={toolStatuses}
          />
        ))}
      </div>

      {/* 进度指示器 */}
      {showProgress && progressData && (
        <ProgressIndicator
          progress={progressData.progress}
          status={progressData.status}
          message={progressData.message}
        />
      )}

      {/* 关闭按钮 */}
      {onClose && (
        <button className="close-button" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* 选中文本预览 */}
      {selectedText && (
        <div className="selected-text-preview">
          <span className="preview-label">{t('Selected')}:</span>
          <span className="preview-text">
            {selectedText.length > 50 ? 
              `${selectedText.substring(0, 50)}...` : 
              selectedText
            }
          </span>
        </div>
      )}
    </div>
  )
}

ModernSelectionToolbar.propTypes = {
  tools: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    shortcut: PropTypes.string,
    className: PropTypes.string
  })),
  selectedText: PropTypes.string,
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  onToolClick: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  isVisible: PropTypes.bool,
  className: PropTypes.string,
  groupBy: PropTypes.string,
  showProgress: PropTypes.bool,
  progressData: PropTypes.shape({
    progress: PropTypes.number,
    status: PropTypes.string,
    message: PropTypes.string
  })
}

export default ModernSelectionToolbar
