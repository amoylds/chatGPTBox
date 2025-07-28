import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import './ModernSidebar.scss'

// 对话项卡片组件
function ConversationCard({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename
}) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)
  const [showActions, setShowActions] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(conversation.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title)
      setIsEditing(false)
    }
  }

  return (
    <div 
      className={`conversation-card ${isActive ? 'active' : ''}`}
      onClick={() => !isEditing && onClick(conversation)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="card-content">
        <div className="conversation-info">
          {isEditing ? (
            <input
              ref={inputRef}
              className="title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <h4 className="conversation-title">{conversation.title}</h4>
          )}
          <div className="conversation-meta">
            <span className="message-count">{conversation.messageCount} {t('messages')}</span>
            <span className="last-updated">{conversation.lastUpdated}</span>
          </div>
        </div>
        
        <div className={`conversation-actions ${showActions ? 'visible' : ''}`}>
          <button
            className="action-btn edit"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            title={t('Rename')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8.5 2.5L11.5 5.5L4 13H1V10L8.5 2.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
          </button>
          <button
            className="action-btn delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(conversation.id)
            }}
            title={t('Delete')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3.5H13M5.5 1V3.5M8.5 1V3.5M2 3.5H12L11 12H3L2 3.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
          </button>
        </div>
      </div>
      
      {conversation.preview && (
        <div className="conversation-preview">
          {conversation.preview}
        </div>
      )}
    </div>
  )
}

ConversationCard.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    messageCount: PropTypes.number,
    lastUpdated: PropTypes.string,
    preview: PropTypes.string
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired
}

// 搜索框组件
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-box">
      <div className="search-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13 13L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="clear-button"
          onClick={() => onChange('')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

SearchBox.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
}

// 虚拟滚动列表组件
function VirtualizedList({ 
  items, 
  renderItem, 
  itemHeight = 80, 
  containerHeight = 400 
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = items.slice(visibleStart, visibleEnd)
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      className="virtualized-container"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number
}

// 主侧边栏组件
export function ModernSidebar({
  conversations = [],
  activeConversationId,
  onConversationSelect,
  onConversationDelete,
  onConversationRename,
  onNewConversation,
  isOpen = true,
  width = 380,
  className = ''
}) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState(conversations)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 过滤对话
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [conversations, searchQuery])

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (!isOpen) return null

  return (
    <div 
      className={`modern-sidebar ${className} ${isCollapsed ? 'collapsed' : ''}`}
      style={{ width: isCollapsed ? 60 : width }}
    >
      {/* 侧边栏头部 */}
      <div className="sidebar-header">
        <div className="header-content">
          {!isCollapsed && (
            <>
              <div className="header-title">
                <h2>{t('Conversations')}</h2>
                <span className="conversation-count">
                  {filteredConversations.length}
                </span>
              </div>
              <div className="header-actions">
                <button
                  className="action-btn new-chat"
                  onClick={onNewConversation}
                  title={t('New Conversation')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </>
          )}
          <button
            className="collapse-btn"
            onClick={handleToggleCollapse}
            title={isCollapsed ? t('Expand') : t('Collapse')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path 
                d={isCollapsed ? "M6 4L10 8L6 12" : "M10 4L6 8L10 12"} 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 搜索框 */}
        {!isCollapsed && (
          <div className="search-section">
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('Search conversations...')}
            />
          </div>
        )}
      </div>

      {/* 侧边栏内容 */}
      <div className="sidebar-content">
        {!isCollapsed && (
          <>
            {filteredConversations.length === 0 ? (
              <div className="empty-state">
                {searchQuery ? (
                  <>
                    <div className="empty-icon">🔍</div>
                    <h3>{t('No conversations found')}</h3>
                    <p>{t('Try adjusting your search terms')}</p>
                  </>
                ) : (
                  <>
                    <div className="empty-icon">💬</div>
                    <h3>{t('No conversations yet')}</h3>
                    <p>{t('Start a new conversation to get started')}</p>
                    <button
                      className="start-button"
                      onClick={onNewConversation}
                    >
                      {t('Start Chatting')}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <VirtualizedList
                items={filteredConversations}
                renderItem={(conversation) => (
                  <ConversationCard
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={onConversationSelect}
                    onDelete={onConversationDelete}
                    onRename={onConversationRename}
                  />
                )}
                itemHeight={80}
                containerHeight={400}
              />
            )}
          </>
        )}
      </div>

      {/* 侧边栏底部 */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="footer-content">
            <div className="usage-info">
              <span className="usage-text">
                {t('{{count}} conversations', { count: conversations.length })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ModernSidebar.propTypes = {
  conversations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    messageCount: PropTypes.number,
    lastUpdated: PropTypes.string,
    preview: PropTypes.string
  })),
  activeConversationId: PropTypes.string,
  onConversationSelect: PropTypes.func.isRequired,
  onConversationDelete: PropTypes.func.isRequired,
  onConversationRename: PropTypes.func.isRequired,
  onNewConversation: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  width: PropTypes.number,
  className: PropTypes.string
}

export default ModernSidebar
