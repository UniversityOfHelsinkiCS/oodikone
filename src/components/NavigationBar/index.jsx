import React, { Component } from 'react'
import { Menu, Dropdown, Button } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'
import { NavLink, Link } from 'react-router-dom'
import { func, string, oneOfType, shape } from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { routes, hiddenRoutes } from '../../constants'
import { userIsAdmin, userIsCzar, userIsMock } from '../../common'
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
    const adminRights = fake ? false : await userIsAdmin()
    const czarRights = fake ? false : await userIsCzar()
    Object.keys(navigationRoutes).forEach((key) => {
      if (navigationRoutes[key].admin && !adminRights) {
        delete navigationRoutes[key]
      } else if (navigationRoutes[key].czar && (!adminRights && !czarRights)) {
        delete navigationRoutes[key]
      }
    })
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

  renderUserMenu = () => {
    const { translate } = this.props
    if (process.env.NODE_ENV === 'development') {
      const testUsers = ['tktl']
      return (
        <Menu.Item
          as={Dropdown}
          style={{ backgroundColor: 'purple', color: 'white' }}
          text="Dev controls"
          tabIndex="-1"
        >
          <Dropdown.Menu>
            <Dropdown.Item
              as={NavLink}
              to={hiddenRoutes.oodilearn.route}
              text="OodiLearn"
              icon="graduation cap"
            />
            <Dropdown.Item
              as={NavLink}
              to={hiddenRoutes.sandbox.route}
              text="Sandbox"
              icon="boxes"
            />
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
        <Menu.Item>
          <Button icon="bullhorn" onClick={() => Sentry.showReportDialog()} />
        </Menu.Item>
        {fake ?
          <Menu.Item>
            <Button onClick={this.returnToSelf()}>Stop mocking as {asUser}</Button>
          </Menu.Item>
          : null}
      </Menu>)
  }
}

NavigationBar.propTypes = {
  translate: func.isRequired,
  removeAsUser: func.isRequired,
  asUser: oneOfType([null, undefined, string]).isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired
}

const mapStateToProps = ({ settings }) => ({
  asUser: settings.asUser
})

export default connect(mapStateToProps, { removeAsUser })(withRouter(NavigationBar))
