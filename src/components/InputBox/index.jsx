import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { isFirefox, isMobile, isSafari, updateRefHeight } from '../../utils'
import { useTranslation } from 'react-i18next'
import { getUserConfig } from '../../config/index.mjs'

// Add some basic styling for the input-box container itself if needed,
// or ensure it's styled by its parent.
// For example, in a new CSS/SCSS file or existing one:
// .input-box {
//   display: flex;
//   flex-direction: column; // Or 'row' if button is beside textarea
//   gap: 8px; // Space between textarea and button
//   padding: 8px; // Padding around the input box
//   border-top: 1px solid var(--border-color); // Separator if needed
// }
// .input-box textarea { /* Already styled globally */ }
// .input-box .submit-button { /* Already styled globally */ }
// .input-box .submit-button.ask { background-color: var(--success-color); border-color: var(--success-color); color: var(--button-text-color); }
// .input-box .submit-button.ask:hover { background-color: color-mix(in srgb, var(--success-color) 90%, black); border-color: color-mix(in srgb, var(--success-color) 90%, black); }
// .input-box .submit-button.stop { background-color: var(--error-color); border-color: var(--error-color); color: var(--button-text-color); }
// .input-box .submit-button.stop:hover { background-color: color-mix(in srgb, var(--error-color) 90%, black); border-color: color-mix(in srgb, var(--error-color) 90%, black); }


export function InputBox({ onSubmit, enabled, postMessage, reverseResizeDir }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const reverseDivRef = useRef(null)
  const inputRef = useRef(null)
  const resizedRef = useRef(false)
  const [internalReverseResizeDir, setInternalReverseResizeDir] = useState(reverseResizeDir)

  useEffect(() => {
    setInternalReverseResizeDir(
      !isSafari() && !isFirefox() && !isMobile() ? internalReverseResizeDir : false,
    )
  }, [internalReverseResizeDir, reverseResizeDir]) // Added internalReverseResizeDir to dependency array

  const virtualInputRef = internalReverseResizeDir ? reverseDivRef : inputRef

  useEffect(() => {
    if (inputRef.current) { // Check if ref is defined
      inputRef.current.focus()

      const onResizeY = () => {
        if (virtualInputRef.current && virtualInputRef.current.h !== virtualInputRef.current.offsetHeight) {
          virtualInputRef.current.h = virtualInputRef.current.offsetHeight
          if (!resizedRef.current) {
            resizedRef.current = true
            virtualInputRef.current.style.maxHeight = ''
          }
        }
      }
      if (virtualInputRef.current) { // Check if ref is defined
        virtualInputRef.current.h = virtualInputRef.current.offsetHeight
        virtualInputRef.current.addEventListener('mousemove', onResizeY)
      }
      // Cleanup event listener
      return () => {
        if (virtualInputRef.current) {
          virtualInputRef.current.removeEventListener('mousemove', onResizeY);
        }
      }
    }
  }, [virtualInputRef]) // virtualInputRef is now a dependency

  useEffect(() => {
    if (inputRef.current && !resizedRef.current) { // Check if ref is defined
      if (!internalReverseResizeDir) {
        updateRefHeight(inputRef)
        if (virtualInputRef.current) { // Check if ref is defined
            virtualInputRef.current.h = virtualInputRef.current.offsetHeight
            virtualInputRef.current.style.maxHeight = '160px' // This is a global style now effectively
        }
      }
    }
  }) // Removed virtualInputRef from here as it caused issues, original had no deps

  useEffect(() => {
    if (enabled && inputRef.current) // Check if ref is defined
      getUserConfig().then((config) => {
        if (config.focusAfterAnswer) inputRef.current.focus()
      })
  }, [enabled])

  const handleKeyDownOrClick = (e) => {
    e.stopPropagation()
    if (e.type === 'click' || (e.key === 'Enter' && e.shiftKey === false)) { // Changed from keyCode
      e.preventDefault()
      if (enabled) {
        if (!value.trim()) return // Check for trimmed value
        onSubmit(value)
        setValue('')
      } else {
        postMessage({ stop: true })
      }
    }
  }

  const submitButtonClass = enabled ? 'button ask' : 'button stop'; // Uses 'button' base + specific state

  return (
    // The input-box class would be styled in a global SCSS file
    // e.g., src/content-script/styles.scss or src/components/components.scss
    <div className="input-box">
      <div
        ref={reverseDivRef}
        style={
          internalReverseResizeDir
            ? {
                transform: 'rotateX(180deg)',
                resize: 'vertical', // This is now default for textarea, might not be needed here
                overflow: 'hidden',
                // minHeight: '160px', // This is now default for textarea
              }
            : {}
        }
      >
        <textarea
          dir="auto"
          ref={inputRef}
          // disabled={false} // 'disabled' attribute not needed if always false
          // className="interact-input" // Default textarea styling is now global
          style={
            internalReverseResizeDir
              ? { transform: 'rotateX(180deg)', resize: 'none' } // resize: 'none' if parent handles it
              : { resize: 'vertical', minHeight: '70px' } // minHeight can be a class or default
          }
          placeholder={
            enabled
              ? t('Type your question here\nEnter to send, shift + enter to break line')
              : t('Type your question here\nEnter to stop generating\nShift + enter to break line')
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDownOrClick}
          rows={3} // Suggest initial rows, CSS min-height will also apply
        />
      </div>
      <button
        className={submitButtonClass}
        // style removed, handled by 'ask'/'stop' classes
        onClick={handleKeyDownOrClick}
      >
        {enabled ? t('Ask') : t('Stop')}
      </button>
    </div>
  )
}

InputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired,
  reverseResizeDir: PropTypes.bool,
  postMessage: PropTypes.func.isRequired,
}

export default InputBox
