import React from 'react'
import { withRouter } from 'react-router-dom'
import NavigationBar from '../NavigationBar'
import './header.css'

const Header = props => (
  <header className="header" role="banner" id="main-menu">
    <NavigationBar location={props.location} />
  </header>
)

export default withRouter(Header)
