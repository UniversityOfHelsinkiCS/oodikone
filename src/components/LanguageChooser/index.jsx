import React from 'react'
import { connect } from 'react-redux'
import { Dropdown } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import { switchLanguage } from '../../redux/settings'

const { func, shape, string } = PropTypes

const languages = [
  { key: 'fi', text: 'fi', value: 'fi' },
  { key: 'en', text: 'en', value: 'en' },
  { key: 'sv', text: 'sv', value: 'sv' }
]

const LanguageChooser = (props) => {
  const change = () => (e, { value }) => {
    props.switchLanguage(value)
  }
  return (
    <Dropdown
      size="small"
      className="icon"
      floating
      icon="world"
      onChange={change()}
      text={props.settings.language}
      options={languages}
      button
    />
  )
}
const mapStateToProps = ({ settings }) => ({
  settings
})

const mapDispatchToProps = dispatch => ({
  switchLanguage: language =>
    dispatch(switchLanguage(language))
})

LanguageChooser.propTypes = {
  settings: shape({ language: string.isRequired }).isRequired,
  switchLanguage: func.isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(LanguageChooser)
