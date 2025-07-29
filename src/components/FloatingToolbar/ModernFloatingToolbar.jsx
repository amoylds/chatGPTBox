import { useState, useEffect, cloneElement } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { useConfig } from '../../hooks/use-config.mjs'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size.mjs'
import { getClientPosition } from '../../utils'
import { config as toolsConfig } from '../../content-script/selection-tools'
import { ModernSelectionToolbar, ModernChatBox } from '../ModernUI'

function ModernFloatingToolbar(props) {
  const { t } = useTranslation()
  const [selection, setSelection] = useState(props.selection)
  const [prompt, setPrompt] = useState(props.prompt)
  const [triggered, setTriggered] = useState(props.triggered)
  const [render, setRender] = useState(false)
  const [position, setPosition] = useState(getClientPosition(props.container))
  const [virtualPosition, setVirtualPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [messages, setMessages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const windowSize = useClampWindowSize([750, 1500], [0, Infinity])
  
  const [config] = useConfig()

  useEffect(() => {
    setRender(true)
    if (!triggered && selection) {
      props.container.style.position = 'absolute'
      setTimeout(() => {
        const left = Math.min(
          Math.max(10, position.x - windowSize[0] * 0.2),
          window.innerWidth - windowSize[0] * 0.4 - 10,
        )
        const top = Math.min(Math.max(10, position.y + 20), window.innerHeight - 600 - 10)
        setVirtualPosition({ x: left, y: top })
      }, 200)
    }
  }, [triggered, selection, position.x, position.y, windowSize])

  useEffect(() => {
    setSelection(props.selection)
    setPrompt(props.prompt)
    setTriggered(props.triggered)
  }, [props.selection, props.prompt, props.triggered])

  const onClose = () => {
    props.container.remove()
  }

  const onDock = () => {
    props.container.className = 'chatgptbox-toolbar-container-not-queryable'
  }

  const handleSendMessage = async (message) => {
    // 添加用户消息
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)

    try {
      // 这里应该调用实际的API
      // 暂时模拟响应
      setTimeout(() => {
        const assistantMessage = {
          type: 'assistant',
          content: `This is a response to: "${message}"`,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsGenerating(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsGenerating(false)
    }
  }

  const handleStopGeneration = () => {
    setIsGenerating(false)
  }

  const dragEvent = {
    onDrag: () => {
      setIsDragging(true)
    },
    onStop: () => {
      setIsDragging(false)
    }
  }

  if (!render) return <div />

  // 如果已触发或有提示词，显示聊天界面
  if (triggered || prompt) {
    if (config.alwaysPinWindow) onDock()

    return (
      <div data-theme={config.themeMode}>
        <ModernChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={onClose}
          onMinimize={() => {}} // 可以添加最小化功能
          isDragging={isDragging}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          position={virtualPosition}
          onDrag={dragEvent.onDrag}
          onStop={dragEvent.onStop}
          className="floating-chat"
        />
      </div>
    )
  } else {
    // 显示选择工具栏
    if (
      config.activeSelectionTools.length === 0 &&
      config.customSelectionTools.reduce((count, tool) => count + (tool.active ? 1 : 0), 0) === 0
    )
      return <div />

    const tools = []
    
    // 构建工具列表
    for (const key in toolsConfig) {
      if (config.activeSelectionTools.includes(key)) {
        const toolConfig = toolsConfig[key]
        tools.push({
          id: key,
          icon: cloneElement(toolsConfig[key].icon, { size: 18 }),
          label: t(toolConfig.label),
          genPrompt: toolConfig.genPrompt
        })
      }
    }
    
    for (const tool of config.customSelectionTools) {
      if (tool.active) {
        tools.push({
          id: tool.name,
          icon: cloneElement(toolsConfig[tool.iconKey].icon, { size: 18 }),
          label: tool.name,
          genPrompt: async (selection) => {
            return tool.prompt.replace('{{selection}}', selection)
          }
        })
      }
    }

    const handleToolClick = async (tool, selectedText) => {
      const p = getClientPosition(props.container)
      props.container.style.position = 'fixed'
      setPosition(p)
      setPrompt(await tool.genPrompt(selectedText))
      setTriggered(true)
    }

    return (
      <div data-theme={config.themeMode}>
        <ModernSelectionToolbar
          tools={tools}
          selectedText={selection}
          position={position}
          onToolClick={handleToolClick}
          onClose={onClose}
          isVisible={true}
          className="floating-toolbar"
        />
      </div>
    )
  }
}

ModernFloatingToolbar.propTypes = {
  session: PropTypes.object.isRequired,
  selection: PropTypes.string.isRequired,
  container: PropTypes.object.isRequired,
  triggered: PropTypes.bool,
  closeable: PropTypes.bool,
  dockable: PropTypes.bool,
  prompt: PropTypes.string,
}

export default ModernFloatingToolbar
