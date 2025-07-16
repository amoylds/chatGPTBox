import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Browser from 'webextension-polyfill'
import InputBox from '../InputBox'
import ConversationItem from '../ConversationItem'
import {
  apiModeToModelName,
  createElementAtPosition,
  getApiModesFromConfig,
  isApiModeSelected,
  isFirefox,
  isMobile,
  isSafari,
  isUsingModelName,
  modelNameToDesc,
} from '../../utils'
import {
  ArchiveIcon,
  DesktopDownloadIcon,
  KebabHorizontalIcon, // For "more options"
  LinkExternalIcon,
  MoveToBottomIcon,
  SearchIcon,
} from '@primer/octicons-react'
import { Pin, WindowDesktop, XLg } from 'react-bootstrap-icons' // XLg is fine for close
import FileSaver from 'file-saver'
import { render } from 'preact'
import FloatingToolbar from '../FloatingToolbar'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { getUserConfig, isUsingBingWebModel, Models } from '../../config/index.mjs'
import { useTranslation } from 'react-i18next'
import DeleteButton from '../DeleteButton' // Will be styled as an icon button
import { useConfig } from '../../hooks/use-config.mjs'
import { createSession } from '../../services/local-session.mjs'
import { v4 as uuidv4 } from 'uuid'
import { initSession } from '../../services/init-session.mjs'
import { findLastIndex } from 'lodash-es'
import { generateAnswersWithBingWebApi } from '../../services/apis/bing-web.mjs'
import { handlePortError } from '../../services/wrappers.mjs'
import './styles.scss' // Import the SCSS file

const logo = Browser.runtime.getURL('logo.png')

class ConversationItemData extends Object {
  /**
   * @param {'question'|'answer'|'error'} type
   * @param {string} content
   * @param {bool} done
   */
  constructor(type, content, done = false) {
    super()
    this.type = type
    this.content = content
    this.done = done
  }
}

