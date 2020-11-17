import React from 'react'
import { Menu, Dropdown, Button, Icon, Label } from 'semantic-ui-react'
import { NavLink, Link } from 'react-router-dom'
import { func, string, arrayOf } from 'prop-types'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import { getUserRoles, setMocking, setTestUser, setTestUserSIS, getTestUserSIS, checkUserAccess } from '../../common'
import { logout as logoutAction } from '../../redux/auth'
import './navigationBar.css'
import LanguagePicker from '../LanguagePicker'

const { USER_ADMINER_URL, ADMINER_URL, ANALYTICS_ADMINER_URL, KONE_ADMINER_URL, SIS_ADMINER_URL } = process.env

const adminerUrls = [
  { url: ADMINER_URL, text: 'Database' },
  { url: USER_ADMINER_URL, text: 'User database' },
  { url: ANALYTICS_ADMINER_URL, text: 'Analytics database' },
  { url: KONE_ADMINER_URL, text: 'Kone database' },
  { url: SIS_ADMINER_URL, text: 'SIS database' }
]

const allNavigationItems = {
  populations: {
    key: 'studyProgramme',
    label: 'Study programme',
    items: [
      { path: '/populations', key: 'class', label: 'Search by class' },
      { path: '/study-programme', key: 'overview', label: 'Overview' }
    ]
  },
  students: { path: '/students', key: 'students', label: 'Student statistics' },
  courseStatistics: { path: '/coursestatistics', key: 'courseStatistics', label: 'Course statistics' },
  teachers: { path: '/teachers', key: 'teachers', label: 'Teachers', reqRights: ['teachers'] },
  users: { path: '/users', key: 'users', label: 'Users', reqRights: ['users'] },
  trends: { path: '/trends', key: 'trends', label: 'Trends', tag: 'New!' },
  faculty: { path: '/faculties', key: 'faculty', label: 'Faculty', reqRights: ['faculties'] },
  updater: { path: '/updater', key: 'updater', label: 'Updater', reqRights: ['dev', 'admin'] },
  sandbox: { path: '/sandbox', key: 'sandbox', label: 'Sandbox', reqRights: ['dev'] },
  feedback: { path: '/feedback', key: 'feedback', label: 'Need help?' }
}

