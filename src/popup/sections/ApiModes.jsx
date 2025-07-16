import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  apiModeToModelName,
  getApiModesFromConfig,
  isApiModeSelected,
  modelNameToDesc,
} from '../../utils/index.mjs'
import { PencilIcon, TrashIcon } from '@primer/octicons-react'
import { useLayoutEffect, useState } from 'react'
import {
  AlwaysCustomGroups,
  CustomApiKeyGroups,
  CustomUrlGroups,
  ModelGroups,
} from '../../config/index.mjs'

ApiModes.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

const defaultApiMode = {
  groupName: 'chatgptWebModelKeys',
  itemName: 'chatgptFree35',
  isCustom: false,
  customName: '',
  customUrl: 'http://localhost:8000/v1/chat/completions',
  apiKey: '',
  thinkingBudget: 0,
  active: true,
}

export function ApiModes({ config, updateConfig }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [editingApiMode, setEditingApiMode] = useState(defaultApiMode)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [apiModes, setApiModes] = useState([])
  const [apiModeStringArray, setApiModeStringArray] = useState([])

  useLayoutEffect(() => {
    const apiModes = getApiModesFromConfig(config)
    setApiModes(apiModes)
    setApiModeStringArray(apiModes.map(apiModeToModelName))
  }, [
    config.activeApiModes,
    config.customApiModes,
    config.azureDeploymentName,
    config.ollamaModelName,
  ])

  const updateWhenApiModeDisabled = (apiMode) => {
    if (isApiModeSelected(apiMode, config))
      updateConfig({
        modelName:
          apiModeStringArray.includes(config.modelName) &&
          config.modelName !== apiModeToModelName(apiMode)
            ? config.modelName
            : 'customModel',
        apiMode: null,
      })
  }

  const editingComponent = (
    // Added a class for potential specific styling of the editing form
    <div className="api-mode-edit-form" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pico-form-element-spacing-vertical, 1rem)' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="button muted" // Added class
          onClick={(e) => {
            e.preventDefault()
            setEditing(false)
          }}
        >
          {t('Cancel')}
        </button>
        <button
          className="button primary" // Added class
          onClick={(e) => {
            e.preventDefault()
            if (editingIndex === -1) {
              updateConfig({
                activeApiModes: [], // This seems to reset active modes, intentional?
                customApiModes: [...apiModes, editingApiMode],
              })
            } else {
              const apiMode = apiModes[editingIndex]
              if (isApiModeSelected(apiMode, config)) updateConfig({ apiMode: editingApiMode })
              const customApiModes = [...apiModes]
              customApiModes[editingIndex] = editingApiMode
              updateConfig({ activeApiModes: [], customApiModes })
            }
            setEditing(false)
          }}
        >
          {t('Save')}
        </button>
      </div>
      {/* Each form row can be a div with display:flex for alignment */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{whiteSpace: 'nowrap'}}>{t('Type')}:</span>
        <select
          value={editingApiMode.groupName}
          onChange={(e) => {
            const newGroupName = e.target.value
            let newItemName = ModelGroups[newGroupName].value[0]
            const newIsCustom =
              editingApiMode.itemName === 'custom' && !AlwaysCustomGroups.includes(newGroupName)
            if (newIsCustom) newItemName = 'custom'

            let newCustomUrl = editingApiMode.customUrl
            let newThinkingBudget = editingApiMode.thinkingBudget ?? 0
            const isNewUrlForNewOrUnchangedDefault = editingIndex === -1 || editingApiMode.customUrl === defaultApiMode.customUrl ||
                                         (editingApiMode.groupName === 'customApiModelKeys' && editingApiMode.customUrl === config.customModelApiUrl) ||
                                         (editingApiMode.groupName === 'geminiApiModelKeys' && editingApiMode.customUrl === config.geminiApiUrl) ||
                                         (editingApiMode.groupName === 'ollamaApiModelKeys' && editingApiMode.customUrl === config.ollamaEndpoint)


            if (isNewUrlForNewOrUnchangedDefault) {
              if (newGroupName === 'geminiApiModelKeys') {
                newCustomUrl = config.geminiApiUrl
                newThinkingBudget = config.geminiThinkingBudget
              } else if (newGroupName === 'customApiModelKeys') {
                newCustomUrl = config.customModelApiUrl
              } else if (newGroupName === 'ollamaApiModelKeys') {
                newCustomUrl = config.ollamaEndpoint
              } else if (!CustomUrlGroups.includes(newGroupName)) {
                newCustomUrl = ''
              } else {
                newCustomUrl = defaultApiMode.customUrl
              }
            }

            setEditingApiMode({
              ...editingApiMode,
              groupName: newGroupName,
              itemName: newItemName,
              isCustom: newIsCustom,
              customUrl: newCustomUrl,
              apiKey: CustomApiKeyGroups.includes(newGroupName) ? editingApiMode.apiKey : '',
              thinkingBudget: newGroupName === 'geminiApiModelKeys' ? newThinkingBudget : 0,
            })
          }}
        >
          {Object.entries(ModelGroups).map(([groupName, { desc }]) => (
            <option key={groupName} value={groupName}>
              {t(desc)}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <span style={{whiteSpace: 'nowrap'}}>{t('Mode')}:</span>
        <select
          value={editingApiMode.itemName}
          onChange={(e) => {
            const itemName = e.target.value
            const isCustom = itemName === 'custom'
            setEditingApiMode({ ...editingApiMode, itemName, isCustom })
          }}
        >
          {ModelGroups[editingApiMode.groupName].value.map((itemName) => (
            <option key={itemName} value={itemName}>
              {modelNameToDesc(itemName, t)}
            </option>
          ))}
          {!AlwaysCustomGroups.includes(editingApiMode.groupName) && (
            <option value="custom">{t('Custom')}</option>
          )}
        </select>
        {(editingApiMode.isCustom || AlwaysCustomGroups.includes(editingApiMode.groupName)) && (
          <input
            type="text"
            value={editingApiMode.customName}
            placeholder={t('Model Name')}
            onChange={(e) => setEditingApiMode({ ...editingApiMode, customName: e.target.value })}
          />
        )}
      </div>
      {CustomUrlGroups.includes(editingApiMode.groupName) &&
        (editingApiMode.isCustom || AlwaysCustomGroups.includes(editingApiMode.groupName)) && (
          <input // This input will take full width if not in a flex row with a label
            type="text"
            value={editingApiMode.customUrl}
            placeholder={t('API Url')}
            onChange={(e) => setEditingApiMode({ ...editingApiMode, customUrl: e.target.value })}
          />
        )}
      {CustomApiKeyGroups.includes(editingApiMode.groupName) &&
        (editingApiMode.isCustom || AlwaysCustomGroups.includes(editingApiMode.groupName)) && (
          <input
            type="password"
            value={editingApiMode.apiKey}
            placeholder={t('API Key')}
            onChange={(e) => setEditingApiMode({ ...editingApiMode, apiKey: e.target.value })}
          />
        )}
      {editingApiMode.groupName === 'geminiApiModelKeys' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{whiteSpace: 'nowrap'}}>{t('Thinking Budget')}:</span>
          <input
            type="number"
            value={editingApiMode.thinkingBudget || 0}
            placeholder={t('e.g., 1024')}
            min="0"
            step="1"
            onChange={(e) =>
              setEditingApiMode({
                ...editingApiMode,
                thinkingBudget: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      {apiModes.map(
        (apiMode, index) =>
          apiMode.groupName &&
          apiMode.itemName &&
          (editing && editingIndex === index ? (
            editingComponent
          ) : (
            // Each API mode row is a label for checkbox, with flex for alignment
            <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={apiMode.active}
                onChange={(e) => {
                  if (!e.target.checked) updateWhenApiModeDisabled(apiMode)
                  const customApiModes = [...apiModes]
                  customApiModes[index] = { ...apiMode, active: e.target.checked }
                  updateConfig({ activeApiModes: [], customApiModes })
                }}
              />
              <span style={{flexGrow: 1}}>{modelNameToDesc(apiModeToModelName(apiMode), t)}</span>
              {/* <div style={{ flexGrow: 1 }} /> */} {/* Replaced with flexGrow on span */}
              <div style={{ display: 'flex', gap: '8px' }}> {/* Reduced gap for icons */}
                <button // Changed div to button for accessibility and styling
                  className="popup-icon-button"
                  title={t("Edit")}
                  onClick={(e) => {
                    e.preventDefault()
                    setEditing(true)
                    setEditingApiMode(apiMode)
                    setEditingIndex(index)
                  }}
                >
                  <PencilIcon />
                </button>
                <button // Changed div to button
                  className="popup-icon-button"
                  title={t("Delete")}
                  onClick={(e) => {
                    e.preventDefault()
                    updateWhenApiModeDisabled(apiMode)
                    const customApiModes = [...apiModes]
                    customApiModes.splice(index, 1)
                    updateConfig({ activeApiModes: [], customApiModes })
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            </label>
          )),
      )}
      <div style={{ height: 'var(--pico-form-element-spacing-vertical, 1rem)' }} /> {/* Use variable for spacing */}
      {editing ? (
        editingIndex === -1 ? (
          editingComponent
        ) : undefined
      ) : (
        <button
          className="button muted" // Added class
          onClick={(e) => {
            e.preventDefault()
            setEditing(true)
            setEditingApiMode(defaultApiMode)
            setEditingIndex(-1)
          }}
        >
          {t('New')}
        </button>
      )}
    </>
  )
}
