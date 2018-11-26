import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dropdown } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import { getUserName, setUserLanguage, getUserLanguage } from '../../common'
import { switchLanguage, initLanguage } from '../../redux/settings'

const { func, shape, string } = PropTypes

const languages = [
  { key: 'fi', text: 'fi', value: 'fi' },
  { key: 'en', text: 'en', value: 'en' },
  { key: 'sv', text: 'sv', value: 'sv' }
]

class LanguageChooser extends Component {
  async componentDidMount() {
    const initialLanguage = await getUserLanguage()
    this.props.initLanguage(initialLanguage)
  }

  change = () => async (e, { value }) => {
    const name = await getUserName()
    this.props.switchLanguage(name, value)
    await setUserLanguage(value)
  }

  render() {
    return (
      <Dropdown
        size="small"
        className="icon"
        floating
        icon="world"
        onChange={this.change()}
        text={this.props.settings.language}
        options={languages}
        button
      />
    )
  }
}

const mapStateToProps = ({ settings }) => ({
  settings
})

const mapDispatchToProps = dispatch => ({
  switchLanguage: (username, language) =>
    dispatch(switchLanguage(username, language)),
  initLanguage: language =>
    dispatch(initLanguage(language))
})

LanguageChooser.propTypes = {
  settings: shape({ language: string.isRequired }).isRequired,
  switchLanguage: func.isRequired,
  initLanguage: func.isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(LanguageChooser)
