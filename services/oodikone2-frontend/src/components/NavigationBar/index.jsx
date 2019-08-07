import React, { useState, useEffect } from 'react'
import { Menu, Dropdown, Button } from 'semantic-ui-react'
import { NavLink, Link, withRouter } from 'react-router-dom'
import { func, shape, string } from 'prop-types'
import { connect } from 'react-redux'
import { userRoles, userRights, getAsUserWithoutRefreshToken } from '../../common'
import { login as loginAction, logout as logoutAction } from '../../redux/auth'
import LanguageChooser from '../LanguageChooser'
import './navigationBar.css'

const { USER_ADMINER_URL, ADMINER_URL, ANALYTICS_ADMINER_URL, USAGE_ADMINER_URL, KONE_ADMINER_URL } = process.env
const adminerUrls = [
  { url: ADMINER_URL, text: 'Database' },
  { url: USER_ADMINER_URL, text: 'User database' },
  { url: ANALYTICS_ADMINER_URL, text: 'Analytics database' },
  { url: KONE_ADMINER_URL, text: 'Kone database' },
  { url: USAGE_ADMINER_URL, text: 'Usage database' }
]

const allNavigationItems = {
  populations: {
    translateId: 'studyProgramme',
    items: [
      { path: '/populations', translateId: 'class' },
      { path: '/study-programme', translateId: 'overview' }
    ]
  },
  students: { path: '/students', translateId: 'students' },
  courseStatistics: { path: '/coursestatistics', translateId: 'courseStatistics' },
  teachers: { path: '/teachers', translateId: 'teachers', reqRights: ['teachers'] },
  users: { path: '/users', translateId: 'users', reqRights: ['users'] },
  faculty: { path: '/faculties', translateId: 'faculty', reqRights: ['dev'] },
  usage: { path: '/usage', translateId: 'usage', reqRights: ['usage'] },
  sandbox: { path: '/sandbox', translateId: 'sandbox', reqRights: ['dev'] },
  oodilearn: { path: '/oodilearn', translateId: 'oodilearn', reqRights: ['oodilearn'] },
  feedback: { path: '/feedback', translateId: 'feedback' }
}

const NavigationBar = (props) => {
  const {
    token,
    logout,
    history,
    translate: t,
    login
  } = props
  const [visibleNavigationItems, setVisibleNavigationItems] = useState(allNavigationItems)

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems = {}
    const roles = userRoles()
    const rights = userRights()
    Object.keys(allNavigationItems).forEach((key) => {
      if (key === 'courseStatistics') {
        if (!roles.includes('admin') && rights.length === 0) {
          return
        }
      }
      const { reqRights } = allNavigationItems[key]
      if (!reqRights || roles.some(r => reqRights.indexOf(r) !== -1)) {
        visibleNavigationItems[key] = allNavigationItems[key]
      }
    })
    setVisibleNavigationItems({ ...visibleNavigationItems })
  }

  useEffect(() => {
    refreshNavigationRoutes()
  }, [token])

  const returnToSelf = () => {
    logout()
    history.push('/')
  }

  const renderHome = () => (
    <Menu.Item
      as={Link}
      to="/"
      tabIndex="-1"
    >
      <span className="logo">
        <h2 className="logoText">oodikone</h2>
      </span>
    </Menu.Item>
  )

  const renderNavigationRoutes = () => (
    Object.values(visibleNavigationItems).map(({ items, path, translateId }) => (
      items ?
        (
          <Menu.Item
            as={Dropdown}
            key={`menu-item-drop-${translateId}`}
            tabIndex="-1"
            text={t(`navigationBar.${translateId}`)}
          >
            <Dropdown.Menu>
              {items.map(i => (
                <Dropdown.Item
                  as={NavLink}
                  key={`menu-item-${i.path}`}
                  to={i.path}
                  tabIndex="-1"
                >
                  {t(`navigationBar.${i.translateId}`)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Menu.Item>
        ) :
        (
          <Menu.Item
            as={NavLink}
            key={`menu-item-${path}`}
            to={path}
            tabIndex="-1"
          >
            {t(`navigationBar.${translateId}`)}
          </Menu.Item>
        )
    ))
  )

  const testUsers = ['tktl']
  const renderUserMenu = () => (
    process.env.NODE_ENV === 'development' ?
      (
        <Menu.Item
          as={Dropdown}
          style={{ backgroundColor: 'purple', color: 'white' }}
          text="Dev controls"
          tabIndex="-1"
        >
          <Dropdown.Menu>
            {
              adminerUrls.map(({ url, text }) => (
                <Dropdown.Item
                  key={url}
                  onClick={() => {
                    const win = window.open(url, '_blank')
                    win.focus()
                  }}
                  text={text}
                  icon="database"
                />
              ))
            }
            {
              testUsers.map(user => (
                <Dropdown.Item
                  key={user}
                  icon="user"
                  text={`Use as: ${user}`}
                  onClick={() => login()}
                />
              ))
            }
            <Dropdown.Item
              icon="log out"
              text={t('navigationBar.logout')}
              onClick={logout}
            />
          </Dropdown.Menu>
        </Menu.Item>
      ) :
      (
        <Menu.Item link onClick={logout} icon="log out" tabIndex="-1">
          {t('navigationBar.logout')}
        </Menu.Item>
      )
  )

  const renderLanguageChooser = () => (
    <Menu.Item>
      <LanguageChooser />
    </Menu.Item>
  )

  const asUser = getAsUserWithoutRefreshToken()
  const renderStopMockingButton = () => (
    <Menu.Item>
      <Button onClick={returnToSelf}>Stop mocking as {asUser}</Button>
    </Menu.Item>
  )

  return (
    <Menu stackable fluid className="navBar">
      { renderHome() }
      { renderNavigationRoutes() }
      { renderUserMenu() }
      { renderLanguageChooser() }
      { asUser && renderStopMockingButton() }
    </Menu>
  )
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
