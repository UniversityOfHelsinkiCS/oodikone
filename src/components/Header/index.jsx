import React from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { withRouter } from 'react-router-dom'

import NavigationBar from '../NavigationBar'

import styles from './header.css'

const Header = props => (
  <header className={styles.header} role="banner">
    <NavigationBar translate={props.translate} location={props.location} />
  </header>
)

Header.propTypes = {
  translate: func.isRequired,
  location: shape({
    pathname: string.isRequired
  }).isRequired
}

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
})

export default withRouter(connect(mapStateToProps)(Header))
