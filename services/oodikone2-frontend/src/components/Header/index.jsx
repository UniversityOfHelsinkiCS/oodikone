import React from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { withRouter } from 'react-router-dom'

import NavigationBar from '../NavigationBar'

import './header.css'

const Header = props => (
  <header className="header" role="banner">
    <NavigationBar translate={props.translate} location={props.location} />
  </header>
)

Header.propTypes = {
  translate: func.isRequired,
  location: shape({
    pathname: string.isRequired
  }).isRequired
}

const mapStateToProps = ({ localize }) => ({
  translate: getTranslate(localize),
  currentLanguage: getActiveLanguage(localize).code
})

export default withRouter(connect(mapStateToProps)(Header))