function ConversationCard(props) {
  const { t } = useTranslation()
  const [isReady, setIsReady] = useState(!props.question)
  const [port, setPort] = useState(() => Browser.runtime.connect())
  const [triggered, setTriggered] = useState(!props.waitForTrigger)
  const [session, setSession] = useState(props.session)
  const windowSize = useClampWindowSize([750, 1500], [250, 1100]) // Keep for non-pageMode resize
  const bodyRef = useRef(null)
  const [completeDraggable, setCompleteDraggable] = useState(false)
  const useForegroundFetch = isUsingBingWebModel(session)
  const [apiModes, setApiModes] = useState([])
  const [showMoreOptions, setShowMoreOptions] = useState(false) // For dropdown
  const moreOptionsRef = useRef(null)


  /**
   * @type {[ConversationItemData[], (conversationItemData: ConversationItemData[]) => void]}
   */
  const [conversationItemData, setConversationItemData] = useState([])
  const config = useConfig()

  useLayoutEffect(() => {
    if (session.conversationRecords.length === 0) {
      if (props.question && triggered)
        setConversationItemData([
          new ConversationItemData(
            'answer',
            // Updated class for loading message
            `<p class="gpt-loading">${t(`Waiting for response...`)}</p>`,
          ),
        ])
    } else {
      const ret = []
      for (const record of session.conversationRecords) {
        ret.push(new ConversationItemData('question', record.question, true))
        ret.push(new ConversationItemData('answer', record.answer, true))
      }
      setConversationItemData(ret)
    }
  }, [session.conversationRecords, props.question, triggered, t]) // Added dependencies

  useEffect(() => {
    setCompleteDraggable(!isSafari() && !isFirefox() && !isMobile())
  }, [])

  useEffect(() => {
    if (props.onUpdate) props.onUpdate(port, session, conversationItemData)
  }, [session, conversationItemData, props, port]) // Added props, port

  useEffect(() => {
    if (bodyRef.current) { // Ensure ref is set
        const { offsetHeight, scrollHeight, scrollTop } = bodyRef.current
        if (
        config.lockWhenAnswer &&
        scrollHeight <= scrollTop + offsetHeight + config.answerScrollMargin
        ) {
        bodyRef.current.scrollTo({
            top: scrollHeight,
            behavior: 'instant', // Changed from 'smooth' for faster scroll with new content
        })
        }
    }
  }, [conversationItemData, config.lockWhenAnswer, config.answerScrollMargin])

  useEffect(() => { // Removed async from useEffect
    const runAsync = async () => {
        if (props.question && triggered) {
            const newSession = initSession({ ...session, question: props.question })
            setSession(newSession)
            await postMessage({ session: newSession })
        }
    }
    runAsync()
  }, [props.question, triggered]) // Removed session from deps as it's set inside

  useLayoutEffect(() => {
    setApiModes(getApiModesFromConfig(config, true))
  }, [
    config, // config is enough as other properties are part of it
  ])

  const updateAnswer = useCallback((value, appended, newType, done = false) => {
    setConversationItemData((old) => {
      const copy = [...old]
      const index = findLastIndex(copy, (v) => v.type === 'answer' || v.type === 'error')
      // If no answer/error yet, and we are trying to update one, it might mean we need to add a new one
      if (index === -1 && (newType === 'answer' || newType === 'error')) {
         return [...copy, new ConversationItemData(newType, value, done)];
      }
      if (index === -1) return copy; // Should not happen if we are updating existing

      copy[index] = new ConversationItemData(
        newType,
        appended ? (copy[index].content.includes('gpt-loading') ? value : copy[index].content + value) : value,
        done,
      )
      return copy
    })
  }, []);


  const portMessageListener = useCallback((msg) => {
    if (msg.answer) {
      updateAnswer(msg.answer, true, 'answer') // Appended should be true for streaming
    }
    if (msg.session) {
      if (msg.done) msg.session = { ...msg.session, isRetry: false }
      setSession(s => ({...s, ...msg.session})) // Merge session to avoid overwriting pending state
    }
    if (msg.done) {
      updateAnswer('', true, 'answer', true)
      setIsReady(true)
    }
    if (msg.error) {
      // Use a more specific class for error rendering in ConversationItem
      const errorContent = (errorType, details = '') => {
        let message = '';
        switch (errorType) {
            case 'UNAUTHORIZED':
            message = `${t('UNAUTHORIZED')}<br>${t('Please login at https://chatgpt.com first')}${
                isSafari() ? `<br>${t('Then open https://chatgpt.com/api/auth/session')}` : ''
                }<br>${t('And refresh this page or type you question again')}` +
                `<br><br>${t( 'Consider creating an api key at https://platform.openai.com/account/api-keys')}`;
            break;
            case 'CLOUDFLARE':
            message = `${t('OpenAI Security Check Required')}<br>${
                isSafari() ? t('Please open https://chatgpt.com/api/auth/session') : t('Please open https://chatgpt.com')
                }<br>${t('And refresh this page or type you question again')}` +
                `<br><br>${t('Consider creating an api key at https://platform.openai.com/account/api-keys')}`;
            break;
            default:
            let formattedError = errorType // Assuming errorType is msg.error string
            if (typeof formattedError === 'string' && formattedError.trimStart().startsWith('{'))
                try { formattedError = JSON.stringify(JSON.parse(formattedError), null, 2) } catch (e) { /* empty */ }
            message = t(formattedError) + (details ? `<br><pre>${details}</pre>` : '');
            break;
        }
        return `<div class="gpt-error">${message}</div>`;
      }
      updateAnswer(errorContent(msg.error, msg.details), false, 'error', true) // done = true for error
      setIsReady(true)
    }
  }, [t, updateAnswer]);

  const foregroundMessageListeners = useRef([])

  const postMessage = useCallback(async ({ session: postSession, stop }) => {
    if (useForegroundFetch) {
      foregroundMessageListeners.current.forEach((listener) => listener({ session: postSession, stop }))
      if (postSession) {
        const fakePort = {
          postMessage: (msg) => { portMessageListener(msg) },
          onMessage: {
            addListener: (listener) => { foregroundMessageListeners.current.push(listener) },
            removeListener: (listener) => {
              foregroundMessageListeners.current.splice(
                foregroundMessageListeners.current.indexOf(listener), 1,
              );
            },
          },
          onDisconnect: { addListener: () => {}, removeListener: () => {} },
        }
        try {
          const userConf = await getUserConfig(); // Await config
          const bingToken = userConf.bingAccessToken
          if (isUsingModelName('bingFreeSydney', postSession))
            await generateAnswersWithBingWebApi(fakePort, postSession.question, postSession, bingToken, true)
          else await generateAnswersWithBingWebApi(fakePort, postSession.question, postSession, bingToken)
        } catch (err) {
          handlePortError(postSession, fakePort, err)
        }
      }
    } else {
      port.postMessage({ session: postSession, stop })
    }
  }, [port, portMessageListener, useForegroundFetch]); // Added dependencies

  useEffect(() => {
    const portListener = () => {
      setPort(Browser.runtime.connect())
      setIsReady(true) // Reset ready state on reconnect
    }

    const closeChatsMessageListener = (message) => {
      if (message.type === 'CLOSE_CHATS') {
        port.disconnect()
        // No need to remove listeners if component unmounts, but good practice if port persists
        if (props.onClose) props.onClose()
      }
    }
    const closeChatsEscListener = async (e) => {
      if (e.key === 'Escape' && (await getUserConfig()).allowEscToCloseAll) {
        closeChatsMessageListener({ type: 'CLOSE_CHATS' })
      }
    }

    if (props.closeable) {
      Browser.runtime.onMessage.addListener(closeChatsMessageListener)
      window.addEventListener('keydown', closeChatsEscListener)
    }
    port.onDisconnect.addListener(portListener)
    return () => {
      if (props.closeable) {
        Browser.runtime.onMessage.removeListener(closeChatsMessageListener)
        window.removeEventListener('keydown', closeChatsEscListener)
      }
      port.onDisconnect.removeListener(portListener)
      // port.disconnect(); // Disconnect on unmount if not handled by parent
    }
  }, [port, props.closeable, props.onClose])

  useEffect(() => {
    if (useForegroundFetch) { // No listener needed for foreground fetch
      return () => {}
    }
    port.onMessage.addListener(portMessageListener)
    return () => {
      port.onMessage.removeListener(portMessageListener)
    }
  }, [port, portMessageListener, useForegroundFetch]) // Added useForegroundFetch

  const getRetryFn = useCallback((currentSession) => async () => {
    updateAnswer(`<p class="gpt-loading">${t('Waiting for response...')}</p>`, false, 'answer')
    setIsReady(false)

    const newRecords = [...currentSession.conversationRecords];
    if (newRecords.length > 0) {
      const lastRecord = newRecords[newRecords.length - 1];
      const lastItemData = conversationItemData[conversationItemData.length - 1];
      const secondLastItemData = conversationItemData[conversationItemData.length - 2];
      if (
        lastItemData && lastItemData.done &&
        conversationItemData.length > 1 && secondLastItemData &&
        lastRecord.question === secondLastItemData.content
      ) {
        newRecords.pop()
      }
    }
    const newSession = { ...currentSession, conversationRecords: newRecords, isRetry: true }
    setSession(newSession)
    try {
      await postMessage({ stop: true }) // Ensure any existing stream is stopped.
      await postMessage({ session: newSession })
    } catch (e) {
      updateAnswer(`<div class="gpt-error">${e.message || String(e)}</div>`, false, 'error', true)
    }
  }, [conversationItemData, postMessage, t, updateAnswer]);


  const retryFn = useMemo(() => getRetryFn(session), [session, getRetryFn])

  // Close "more options" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moreOptionsRef]);


  return (
    <div className="gpt-inner">
      <div
        className={`gpt-header${props.draggable && completeDraggable ? ' draggable' : ''}`}
        // Removed inline style for user-select, handle in SCSS if needed
      >
        <div className="gpt-util-group"> {/* Left group */}
          {props.closeable ? (
            <span
              className="gpt-util-icon close-icon" // Added specific class for close
              title={t('Close the Window')}
              onClick={() => {
                port.disconnect()
                if (props.onClose) props.onClose()
              }}
            >
              <XLg size={16} />
            </span>
          ) : props.dockable ? (
            <span
              className="gpt-util-icon"
              title={t('Pin the Window')}
              onClick={() => { if (props.onDock) props.onDock() }}
            >
              <Pin size={16} />
            </span>
          ) : (
            <img src={logo} alt="Logo" style={{ width: '24px', height: '24px', marginRight: '8px' }} />
          )}
          <select
            // className="normal-button" // Global select styling will apply
            // style removed
            required
            value={apiModes.findIndex(apiMode => isApiModeSelected(apiMode, session))}
            onChange={(e) => {
              let apiMode = null
              let modelName = 'customModel'
              if (e.target.value !== '-1') {
                apiMode = apiModes[e.target.value]
                modelName = apiModeToModelName(apiMode)
              }
              const newSession = {
                ...session,
                modelName,
                apiMode,
                aiName: modelNameToDesc(
                  apiMode ? apiModeToModelName(apiMode) : modelName,
                  t,
                  config.customModelName,
                ),
              }
              if (config.autoRegenAfterSwitchModel && conversationItemData.length > 0)
                getRetryFn(newSession)()
              else setSession(newSession)
            }}
          >
            {apiModes.map((apiMode, index) => {
              const modelName = apiModeToModelName(apiMode)
              const desc = modelNameToDesc(modelName, t, config.customModelName)
              if (desc) {
                return (
                  <option value={index} key={index}> {/* Removed selected, rely on select value prop */}
                    {desc}
                  </option>
                )
              }
              return null; // Added to handle cases where desc might be empty
            })}
            <option value={-1} > {/* Removed selected */}
              {t(Models.customModel.desc)}
            </option>
          </select>
        </div>

        {props.draggable && !completeDraggable && (
          <div className="draggable-area" /> // Use class for styling
        )}

        <div className="gpt-util-group"> {/* Right group */}
          {!config.disableWebModeHistory && session && session.conversationId && (
            <a
              title={t('Continue on official website')}
              href={'https://chatgpt.com/chat/' + session.conversationId}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="gpt-util-icon" // Styled by SCSS
            >
              <LinkExternalIcon size={16} />
            </a>
          )}
          <span
            className="gpt-util-icon"
            title={t('Float the Window')}
            onClick={() => {
              const position = { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 }
              const toolbarContainer = createElementAtPosition(position.x, position.y)
              toolbarContainer.className = 'chatgptbox-toolbar-container-not-queryable' // Keep this class
              render(
                <FloatingToolbar
                  session={session}
                  selection=""
                  container={toolbarContainer}
                  closeable={true}
                  triggered={true}
                />,
                toolbarContainer,
              )
            }}
          >
            <WindowDesktop size={16} />
          </span>
          <DeleteButton // This is already a component, ensure it uses gpt-util-icon style internally or pass className
            size={16} // Prop for icon size
            text={t('Clear Conversation')} // Tooltip or aria-label
            className="gpt-util-icon" // Pass class for consistent styling
            onConfirm={async () => {
              await postMessage({ stop: true })
              Browser.runtime.sendMessage({
                type: 'DELETE_CONVERSATION', data: { conversationId: session.conversationId },
              })
              setConversationItemData([])
              const newSession = initSession({
                ...session, question: null, conversationRecords: [],
              })
              newSession.sessionId = session.sessionId // Preserve session ID
              setSession(newSession)
            }}
          />
          {/* "More Options" Dropdown */}
          <div style={{ position: 'relative' }} ref={moreOptionsRef}>
            <span
                className="gpt-util-icon"
                title={t('More options')}
                onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
                <KebabHorizontalIcon size={16} />
            </span>
            {showMoreOptions && (
                <div className="dropdown-menu" style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    minWidth: '180px'
                }}>
                    {!props.pageMode && (
                    <button className="dropdown-item" onClick={() => {
                        const newSession = {
                        ...session, sessionName: new Date().toLocaleString(), autoClean: false, sessionId: uuidv4(),
                        };
                        setSession(newSession);
                        createSession(newSession).then(() =>
                        Browser.runtime.sendMessage({
                            type: 'OPEN_URL', data: { url: Browser.runtime.getURL('IndependentPanel.html') + '?from=store' },
                        }),
                        );
                        setShowMoreOptions(false);
                    }}>
                        <ArchiveIcon size={16} /> {t('Store to Independent Page')}
                    </button>
                    )}
                    {conversationItemData.length > 0 && (
                    <button className="dropdown-item" onClick={() => {
                        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
                        setShowMoreOptions(false);
                    }}>
                        <MoveToBottomIcon size={16} /> {t('Jump to bottom')}
                    </button>
                    )}
                    <button className="dropdown-item" onClick={() => {
                        let output = '';
                        session.conversationRecords.forEach((data) => {
                        output += `${t('Question')}:\n\n${data.question}\n\n${t('Answer')}:\n\n${data.answer}\n\n<hr/>\n\n`;
                        });
                        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
                        FileSaver.saveAs(blob, 'conversation.md');
                        setShowMoreOptions(false);
                    }}>
                        <DesktopDownloadIcon size={16} /> {t('Save Conversation')}
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
      {/* hr removed, using border-bottom on header now */}
      <div
        ref={bodyRef}
        className="markdown-body" // Styled by SCSS
        style={ // Keep dynamic style for resize, remove maxHeight if pageMode
          props.notClampSize || props.pageMode
            ? { flexGrow: 1 } // pageMode should allow full growth
            : { maxHeight: windowSize[1] * 0.55 + 'px', resize: 'vertical' }
        }
      >
        {conversationItemData.map((data, idx) => (
          <ConversationItem
            content={data.content}
            key={idx}
            type={data.type}
            // Pass aiName to ConversationItem for styling answer blocks if needed
            descName={data.type === 'answer' && session.aiName}
            onRetry={idx === conversationItemData.length - 1 && data.type !== 'question' ? retryFn : null} // Retry only on last non-question
          />
        ))}
      </div>
      {props.waitForTrigger && !triggered ? (
        // Styled by SCSS via .manual-btn and .icon-and-text
        <p className="manual-btn"
          onClick={() => {
            setConversationItemData([ new ConversationItemData('answer', `<p class="gpt-loading">${t(`Waiting for response...`)}</p>`)]);
            setTriggered(true);
            setIsReady(false);
          }}
        >
          <span className="icon-and-text">
            <SearchIcon size={16} /> {t('Ask ChatGPT')}
          </span>
        </p>
      ) : (
        // Added a wrapper for InputBox to allow padding/margin if needed from ConversationCard's layout
        <div className="input-box-wrapper">
            <InputBox
            enabled={isReady}
            postMessage={postMessage}
            reverseResizeDir={props.pageMode && !isSafari() && !isFirefox() && !isMobile()} // Only enable for pageMode on supported browsers
            onSubmit={async (question) => {
                const newQuestion = new ConversationItemData('question', question, true); // Question is always done
                const newAnswer = new ConversationItemData('answer', `<p class="gpt-loading">${t('Waiting for response...')}</p>`);
                setConversationItemData([...conversationItemData, newQuestion, newAnswer]);
                setIsReady(false);

                const newSession = { ...session, question, isRetry: false };
                setSession(newSession); // Update session state
                try {
                await postMessage({ session: newSession });
                } catch (e) {
                updateAnswer(`<div class="gpt-error">${e.message || String(e)}</div>`, false, 'error', true);
                }
                if (bodyRef.current) { // Ensure ref is set
                    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'instant' });
                }
            }}
            />
        </div>
      )}
    </div>
  )
}

ConversationCard.propTypes = {
  session: PropTypes.object.isRequired,
  question: PropTypes.string,
  onUpdate: PropTypes.func,
  draggable: PropTypes.bool,
  closeable: PropTypes.bool,
  onClose: PropTypes.func,
  dockable: PropTypes.bool,
  onDock: PropTypes.func,
  notClampSize: PropTypes.bool,
  pageMode: PropTypes.bool,
  waitForTrigger: PropTypes.bool,
}

// Styling for dropdown items (could also be in styles.scss)
const MemoizedConversationCard = memo(ConversationCard);

// Add this to your styles.scss or a shared component SCSS file:
// .dropdown-menu {
//   /* Styles defined in JSX for brevity, move to SCSS for production */
// }
// .dropdown-item {
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   padding: 8px 12px;
//   background: none;
//   border: none;
//   width: 100%;
//   text-align: left;
//   color: var(--text-color);
//   cursor: pointer;
//   font-size: 14px;
// }
// .dropdown-item:hover {
//   background-color: var(--active-color); // Or a more subtle hover like primary-color-translucent
// }


export default MemoizedConversationCard;
