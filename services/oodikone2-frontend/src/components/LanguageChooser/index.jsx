import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { setActiveLanguage, getLanguages } from 'react-localize-redux'
import { Dropdown } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import { switchLanguage, initLanguage } from '../../redux/settings'

const { func, shape, string, arrayOf } = PropTypes

const LanguageChooser = ({
  userId,
  languages,
  language,
  initLanguage,
  setActiveLanguage,
  initialLanguage,
  switchLanguage
}) => {
  useEffect(() => {
    initLanguage(initialLanguage)
    setActiveLanguage(initialLanguage)
  }, [])

  const change = (e, { value }) => {
    switchLanguage(userId, value)
    setActiveLanguage(value)
  }

  return (
    <Dropdown
      size="small"
      className="icon"
      floating
      icon="world"
      onChange={change}
      text={language}
      options={languages}
      button
      selectOnBlur={false}
      selectOnNavigation={false}
    />
  )
}

const mapStateToProps = ({
  localize,
  auth: {
    token: { language: initialLanguage, userId }
  },
  settings: { language }
}) => ({
  userId,
  initialLanguage,
  language,
  languages: getLanguages(localize).map(l => ({
    ...l,
    key: l.code,
    text: l.code,
    value: l.code
  }))
})

const mapDispatchToProps = {
  switchLanguage,
  initLanguage,
  setActiveLanguage
}

LanguageChooser.propTypes = {
  switchLanguage: func.isRequired,
  initLanguage: func.isRequired,
  setActiveLanguage: func.isRequired,
  language: string.isRequired,
  languages: arrayOf(shape({})).isRequired,
  userId: string.isRequired,
  initialLanguage: string.isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(LanguageChooser)
