import React from 'react'
import { shape, string } from 'prop-types'
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
    pathname: string.isRequired,
  }).isRequired,
}

export default withRouter(Header)
