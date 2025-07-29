import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import Browser from 'webextension-polyfill'
import './ModernPopup.scss'

// 现代化标签页导航组件
function ModernTabNavigation({ activeTab, onTabChange, tabs }) {
  return (
    <div className="modern-tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

ModernTabNavigation.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string
  })).isRequired
}

// 现代化品牌区域组件
function ModernBrandSection({ version }) {
  return (
    <div className="brand-section">
      <div className="logo-container">
        <img src="/logo.png" alt="ChatGPTBox" className="logo-modern" />
        <span className="brand-text">ChatGPTBox</span>
      </div>
      <div className="version-badge">v{version}</div>
    </div>
  )
}

ModernBrandSection.propTypes = {
  version: PropTypes.string.isRequired
}

// 现代化底部信息栏组件
function ModernFooter({ currentVersion = '', latestVersion = '' }) {
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
        {currentVersion && (
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
        )}
        <span className="footer-text">{t('Made with ❤️ for productivity')}</span>
      </div>
    </div>
  )
}

ModernFooter.propTypes = {
  currentVersion: PropTypes.string,
  latestVersion: PropTypes.string
}

// 设置卡片组件
function SettingCard({ title, description, children, className = '' }) {
  return (
    <div className={`setting-card ${className}`}>
      <div className="setting-header">
        <h3 className="setting-title">{title}</h3>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <div className="setting-content">
        {children}
      </div>
    </div>
  )
}

SettingCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

// 现代化开关组件
function ModernSwitch({ checked, onChange, label, description }) {
  return (
    <div className="modern-switch-container">
      <div className="switch-info">
        <label className="switch-label">{label}</label>
        {description && <span className="switch-description">{description}</span>}
      </div>
      <button
        className={`modern-switch ${checked ? 'checked' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="switch-thumb"></span>
      </button>
    </div>
  )
}

ModernSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string
}

// 现代化选择器组件
function ModernSelect({ value, onChange, options, label, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = options.find(opt => opt.value === value)
  
  return (
    <div className="modern-select-container">
      {label && <label className="select-label">{label}</label>}
      <div className={`modern-select ${isOpen ? 'open' : ''}`}>
        <button
          className="select-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="select-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="select-arrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
        {isOpen && (
          <div className="select-dropdown">
            {options.map((option) => (
              <button
                key={option.value}
                className={`select-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

ModernSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string
}

// 主弹出窗口组件
export function ModernPopup({ children, activeTab, onTabChange, tabs, currentVersion, latestVersion }) {
  const [version, setVersion] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 获取扩展版本信息
    const manifest = Browser.runtime.getManifest()
    setVersion(manifest.version)
    
    // 添加加载动画
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  return (
    <div className={`modern-popup ${isLoaded ? 'loaded' : ''}`}>
      {/* 头部区域 */}
      <div className="popup-header">
        <ModernBrandSection version={version} />
      </div>

      {/* 导航区域 */}
      <div className="popup-navigation">
        <ModernTabNavigation 
          activeTab={activeTab}
          onTabChange={onTabChange}
          tabs={tabs}
        />
      </div>

      {/* 内容区域 */}
      <div className="popup-content">
        <div className="content-container">
          {children}
        </div>
      </div>

      {/* 底部区域 */}
      <div className="popup-footer">
        <ModernFooter currentVersion={currentVersion || version} latestVersion={latestVersion || version} />
      </div>
    </div>
  )
}

ModernPopup.propTypes = {
  children: PropTypes.node.isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string
  })).isRequired,
  currentVersion: PropTypes.string,
  latestVersion: PropTypes.string
}

// 导出所有组件
export {
  ModernTabNavigation,
  ModernBrandSection,
  ModernFooter,
  SettingCard,
  ModernSwitch,
  ModernSelect
}