const NavigationBar = props => {
  const { logout, userRoles, rights, mockedBy, userId } = props

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems = {}
    Object.keys(allNavigationItems).forEach(key => {
      if (key === 'populations' || key === 'students') {
        if (!userRoles.includes('admin') && rights.length === 0) {
          return
        }
      } else if (key === 'courseStatistics') {
        if (!checkUserAccess(['courseStatistics', 'admin'], userRoles) && rights.length < 1) return
      }
      const { reqRights } = allNavigationItems[key]
      if (!reqRights || reqRights.every(r => userRoles.includes(r))) {
        visibleNavigationItems[key] = allNavigationItems[key]
      }
    })
    return { ...visibleNavigationItems }
  }

  const visibleNavigationItems = refreshNavigationRoutes()

  const setFlagSIS = () => {
    const flag = getTestUserSIS()
    setTestUserSIS(!flag)
    window.location.reload()
  }

  const returnToSelf = () => {
    setMocking(null)
    window.location.reload()
  }

  const renderHome = () => (
    <Menu.Item as={Link} to="/" tabIndex="-1">
      <span className="logo">
        <h2 className="logoText">oodikone</h2>
      </span>
    </Menu.Item>
  )

  const renderNavigationRoutes = () =>
    Object.values(visibleNavigationItems).map(({ items, path, key, label, tag }) =>
      items ? (
        <Menu.Item as={Dropdown} key={`menu-item-drop-${key}`} tabIndex="-1" text={label} data-cy={`navbar-${key}`}>
          <Dropdown.Menu>
            {items.map(i => (
              <Dropdown.Item
                as={NavLink}
                key={`menu-item-${i.path}`}
                to={i.path}
                tabIndex="-1"
                data-cy={`navbar-${i.key}`}
              >
                {i.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Menu.Item>
      ) : (
        <Menu.Item as={NavLink} key={`menu-item-${path}`} to={path} tabIndex="-1" data-cy={`navbar-${key}`}>
          {label}
          {tag && (
            <div style={{ position: 'absolute', top: 0, right: 17 }}>
              <Label style={{ fontSize: '8px' }} color="red" ribbon="right">
                {tag}
              </Label>
            </div>
          )}
        </Menu.Item>
      )
    )
  const testUsers = ['tktl', 'mluukkai']
  const renderUserMenu = () =>
    process.env.NODE_ENV === 'development' ? (
      <Menu.Item as={Dropdown} style={{ backgroundColor: 'purple', color: 'white' }} text="Dev controls" tabIndex="-1">
        <Dropdown.Menu>
          {adminerUrls.map(({ url, text }) => (
            <Dropdown.Item
              key={url}
              onClick={() => {
                const win = window.open(url, '_blank')
                win.focus()
              }}
              text={text}
              icon="database"
            />
          ))}
          {testUsers.map(user => (
            <Dropdown.Item
              key={user}
              icon="user"
              text={`Use as: ${user}`}
              onClick={() => {
                setTestUser(user)
                window.location.reload()
              }}
            />
          ))}
          <Dropdown.Item icon="log out" text="Logout" onClick={logout} />
        </Dropdown.Menu>
      </Menu.Item>
    ) : (
      <Menu.Item link onClick={logout} icon="log out" tabIndex="-1">
        Logout
      </Menu.Item>
    )

  const renderSISSwitch = isSis => (
    <Menu.Item>
      <Button className={isSis ? 'sis-danger-zone-button' : ''} onClick={setFlagSIS} basic={!isSis} color="red">
        <Icon className="heartbeat" />
        {isSis ? 'Stop SIS destruction' : 'Destroy oodikone with SIS'}
      </Button>
    </Menu.Item>
  )

  const renderLanguagePicker = () => (
    <Menu.Item>
      <LanguagePicker />
    </Menu.Item>
  )

  const renderStopMockingButton = () => (
    <Menu.Item>
      <Button onClick={returnToSelf}>Stop mocking as {userId}</Button>
    </Menu.Item>
  )

  const renderSISWarning = () => (
    <Menu.Item>
      <img
        src="https://p7.hiclipart.com/preview/453/925/261/emergency-lighting-siren-emergency-vehicle-lighting-light.jpg"
        className="sis-destruction-siren"
        alt="SIS destruction active"
      />
      AT YOUR OWN RISK
    </Menu.Item>
  )
  const showSISSwitch = process.env.TAG === 'staging' || process.env.NODE_ENV === 'development'

  return (
    <Menu stackable fluid className="navBar">
      {renderHome()}
      {renderNavigationRoutes()}
      {renderUserMenu()}
      {renderLanguagePicker()}
      {showSISSwitch && renderSISSwitch(!!getTestUserSIS())}
      {mockedBy && renderStopMockingButton()}
      {getTestUserSIS() && renderSISWarning()}
    </Menu>
  )
}

NavigationBar.propTypes = {
  logout: func.isRequired,
  userRoles: arrayOf(string),
  rights: arrayOf(string),
  mockedBy: string,
  userId: string
}

NavigationBar.defaultProps = {
  mockedBy: null,
  userId: 'unknown',
  userRoles: [],
  rights: []
}

const mapStateToProps = ({
  auth: {
    token: { roles, rights, mockedBy, userId }
  }
}) => ({
  userRoles: getUserRoles(roles),
  rights,
  mockedBy,
  userId
})

const mapDispatchToProps = {
  logout: logoutAction
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    areStatePropsEqual: isEqual
  }
)(NavigationBar)
