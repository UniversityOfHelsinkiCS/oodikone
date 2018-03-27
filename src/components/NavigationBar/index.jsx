import React, { Component } from 'react'
import { Menu, Dropdown } from 'semantic-ui-react'
import { NavLink, Link } from 'react-router-dom'
import { func } from 'prop-types'
import { connect } from 'react-redux'

import { routes } from '../../constants'

import styles from './navigationBar.css'
import { logout } from '../../apiConnection'

class NavigationBar extends Component {
  static propTypes = {
    translate: func.isRequired,
    logout: func.isRequired
  }

  checkForOptionalParams = route => (
    route.endsWith('?') ? route.slice(0, route.indexOf('/:')) : route
  )

  renderUserMenu = () => {
    const { translate } = this.props
    if (process.env.NODE_ENV === 'development') {
      const testUsers = ['tktl']
      return (
        <Menu.Item as={Dropdown} style={{ backgroundColor: 'purple', color: 'white' }} text="Dev controls">
          <Dropdown.Menu>
            {testUsers.map(user => (
              <Dropdown.Item
                key={user}
                icon="user"
                text={`Use as: ${user}`}
                onClick={() => {}}
              />
          ))}
            <Dropdown.Item
              icon="log out"
              text={translate('navigationBar.logout')}
              onClick={this.props.logout}
            />
          </Dropdown.Menu>
        </Menu.Item>
      )
    }

    return (
      <Menu.Item link onClick={this.props.logout} icon="log out">
        {translate('navigationBar.logout')}
      </Menu.Item>
    )
  }

  render() {
    const t = this.props.translate

    const menuWidth = Object.keys(routes).length + 2

    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item
          as={Link}
          to={routes.index.route}
        >
          <span className={styles.logo}>
            <h2 className={styles.logoText}>oodikone</h2>
          </span>
        </Menu.Item>
        {
          Object.values(routes).map((value) => {
            const viewableRoute = this.checkForOptionalParams(value.route)
            return (
              <Menu.Item
                exact={viewableRoute === value.route}
                strict={viewableRoute !== value.route}
                as={NavLink}
                key={`menu-item-${viewableRoute}`}
                to={this.checkForOptionalParams(viewableRoute)}
              >
                {t(`navigationBar.${value.translateId}`)}
              </Menu.Item>
            )
          })
          }
        { this.renderUserMenu() }
      </Menu>)
  }
}

const mapStateToProps = () => ({})

const mapDispatchToProps = dispatch => ({
  logout: () => {
    dispatch(logout())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(NavigationBar)

