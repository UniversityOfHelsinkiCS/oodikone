import * as Sentry from '@sentry/browser'
import { callApi } from '../apiConnection'

// -- toska surveillance agency --
// if we need moar stats, we should probably just replace all of this with
// google analytics or open web analytics

// eslint-disable-next-line import/prefer-default-export
const sendEvent = ({ group, name, label, value }) => {
  // in GA & openwebanalytics, an event has a group and a name, and optionally
  // a label and/or a value

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

const TSA = {
  sendEvent
}

export default TSA
