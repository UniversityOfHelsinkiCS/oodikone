/**
 * Context for language selection.
 */
import React, { createContext, useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { LANGUAGE_CODES } from '../../constants'
import { callApi } from '../../apiConnection'

const LanguageContext = createContext([[], () => {}])
LanguageContext.displayName = 'Language'

const LanguageProvider = ({ children, token }) => {
  const [state, setState] = useState(LANGUAGE_CODES[0])

  // Load selected language.
  useEffect(() => {
    if (token && LANGUAGE_CODES.includes(token.language)) {
      setState(token.language)
    }
  }, [token])

  return <LanguageContext.Provider value={[state, setState]}>{children}</LanguageContext.Provider>
}

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
  token: PropTypes.shape({
    language: PropTypes.string,
  }),
}

LanguageProvider.defaultProps = {
  token: null,
}

const mapStateToProps = ({ auth }) => ({ token: auth.token })

const ConnectedProvider = connect(mapStateToProps)(LanguageProvider)
export { ConnectedProvider as LanguageProvider }

export default () => {
  const [state, setState] = useContext(LanguageContext)

  const setLanguage = newLanguage => {
    if (!LANGUAGE_CODES.includes(newLanguage)) {
      throw new Error('Illegal language code passed to useLanguage hook!')
    }

    setState(newLanguage)
    callApi('/language', 'post', { language: newLanguage })
  }

  return { language: state, setLanguage }
}
