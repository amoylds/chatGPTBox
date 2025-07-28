import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  defaultConfig,
  getPreferredLanguageKey,
  getUserConfig,
  setUserConfig,
} from '../config/index.mjs'
import Browser from 'webextension-polyfill'
import { useWindowTheme } from '../hooks/use-window-theme.mjs'
import { isMobile } from '../utils/index.mjs'
import { useTranslation } from 'react-i18next'
import { GeneralPart } from './sections/GeneralPart'
import { FeaturePages } from './sections/FeaturePages'
import { AdvancedPart } from './sections/AdvancedPart'
import { ModulesPart } from './sections/ModulesPart'
import { ModernPopup } from '../components/ModernUI'

// 现代化底部信息组件
function ModernFooter({ currentVersion, latestVersion }) {
  const { t } = useTranslation()

  return (
    <div className="modern-footer">
      <div className="footer-links">
        <a 
          href="https://github.com/josStorer/chatGPTBox" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          <span className="link-icon">⭐</span>
          {t('Star on GitHub')}
        </a>
        <a 
          href="https://github.com/josStorer/chatGPTBox/releases" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          <span className="link-icon">📋</span>
          {t('Changelog')}
        </a>
        <a 
          href="https://github.com/josStorer/chatGPTBox/issues" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          <span className="link-icon">🐛</span>
          {t('Report Issue')}
        </a>
      </div>
      <div className="footer-info">
        <div className="version-info">
          <span className="version-label">{t('Version')}:</span>
          <span className="version-current">{currentVersion}</span>
          {currentVersion < latestVersion && (
            <a
              href={`https://github.com/josStorer/chatGPTBox/releases/tag/v${latestVersion}`}
              target="_blank"
              rel="noopener noreferrer"
              className="version-update"
            >
              {t('Update to')} {latestVersion}
            </a>
          )}
        </div>
        <span className="footer-text">{t('Made with ❤️ for productivity')}</span>
      </div>
    </div>
  )
}

ModernFooter.propTypes = {
  currentVersion: PropTypes.string.isRequired,
  latestVersion: PropTypes.string.isRequired
}

function Popup() {
  const { t, i18n } = useTranslation()
  const [config, setConfig] = useState(defaultConfig)
  const [currentVersion, setCurrentVersion] = useState('')
  const [latestVersion, setLatestVersion] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  const theme = useWindowTheme()

  const updateConfig = async (value) => {
    setConfig({ ...config, ...value })
    await setUserConfig(value)
  }

  useEffect(() => {
    getPreferredLanguageKey().then((lang) => {
      i18n.changeLanguage(lang)
    })
    getUserConfig().then((config) => {
      setConfig(config)
      setCurrentVersion(Browser.runtime.getManifest().version.replace('v', ''))
      fetch('https://api.github.com/repos/josstorer/chatGPTBox/releases/latest')
        .then((response) => response.json())
        .then((data) => {
          setLatestVersion(data.tag_name.replace('v', ''))
        })
        .catch(() => {
          // 如果获取失败，设置为当前版本
          setLatestVersion(currentVersion)
        })
    })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = config.themeMode === 'auto' ? theme : config.themeMode
  }, [config.themeMode, theme])

  const search = new URLSearchParams(window.location.search)
  const popup = !isMobile() && search.get('popup') // manifest v2

  // 定义标签页配置
  const tabs = [
    {
      id: 'general',
      label: t('General'),
      icon: '⚙️'
    },
    {
      id: 'features',
      label: t('Feature Pages'),
      icon: '🔧'
    },
    {
      id: 'modules',
      label: t('Modules'),
      icon: '🧩'
    },
    {
      id: 'advanced',
      label: t('Advanced'),
      icon: '🔬'
    }
  ]

  // 渲染标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralPart config={config} updateConfig={updateConfig} setTabIndex={(index) => setActiveTab(tabs[index].id)} />
      case 'features':
        return <FeaturePages config={config} updateConfig={updateConfig} />
      case 'modules':
        return <ModulesPart config={config} updateConfig={updateConfig} />
      case 'advanced':
        return <AdvancedPart config={config} updateConfig={updateConfig} />
      default:
        return <GeneralPart config={config} updateConfig={updateConfig} setTabIndex={(index) => setActiveTab(tabs[index].id)} />
    }
  }

  return (
    <div className={popup === 'true' ? 'popup-mode' : 'page-mode'}>
      <ModernPopup
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      >
        <div className="tab-content">
          {renderTabContent()}
        </div>
        
        {/* 自定义底部 */}
        <div className="custom-footer">
          <ModernFooter 
            currentVersion={currentVersion} 
            latestVersion={latestVersion} 
          />
        </div>
      </ModernPopup>
    </div>
  )
}

export default Popup
