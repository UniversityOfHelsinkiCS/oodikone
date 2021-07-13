import * as Sentry from '@sentry/browser'
import { callApi } from '../apiConnection'

// piwik-react-router will use a dummy API shim if the matomo tracker
// is not initialized (backend returns dummy script) -> no need to
// manually if-else whether matomo is enabled
const Matomo = require('piwik-react-router')({
  enableLinkTracking: false,
  injectScript: false,
})

const safely = (fn, defaultValue) => {
  try {
    return fn()
  } catch (e) {
    Sentry.captureException(e)
    return defaultValue
  }
}

const connectToHistory = history => {
  return safely(() => Matomo.connectToHistory(history), history)
}

const setDocumentTitle = title => safely(() => Matomo.push(['setDocumentTitle', title]))

// These events go to Matomo
const sendEvent = (category, action, name, value) => {
  const data = ['trackEvent', category, action, name]
  if (typeof value !== 'undefined') {
    data.push(value)
  }

  safely(() => Matomo.push(data))
}

// These events go to InfluxDB so we can mangle them in Grafana
const sendGrafanaEvent = ({ group, name, label, value }) => {
  setImmediate(async () => {
    // use setImmediate so that we don't delay event handlers, e.g. if sendEvent is called from an onClick
    try {
      // TODO: if in the future there are more requests per second, buffer events into a buffer before sending
      await callApi('/tsa/event', 'post', { group, name, label, value })
    } catch (e) {
      Sentry.captureException(e)
    }
  })
}

const setUserId = userId => {
  safely(() => Matomo.setUserId(userId))
}

const TSA = {
  Influx: {
    sendEvent: sendGrafanaEvent,
  },
  Matomo: {
    connectToHistory,
    sendEvent,
    setUserId,
    setDocumentTitle,
  },
}

export default TSA
