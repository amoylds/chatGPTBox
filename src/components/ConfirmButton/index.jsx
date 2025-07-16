import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

ConfirmButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  className: PropTypes.string, // Allow passing additional classes
}

function ConfirmButton({ onConfirm, text, className = '' }) {
  const { t } = useTranslation()
  const [waitConfirm, setWaitConfirm] = useState(false)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (waitConfirm) confirmRef.current.focus()
  }, [waitConfirm])

  return (
    <span className={`confirm-button-container ${className}`}>
      {waitConfirm && (
        <button
          ref={confirmRef}
          type="button"
          // Use a specific class for the confirm action button, styled with error color globally or locally
          className="button error" // 'button' for base styles, 'error' for color
          aria-roledescription="confirm-action" // For semantic meaning / specific styling
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onBlur={() => {
            setWaitConfirm(false)
          }}
          onClick={() => {
            setWaitConfirm(false)
            onConfirm()
          }}
        >
          {t('Confirm')}
        </button>
      )}
      {!waitConfirm && (
        <button
          type="button"
          className="button muted" // Default to muted style, can be overridden by passing className
          aria-roledescription="initial-action"
          onClick={() => {
            setWaitConfirm(true)
          }}
        >
          {text}
        </button>
      )}
    </span>
  )
}

export default ConfirmButton
