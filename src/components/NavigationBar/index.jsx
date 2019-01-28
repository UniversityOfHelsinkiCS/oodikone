import React, { Component } from 'react'
import { Menu, Dropdown, Button } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'
import { NavLink, Link } from 'react-router-dom'
import { func, shape, string } from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { routes } from '../../constants'
import { userIsMock, userRoles } from '../../common'
import { removeAsUser } from '../../redux/settings'
import styles from './navigationBar.css'
import { logout, login, returnToSelf } from '../../apiConnection'

const { ADMINER_URL } = process.env

class NavigationBar extends Component {
  state = {
    fake: false,
    navigationRoutes: routes
  }

  async componentDidMount() {
    await this.setNavigationRoutes()
  }

  async componentWillReceiveProps() {
    await this.setNavigationRoutes()
    this.render()
  }

  setNavigationRoutes = async () => {
    const navigationRoutes = { ...routes }
    const fake = await userIsMock()
    this.setState({ fake })
    const roles = fake ? false : await userRoles()
    if (!roles.includes('admin')) {
      Object.keys(navigationRoutes).forEach((key) => {
        if (navigationRoutes[key].reqRights && roles.every(r => navigationRoutes[key].reqRights.indexOf(r) === -1)) {
          delete navigationRoutes[key]
        }
      })
    }
    this.setState({ navigationRoutes })
  }

  returnToSelf = () => async () => {
    await returnToSelf()
    this.props.removeAsUser()
    await this.setNavigationRoutes()
    this.render()
    this.props.history.push('/')
  }

  checkForOptionalParams = route => (
    route.endsWith('?') ? route.slice(0, route.indexOf('/:')) : route
  )

  renderUserMenu = (itemWidth) => {
    const { translate } = this.props
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
      <Menu.Item link onClick={logout} icon="log out" tabIndex="-1">
        {translate('navigationBar.logout')}
      </Menu.Item>
    )
  }

  render() {
    const t = this.props.translate
    const { asUser } = this.props
    const { fake, navigationRoutes } = this.state
    const menuWidth = fake ? Object.keys(navigationRoutes).length + 3 : Object.keys(navigationRoutes).length + 2
    const itemWidth = 100 / menuWidth
    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item
          style={{ width: `${itemWidth}%` }}
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
                style={{ width: `${itemWidth}%` }}
                exact={viewableRoute === value.route}
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
        {this.renderUserMenu(itemWidth)}
        <Menu.Item
          style={{ width: `${itemWidth}%` }}
        >
          <Button icon="bullhorn" onClick={() => Sentry.showReportDialog()} />
        </Menu.Item>
        {fake ?
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
  removeAsUser: func.isRequired,
  asUser: string, // eslint-disable-line
  history: shape({
    push: func.isRequired
  }).isRequired
}

const mapStateToProps = ({ settings }) => ({
  asUser: settings.asUser
})

export default connect(mapStateToProps, { removeAsUser })(withRouter(NavigationBar))
