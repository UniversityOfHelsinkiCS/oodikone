import React, { Component } from 'react'
import { Menu, Dropdown } from 'semantic-ui-react'
import { NavLink, Link } from 'react-router-dom'
import { func } from 'prop-types'
import { connect } from 'react-redux'

import { routes } from '../../constants'
import { userIsAdmin } from '../../common'

import styles from './navigationBar.css'
import { logout, swapDevUser } from '../../apiConnection'

class NavigationBar extends Component {
  state = {
    navigationRoutes: routes
  }

  async componentDidMount() {
    const navigationRoutes = { ...routes }
    const adminRights = await userIsAdmin()
    Object.keys(navigationRoutes).forEach((key) => {
      if (navigationRoutes[key].admin && !adminRights) {
        delete navigationRoutes[key]
      }
    })
    this.setState({ navigationRoutes })
  }

  swapUser = uid => () => {
    swapDevUser({ uid })
  }

  checkForOptionalParams = route => (
    route.endsWith('?') ? route.slice(0, route.indexOf('/:')) : route
  )

  renderUserMenu = () => {
    const { translate } = this.props
    if (process.env.NODE_ENV === 'development') {
      const testUsers = ['tktl']
      return (
        <Menu.Item as={Dropdown} style={{ backgroundColor: 'purple', color: 'white' }} text="Dev controls" tabIndex="-1">
          <Dropdown.Menu>
            {testUsers.map(user => (
              <Dropdown.Item
                key={user}
                icon="user"
                text={`Use as: ${user}`}
                onClick={this.swapUser(user)}
              />
            ))}
            <Dropdown.Item
              icon="log out"
              text={translate('navigationBar.logout')}
              onClick={logout}
            />
          </Dropdown.Menu>
        </Menu.Item>
      )
    }

    return (
      <Menu.Item link onClick={logout} icon="log out" tabIndex="-1">
        {translate('navigationBar.logout')}
      </Menu.Item>
    )
  }

  render() {
    const t = this.props.translate
    const { navigationRoutes } = this.state
    const menuWidth = Object.keys(navigationRoutes).length + 2
    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item
          as={Link}
          to={navigationRoutes.index.route}
          tabIndex="-1"
        >
          <span className={styles.logo}>
            <h2 className={styles.logoText}>oodikone</h2>
          </span>
        </Menu.Item>
        {
          Object.values(navigationRoutes).map((value) => {
            const viewableRoute = this.checkForOptionalParams(value.route)
            if (value.route === '/') {
              return null
            }
            return (
              <Menu.Item
                exact={viewableRoute === value.route}
                strict={viewableRoute !== value.route}
                as={NavLink}
                key={`menu-item-${viewableRoute}`}
                to={this.checkForOptionalParams(viewableRoute)}
                tabIndex="-1"
              >
                {t(`navigationBar.${value.translateId}`)}
              </Menu.Item>
            )
          })
        }
        {this.renderUserMenu()}
      </Menu>)
  }
}

NavigationBar.propTypes = {
  translate: func.isRequired
}

export default connect()(NavigationBar)

