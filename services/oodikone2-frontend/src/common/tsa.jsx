import React from 'react'
// import { callApi } from '../apiConnection'

// -- toska surveillance agency --
// if we need moar stats, we should probably just replace all of this with
// google analytics or open web analytics

// eslint-disable-next-line import/prefer-default-export
const sendEvent = ({ group, name, label, value }) => {
  // in GA & openwebanalytics, an event has a group and a name, and optionally
  // a label and/or a value

  setImmediate(() => {
    // use setImmediate so that we don't delay event handlers, e.g. if sendEvent is called from an onClick
    try {
      // TODO: if in the future there are more requests per second, buffer events into a buffer before sending
      // callApi('/tsa', 'POST', { group, name, label, value })
      console.log('TSA', { group, name, label, value })
    } catch (e) {
      // just eat the error
    }
  })
}

const TSA = {
  sendEvent
}

/**
 * Creates a TSA HOC from a render method. The runHooks render method is called
 * when the HOC renders, which can be used to run effect hooks that send TSA events.
 *
 * @example
 * ```
 * const withStudentDataTsa = bakeTsaHooks(props => {
 *   useEffect(() => {
 *    if (!props.studentId) {
 *      return
 *    }
 *
 *     TSA.sendEvent({ group: 'Student Usage', name: 'student data viewed', label: props.studentId })
 *   }, [props.studentId])
 * })
 * export default withStudentDataTsa(StudentData)
 * ```
 */
export const bakeTsaHooks = runHooks => Component => {
  const displayName = Component.displayName || Component.name || 'Component'

  const WithTsaHooks = props => {
    runHooks(props)
    return <Component {...props} />
  }
  WithTsaHooks.displayName = `WithTsaHooks(${displayName})`
  return WithTsaHooks
}

export default TSA
