import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Draggable from 'react-draggable'
import PropTypes from 'prop-types'
import './ModernChatBox.scss'

// 聊天状态指示器组件
function ChatStatusIndicator({ status, text }) {
  const statusConfig = {
    online: { color: 'success', icon: '●' },
    thinking: { color: 'warning', icon: '●' },
    typing: { color: 'info', icon: '●' },
    error: { color: 'error', icon: '●' },
    offline: { color: 'neutral', icon: '●' }
  }

  const config = statusConfig[status] || statusConfig.offline

  return (
    <div className={`status-indicator ${config.color}`}>
      <span className="status-dot">{config.icon}</span>
      <span className="status-text">{text}</span>
    </div>
  )
}

ChatStatusIndicator.propTypes = {
  status: PropTypes.oneOf(['online', 'thinking', 'typing', 'error', 'offline']),
  text: PropTypes.string.isRequired
}

// 聊天头部栏组件
function ModernChatHeader({
  status,
  statusText,
  onMinimize,
  onClose,
  isMinimized,
  progress = 0
}) {
  const { t } = useTranslation()

  return (
    <div className="chat-header draggable">
      <div className="header-content">
        <div className="chat-status">
          <ChatStatusIndicator status={status} text={statusText} />
        </div>
        <div className="header-actions">
          <button 
            className="action-btn minimize"
            onClick={onMinimize}
            title={isMinimized ? t('Expand') : t('Minimize')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button 
            className="action-btn close"
            onClick={onClose}
            title={t('Close')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      {progress > 0 && progress < 100 && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

ModernChatHeader.propTypes = {
  status: PropTypes.oneOf(['online', 'thinking', 'typing', 'error', 'offline']),
  statusText: PropTypes.string,
  onMinimize: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isMinimized: PropTypes.bool,
  progress: PropTypes.number
}

// 消息气泡组件
function MessageBubble({ message, type, timestamp, onCopy, onRegenerate }) {
  const { t } = useTranslation()
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className={`message-bubble ${type}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="bubble-content">
        {typeof message === 'string' ? (
          <p>{message}</p>
        ) : (
          message
        )}
      </div>
      <div className="message-meta">
        <span className="timestamp">{timestamp}</span>
        <div className={`actions ${showActions ? 'visible' : ''}`}>
          {onCopy && (
            <button 
              className="action-btn copy"
              onClick={onCopy}
              title={t('Copy')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2V1a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8z" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </button>
          )}
          {onRegenerate && type === 'assistant' && (
            <button 
              className="action-btn regenerate"
              onClick={onRegenerate}
              title={t('Regenerate')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 4v2a4 4 0 0 0 4 4h4m0-4l2-2-2-2" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

MessageBubble.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  type: PropTypes.oneOf(['user', 'assistant']).isRequired,
  timestamp: PropTypes.string.isRequired,
  onCopy: PropTypes.func,
  onRegenerate: PropTypes.func
}

// 现代化输入框组件
function ModernChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  onStop
}) {
  const { t } = useTranslation()
  const textareaRef = useRef(null)

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit()
      } else if (disabled && onStop) {
        onStop()
      }
    }
  }

  return (
    <div className="modern-input-container">
      <textarea
        ref={textareaRef}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('Type your message...')}
        disabled={false}
        rows={1}
      />
      <div className="input-actions">
        <button
          className={`send-button ${disabled ? 'stop' : 'send'}`}
          onClick={disabled ? onStop : onSubmit}
          disabled={!disabled && !value.trim()}
        >
          {disabled ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l12-6-6 6 6 6-12-6z" fill="currentColor"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

ModernChatInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  onStop: PropTypes.func
}

// 主聊天框组件
export function ModernChatBox({
  messages = [],
  onSendMessage,
  onClose,
  onMinimize,
  isMinimized = false,
  isDragging = false,
  status = 'online',
  statusText = 'ChatGPT Ready',
  isGenerating = false,
  onStopGeneration,
  position = { x: 0, y: 0 },
  onDrag,
  onStop,
  className = ''
}) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const [progress, setProgress] = useState(0)
  const messagesEndRef = useRef(null)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 模拟进度条
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)
      return () => clearInterval(interval)
    } else {
      setProgress(0)
    }
  }, [isGenerating])

  const handleSendMessage = () => {
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleCopyMessage = (message) => {
    navigator.clipboard.writeText(message)
  }

  return (
    <Draggable
      handle=".draggable"
      position={position}
      onDrag={onDrag}
      onStop={onStop}
    >
      <div className={`modern-chat-container ${className} ${isDragging ? 'dragging' : ''} ${isMinimized ? 'minimized' : ''}`}>
        {/* 头部栏 */}
        <ModernChatHeader
          status={status}
          statusText={statusText}
          onMinimize={onMinimize}
          onClose={onClose}
          isMinimized={isMinimized}
          progress={progress}
        />

        {!isMinimized && (
          <>
            {/* 消息区域 */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>{t('Start a conversation')}</h3>
                  <p>{t('Ask me anything and I\'ll help you out!')}</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageBubble
                    key={index}
                    message={msg.content}
                    type={msg.type}
                    timestamp={msg.timestamp}
                    onCopy={() => handleCopyMessage(msg.content)}
                    onRegenerate={msg.type === 'assistant' ? () => onSendMessage(messages[index - 1]?.content) : null}
                  />
                ))
              )}
              {isGenerating && (
                <MessageBubble
                  message={
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  }
                  type="assistant"
                  timestamp={t('Thinking...')}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="chat-input">
              <ModernChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSendMessage}
                disabled={isGenerating}
                onStop={onStopGeneration}
                placeholder={isGenerating ? t('Generating response...') : t('Type your message...')}
              />
            </div>
          </>
        )}
      </div>
    </Draggable>
  )
}

ModernChatBox.propTypes = {
  messages: PropTypes.array,
  onSendMessage: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func,
  isMinimized: PropTypes.bool,
  isDragging: PropTypes.bool,
  status: PropTypes.oneOf(['online', 'thinking', 'typing', 'error', 'offline']),
  statusText: PropTypes.string,
  isGenerating: PropTypes.bool,
  onStopGeneration: PropTypes.func,
  position: PropTypes.object,
  onDrag: PropTypes.func,
  onStop: PropTypes.func,
  className: PropTypes.string
}

export default ModernChatBox
