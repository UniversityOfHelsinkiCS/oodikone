const reducer = (state = [], action) => {
  switch (action.type) {
    case '@@INIT':
    case '@@localize/INITIALIZE':
    case '@@localize/ADD_TRANSLATION':
      return state
    default: {
      const newAction = { ...action, time: new Date().toISOString() }
      delete newAction.response
      const newState = [...state, { ...newAction }]
      if (newState.length > 30) newState.shift()
      return newState
    }
  }
}

export default reducer
