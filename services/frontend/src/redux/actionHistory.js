export const actionHistory = []
const pushAction = action => {
  delete action.response
  actionHistory.push(action)
  if (actionHistory.length > 30) {
    const _ = actionHistory.shift()
  }
}

export const actionHistoryMiddleware = () => next => action => {
  const time = new Date().toISOString()
  const type = action.type

  const unwantedTypes = ['@@INIT', '__rtkq/focused', '__rtkq/unfocused']

  if (unwantedTypes.includes(type)) {
    /* DO NOTHING */
  } else if (type.startsWith('api/executeQuery')) {
    pushAction({ time, type: 'api/executeQuery', meta: action.meta })
  } else {
    pushAction({ time, ...action })
  }

  return next(action)
}
