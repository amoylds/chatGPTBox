// 现代化浮动工具栏入口文件
// 根据配置决定使用现代化版本还是传统版本

import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useConfig } from '../../hooks/use-config.mjs'
import ModernFloatingToolbar from './ModernFloatingToolbar'
import LegacyFloatingToolbar from './LegacyFloatingToolbar'

function FloatingToolbar(props) {
  const [config] = useConfig()
  const [useModernUI, setUseModernUI] = useState(false)

  useEffect(() => {
    // 检查是否启用现代化UI
    // 可以通过配置项或者其他条件来决定
    const shouldUseModernUI = config.enableModernUI !== false // 默认启用现代化UI
    setUseModernUI(shouldUseModernUI)
  }, [config])

  // 根据配置选择使用现代化版本或传统版本
  if (useModernUI) {
    return <ModernFloatingToolbar {...props} />
  } else {
    return <LegacyFloatingToolbar {...props} />
  }
}

FloatingToolbar.propTypes = {
  session: PropTypes.object.isRequired,
  selection: PropTypes.string.isRequired,
  container: PropTypes.object.isRequired,
  triggered: PropTypes.bool,
  closeable: PropTypes.bool,
  dockable: PropTypes.bool,
  prompt: PropTypes.string,
}

export default FloatingToolbar
