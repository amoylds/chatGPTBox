// Gemini API service
import { getUserConfig } from '../../config/index.mjs'
import { fetchSSE } from '../../utils/fetch-sse.mjs'
import { getConversationPairs } from '../../utils/get-conversation-pairs.mjs'
import { isEmpty } from 'lodash-es'
import { pushRecord, setAbortController } from './shared.mjs'

/**
 * @param {Array<{role: string, content: string}>} openAiHistory
 * @returns {Array<{role: string, parts: Array<{text: string}>}>}
 */
function convertToGeminiHistory(openAiHistory) {
  return openAiHistory.map((item) => ({
    role: item.role === 'assistant' ? 'model' : item.role, // Gemini uses 'model' for assistant
    parts: [{ text: item.content }],
  }))
}

function getRequestPayload(geminiHistory, config, session) {
  const payload = {
    contents: geminiHistory,
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxResponseTokenLength,
      // candidateCount: 1, // Default is 1
    },
    // safetySettings: [], // Optional: Add if specific safety settings are needed
  }

  const thinkingBudget = session.apiMode?.thinkingBudget ?? config.geminiThinkingBudget
  if (thinkingBudget && thinkingBudget > 0) {
    payload.generationConfig.thinkingConfig = {
      includeThoughts: true,
      thinkingBudget: parseInt(thinkingBudget, 10),
    }
  }
  return payload
}

/**
 * @param {Browser.Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} apiUrl The base URL like https://generativelanguage.googleapis.com
 * @param {string} apiKey
 * @param {string} modelName The specific model (e.g., gemini-pro)
 */
export async function generateAnswersWithGeminiApi(
  port,
  question,
  session,
  apiUrl,
  apiKey,
  modelName,
) {
  const { controller, messageListener, disconnectListener } = setAbortController(port)

  const config = await getUserConfig()

  const openAiHistory = getConversationPairs(
    session.conversationRecords.slice(-config.maxConversationContextLength),
    false, // false for OpenAI style {role, content}
  )
  const geminiHistory = convertToGeminiHistory(openAiHistory)
  geminiHistory.push({ role: 'user', parts: [{ text: question }] })

  const fullApiUrl = `${apiUrl}/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`

  let answer = ''
  let currentFullText = '' // Accumulates text from all parts of a candidate
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    pushRecord(session, question, currentFullText)
    console.debug('Gemini conversation history', { content: session.conversationRecords })
    port.postMessage({ answer: null, done: true, session: session })
  }

  await fetchSSE(fullApiUrl, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(getRequestPayload(geminiHistory, config, session)),
    onMessage(message) {
      console.debug('Gemini SSE message', message)
      if (finished) return

      // Gemini streaming sends an array of GenerateContentResponse objects.
      // However, fetchSSE processes line by line. Each `data:` line should be a single JSON object.
      // If the Gemini API wraps the stream in `data: [...]` then fetchSSE needs adjustment.
      // Assuming each `data:` event is one GenerateContentResponse.
      let data
      try {
        data = JSON.parse(message)
      } catch (error) {
        console.error('Gemini JSON parse error', error, 'Original message:', message)
        // If it's the last message and it's not valid JSON, it might be an error signal or incomplete.
        // Consider finishing if error is persistent or if it's an empty message after some content.
        if (currentFullText && !message.trim()) { // If we have content and get an empty message
          // finish(); // Potentially finish if this pattern indicates end.
        }
        return
      }

      // According to docs: response body contains a stream of GenerateContentResponse instances.
      // Each instance has candidates[] -> content -> parts[] -> text
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0]
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          // Concatenate text from all parts in the current candidate
          let textFromParts = ''
          for (const part of candidate.content.parts) {
            if (part.text) {
              textFromParts += part.text
            }
          }

          // The stream sends chunks, append them to the currentFullText
          // It seems each message might be a delta or a new complete part.
          // The Node.js example `text += chunk.text` implies chunks are deltas.
          // Let's assume `textFromParts` is the new chunk of text.
          currentFullText += textFromParts
          answer = currentFullText // `answer` variable is used by existing UI logic for partial updates
        }

        port.postMessage({ answer: answer, done: false, session: null })

        if (candidate.finishReason) {
          // Possible reasons: STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER
          console.debug('Gemini finish reason:', candidate.finishReason)
          finish()
          return
        }
      } else if (data.promptFeedback) {
        // Handle cases where the prompt itself was blocked
        console.error('Gemini prompt feedback:', data.promptFeedback)
        const blockReason = data.promptFeedback.blockReason
        const safetyRatings = data.promptFeedback.safetyRatings
        let errorMsg = `Gemini API Error: Prompt was blocked. Reason: ${blockReason}.`
        if (safetyRatings && safetyRatings.length > 0){
          errorMsg += ` Safety issues: ${safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`
        }
        port.postMessage({ error: errorMsg, answer: errorMsg, done: true, session: session })
        finished = true // ensure we don't try to finish again
        // No need to call finish() as we are posting an error
        return
      }


      // Check for error structure (if any defined by Gemini for stream errors)
      if (data.error) {
        console.error('Gemini API error in stream:', data.error)
        const errorMsg = `Gemini API Error: ${data.error.message || JSON.stringify(data.error)}`
        port.postMessage({ error: errorMsg, answer: errorMsg, done: true, session: session })
        finished = true
        return
      }

    },
    async onStart() {
      console.debug('Gemini SSE stream started')
    },
    async onEnd() {
      console.debug('Gemini SSE stream ended')
      if (!finished) { // If stream ended without a finish reason from Gemini
        finish() // Ensure we finalize the state
      }
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
    },
    async onError(resp) {
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
      if (resp instanceof Error) { // Network error or similar from fetchSSE
         console.error('Gemini SSE fetch error:', resp)
         const errorMsg = `Gemini API Network Error: ${resp.message}`
         port.postMessage({ error: errorMsg, answer: errorMsg, done: true, session: session })
         finished = true
         throw resp
      }
      // HTTP error from the API
      let errorJson = {}
      try {
        errorJson = await resp.json()
      } catch (e) {
        // Not a JSON response
      }
      console.error('Gemini API HTTP error:', resp.status, resp.statusText, errorJson)
      const detail = errorJson.error ? (errorJson.error.message || JSON.stringify(errorJson.error)) : `${resp.status} ${resp.statusText}`
      const errorMsg = `Gemini API Error: ${detail}`
      port.postMessage({ error: errorMsg, answer: errorMsg, done: true, session: session })
      finished = true
      // throw new Error(errorMsg) // fetchSSE will throw this if not caught
    },
  })
}
