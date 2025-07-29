import {
  createSession,
  resetSessions,
  getSessions,
  updateSession,
  getSession,
  deleteSession,
} from '../../services/local-session.mjs'
import { useEffect, useRef, useState } from 'react'
import './styles.scss'
import { useConfig } from '../../hooks/use-config.mjs'
import { useTranslation } from 'react-i18next'
import ConfirmButton from '../../components/ConfirmButton'
import ConversationCard from '../../components/ConversationCard'
import DeleteButton from '../../components/DeleteButton'
import { openUrl } from '../../utils/index.mjs'
import Browser from 'webextension-polyfill'
import FileSaver from 'file-saver'
import { ModernSidebar } from '../../components/ModernUI'
import '../../styles/modern-ui.scss'

function App() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false) // 默认展开侧边栏
  const [config] = useConfig()
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [currentSession, setCurrentSession] = useState(null)
  const [renderContent, setRenderContent] = useState(false)
  const [useModernUI, setUseModernUI] = useState(true) // 启用现代化UI
  const currentPort = useRef(null)

  const setSessionIdSafe = async (sessionId) => {
    if (currentPort.current) {
      try {
        currentPort.current.postMessage({ stop: true })
        currentPort.current.disconnect()
      } catch (e) {
        /* empty */
      }
      currentPort.current = null
    }
    const { session, currentSessions } = await getSession(sessionId)
    if (session) setSessionId(sessionId)
    else if (currentSessions.length > 0) setSessionId(currentSessions[0].sessionId)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = config?.themeMode || 'auto'
    // 检查是否启用现代化UI
    setUseModernUI(config?.enableModernUI !== false)
  }, [config])

  useEffect(() => {
    // eslint-disable-next-line
    ;(async () => {
      const urlFrom = new URLSearchParams(window.location.search).get('from')
      const sessions = await getSessions()
      if (
        urlFrom !== 'store' &&
        sessions[0].conversationRecords &&
        sessions[0].conversationRecords.length > 0
      ) {
        await createNewChat()
      } else {
        setSessions(sessions)
        await setSessionIdSafe(sessions[0].sessionId)
      }
    })()
  }, [])

  useEffect(() => {
    if ('sessions' in config && config['sessions']) setSessions(config['sessions'])
  }, [config])

  useEffect(() => {
    // eslint-disable-next-line
    ;(async () => {
      if (sessions.length > 0) {
        setCurrentSession((await getSession(sessionId)).session)
        setRenderContent(false)
        setTimeout(() => {
          setRenderContent(true)
        })
      }
    })()
  }, [sessionId])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const createNewChat = async () => {
    const { session, currentSessions } = await createSession()
    setSessions(currentSessions)
    await setSessionIdSafe(session.sessionId)
  }

  const exportConversations = async () => {
    const sessions = await getSessions()
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'text/json;charset=utf-8' })
    FileSaver.saveAs(blob, 'conversations.json')
  }

  const clearConversations = async () => {
    const sessions = await resetSessions()
    setSessions(sessions)
    await setSessionIdSafe(sessions[0].sessionId)
  }

  // 转换sessions为现代化UI格式
  const modernConversations = sessions.map(session => ({
    id: session.sessionId,
    title: session.sessionName || t('New Conversation'),
    messageCount: session.conversationRecords?.length || 0,
    lastUpdated: new Date().toLocaleDateString(),
    preview: session.conversationRecords?.[0]?.text?.substring(0, 50) || ''
  }))

  // 现代化UI渲染
  if (useModernUI) {
    return (
      <div className="modern-independent-panel" data-theme={config?.themeMode || 'auto'}>
        <div className="modern-chat-layout">
          <ModernSidebar
            conversations={modernConversations}
            activeConversationId={sessionId}
            onConversationSelect={(conversation) => setSessionIdSafe(conversation.id)}
            onConversationDelete={(conversationId) => {
              deleteSession(conversationId).then((sessions) => {
                setSessions(sessions)
                if (sessions.length > 0) {
                  setSessionIdSafe(sessions[0].sessionId)
                }
              })
            }}
            onConversationRename={(conversationId, newTitle) => {
              // TODO: 实现重命名功能
              console.log('Rename conversation:', conversationId, newTitle)
            }}
            onNewConversation={createNewChat}
            isOpen={!collapsed}
            onToggle={toggleSidebar}
            width={320}
            className="independent-sidebar"
          />
          <div className="modern-chat-main">
            {renderContent && currentSession && currentSession.conversationRecords ? (
              <div className="chatgptbox-container modern-chat-container">
                <ConversationCard
                  session={currentSession}
                  notClampSize={true}
                  pageMode={true}
                  onUpdate={(port, session, cData) => {
                    currentPort.current = port
                    if (cData.length > 0 && cData[cData.length - 1].done) {
                      updateSession(session).then(setSessions)
                      setCurrentSession(session)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="empty-chat-state">
                <div className="empty-icon">💬</div>
                <h2>{t('Welcome to ChatGPTBox')}</h2>
                <p>{t('Select a conversation from the sidebar or start a new one')}</p>
                <button className="modern-btn primary" onClick={createNewChat}>
                  {t('Start New Conversation')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 传统UI渲染（保持向后兼容）
  return (
    <div className="IndependentPanel">
      <div className="chat-container">
        <div className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="chat-sidebar-button-group">
            <button className="normal-button" onClick={toggleSidebar}>
              {collapsed ? t('Pin') : t('Unpin')}
            </button>
            <button className="normal-button" onClick={createNewChat}>
              {t('New Chat')}
            </button>
            <button className="normal-button" onClick={exportConversations}>
              {t('Export')}
            </button>
          </div>
          <hr />
          <div className="chat-list">
            {sessions.map(
              (
                session,
                index, // TODO editable session name
              ) => (
                <button
                  key={index}
                  className={`normal-button ${sessionId === session.sessionId ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => {
                    setSessionIdSafe(session.sessionId)
                  }}
                >
                  {session.sessionName}
                  <span className="gpt-util-group">
                    <DeleteButton
                      size={14}
                      text={t('Delete Conversation')}
                      onConfirm={() =>
                        deleteSession(session.sessionId).then((sessions) => {
                          setSessions(sessions)
                          setSessionIdSafe(sessions[0].sessionId)
                        })
                      }
                    />
                  </span>
                </button>
              ),
            )}
          </div>
          <hr />
          <div className="chat-sidebar-button-group">
            <ConfirmButton text={t('Clear conversations')} onConfirm={clearConversations} />
            <button
              className="normal-button"
              onClick={() => {
                openUrl(Browser.runtime.getURL('popup.html'))
              }}
            >
              {t('Settings')}
            </button>
          </div>
        </div>
        <div className="chat-content">
          {renderContent && currentSession && currentSession.conversationRecords && (
            <div className="chatgptbox-container" style={{ height: '100%' }}>
              <ConversationCard
                session={currentSession}
                notClampSize={true}
                pageMode={true}
                onUpdate={(port, session, cData) => {
                  currentPort.current = port
                  if (cData.length > 0 && cData[cData.length - 1].done) {
                    updateSession(session).then(setSessions)
                    setCurrentSession(session)
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
