import React from 'react'
import { connect } from 'react-redux'
import { shape, string } from 'prop-types'
import { getActiveLanguage } from 'react-localize-redux'
import { withRouter } from 'react-router-dom'

import NavigationBar from '../NavigationBar'

import './header.css'

const Header = props => (
  <header className="header" role="banner" id="main-menu">
    <NavigationBar location={props.location} />
  </header>
)

Header.propTypes = {
  location: shape({
    pathname: string.isRequired
  }).isRequired
}

const mapStateToProps = ({ localize }) => ({
  currentLanguage: getActiveLanguage(localize).code
})

export default withRouter(connect(mapStateToProps)(Header))
