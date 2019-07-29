import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, setActiveLanguage, getLanguages } from 'react-localize-redux'
import { Dropdown } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import { getUserName, setUserLanguage, getUserLanguage } from '../../common'
import { switchLanguage, initLanguage } from '../../redux/settings'

const { func, shape, string, arrayOf } = PropTypes

class LanguageChooser extends Component {
  async componentDidMount() {
    const initialLanguage = await getUserLanguage()
    this.props.initLanguage(initialLanguage)
    this.props.setActiveLanguage(initialLanguage)
  }

  change = () => async (e, { value }) => {
    const name = await getUserName()
    this.props.setActiveLanguage(value)
    this.props.switchLanguage(name, value)
    await setUserLanguage(value)
  }

  render() {
    const { language, languages } = this.props
    return (
      <Dropdown
        size="small"
        className="icon"
        floating
        icon="world"
        onChange={this.change()}
        text={language}
        options={languages}
        button
      />
    )
  }
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code,
  languages: getLanguages(localize).map(l => ({ ...l, key: l.code, text: l.code, value: l.code }))
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
  languages: arrayOf(shape({})).isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(LanguageChooser)
