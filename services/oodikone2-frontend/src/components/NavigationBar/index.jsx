import React, { Component } from 'react'
import { Menu, Dropdown, Button } from 'semantic-ui-react'
import { NavLink, Link, withRouter } from 'react-router-dom'
import { func, shape, string } from 'prop-types'
import { connect } from 'react-redux'
import { routes } from '../../constants'
import { userRoles, userRights, getAsUserWithoutRefreshToken } from '../../common'
import './navigationBar.css'
import { login as loginAction, logout as logoutAction } from '../../redux/auth'
import LanguageChooser from '../LanguageChooser'

const { USER_ADMINER_URL, ADMINER_URL, ANALYTICS_ADMINER_URL, USAGE_ADMINER_URL, KONE_ADMINER_URL } = process.env

class NavigationBar extends Component {
  state = {
    navigationRoutes: routes
  }

  async componentDidMount() {
    await this.setNavigationRoutes()
  }

  async componentWillReceiveProps(nextProps) {
    if (this.props.token !== nextProps.token) {
      await this.setNavigationRoutes()
      this.render()
    }
  }

  setNavigationRoutes = async () => {
    const navigationRoutes = { ...routes }
    const roles = await userRoles()
    Object.keys(navigationRoutes).forEach((key) => {
      if (navigationRoutes[key].reqRights && roles.every(r => navigationRoutes[key].reqRights.indexOf(r) === -1)) {
        delete navigationRoutes[key]
      }
    })
    const rights = await userRights()
    if (!roles.includes('admin')) {
      if (rights.length === 0) {
        delete navigationRoutes.courseStatistics
      }
    }
    this.setState({ navigationRoutes })
  }

  returnToSelf = () => async () => {
    this.props.logout()
    this.props.history.push('/')
  }

  renderUserMenu = (itemWidth) => {
    const { translate, login, logout } = this.props
    if (process.env.NODE_ENV === 'development') {
      const testUsers = ['tktl']
      return (
        <Menu.Item
          as={Dropdown}
          style={{ backgroundColor: 'purple', color: 'white', width: `${itemWidth}%` }}
          text="Dev controls"
          tabIndex="-1"
        >
          <Dropdown.Menu>
            {ADMINER_URL && (
              <Dropdown.Item
                onClick={() => {
                  const win = window.open(ADMINER_URL, '_blank')
                  win.focus()
                }}
                text="Database"
                icon="database"
              />
            )}
            {USER_ADMINER_URL && (
              <Dropdown.Item
                onClick={() => {
                  const win = window.open(USER_ADMINER_URL, '_blank')
                  win.focus()
                }}
                text="User database"
                icon="database"
              />
            )}
            {ANALYTICS_ADMINER_URL && (
              <Dropdown.Item
                onClick={() => {
                  const win = window.open(ANALYTICS_ADMINER_URL, '_blank')
                  win.focus()
                }}
                text="Analytics database"
                icon="database"
              />
            )}
            {KONE_ADMINER_URL && (
              <Dropdown.Item
                onClick={() => {
                  const win = window.open(KONE_ADMINER_URL, '_blank')
                  win.focus()
                }}
                text="Kone database"
                icon="database"
              />
            )}
            {USAGE_ADMINER_URL && (
              <Dropdown.Item
                onClick={() => {
                  const win = window.open(USAGE_ADMINER_URL, '_blank')
                  win.focus()
                }}
                text="Usage database"
                icon="database"
              />
            )}
            {testUsers.map(user => (
              <Dropdown.Item
                key={user}
                icon="user"
                text={`Use as: ${user}`}
                onClick={() => login()}
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
      <Menu.Item link onClick={logout} icon="log out" tabIndex="-1" style={{ width: `${itemWidth}%` }}>
        {translate('navigationBar.logout')}
      </Menu.Item>
    )
  }

  render() {
    const { translate: t } = this.props
    const asUser = getAsUserWithoutRefreshToken()
    const { navigationRoutes } = this.state
    const menuWidth = asUser ? Object.keys(navigationRoutes).length + 3 : Object.keys(navigationRoutes).length + 2
    const itemWidth = 100 / menuWidth
    return (
      <Menu stackable fluid widths={menuWidth} className="navBar">
        <Menu.Item
          style={{ width: `${itemWidth}%` }}
          as={Link}
          to={navigationRoutes.index.route}
          tabIndex="-1"
        >
          <span className="logo">
            <h2 className="logoText">oodikone</h2>
          </span>
        </Menu.Item>
        {
          Object.values(navigationRoutes).map((value) => {
            const viewableRoute = value.menuRoute
            if (value.items) {
              return (
                <Menu.Item
                  style={{ width: `${itemWidth}%` }}
                  as={Dropdown}
                  key={`menu-item-drop-${value.translateId}`}
                  tabIndex="-1"
                  text={t(`navigationBar.${value.translateId}`)}
                >
                  <Dropdown.Menu>
                    {value.items.map(i => (
                      <Dropdown.Item
                        as={NavLink}
                        key={`menu-item-${i.menuRoute}`}
                        to={i.menuRoute}
                        tabIndex="-1"
                      >
                        {t(`navigationBar.${i.translateId}`)}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Menu.Item>
              )
            }
            if (!viewableRoute) {
              return null
            }
            return (
              <Menu.Item
                style={{ width: `${itemWidth}%` }}
                as={NavLink}
                key={`menu-item-${viewableRoute}`}
                to={viewableRoute}
                tabIndex="-1"
              >
                {t(`navigationBar.${value.translateId}`)}
              </Menu.Item>
            )
          })
        }
        {this.renderUserMenu(itemWidth)}
        <Menu.Item
          style={{ width: `${itemWidth}%` }}
        >
          <LanguageChooser />
        </Menu.Item>
        {asUser ?
          <Menu.Item
            style={{ width: `${itemWidth}%` }}
          >
            <Button onClick={this.returnToSelf()}>Stop mocking as {asUser}</Button>
          </Menu.Item>
          : null}
      </Menu>)
  }
}

NavigationBar.propTypes = {
  translate: func.isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired,
  token: string,
  login: func.isRequired,
  logout: func.isRequired
}

NavigationBar.defaultProps = {
  token: null
}

const mapStateToProps = ({ auth }) => ({
  token: auth.token
})

const mapDispatchToProps = {
  login: loginAction,
  logout: logoutAction
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(NavigationBar))
