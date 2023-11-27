export const formreducer = (prefix, initvals = {}) => {
  const initial = { ...initvals }

  const actions = {
    CLEAR: `${prefix}_CLEAR`,
    SET: `${prefix}_SET_VALUE`,
  }

  const reducer = (state = { ...initial }, action) => {
    switch (action.type) {
      case actions.SET:
        return {
          ...state,
          [action.name]: action.value,
        }
      case actions.CLEAR:
        return { ...initial }
      default:
        return state
    }
  }

  const setValue = (name, value) => ({ type: actions.SET, name, value })
  const clear = () => ({ type: actions.CLEAR })
  return {
    reducer,
    setValue,
    clear,
  }
}
