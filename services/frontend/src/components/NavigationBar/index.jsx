import React from 'react'
import { Menu, Dropdown, Button, Label } from 'semantic-ui-react'
import { NavLink, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import { getUserRoles, checkUserAccess } from '../../common'
import { logout as logoutAction } from '../../redux/auth'
import LanguagePicker from '../LanguagePicker'
import { isDev, adminerUrls } from '../../conf'
import { useShowAsUser } from '../../common/hooks'

const allNavigationItems = {
  populations: {
    key: 'studyProgramme',
    label: 'Study programme',
    items: [
      { path: '/populations', key: 'class', label: 'Search by class' },
      { path: '/study-programme', key: 'overview', label: 'Overview' },
    ],
  },
  students: { path: '/students', key: 'students', label: 'Student statistics' },
  courseStatistics: { path: '/coursestatistics', key: 'courseStatistics', label: 'Course statistics' },
  teachers: { path: '/teachers', key: 'teachers', label: 'Teachers', reqRights: ['teachers'] },
  users: { path: '/users', key: 'users', label: 'Users', reqRights: ['admin'] },
  trends: { path: '/trends', key: 'trends', label: 'Trends' },
  studyGuidanceGroups: {
    path: '/studyguidancegroups',
    key: 'studyGuidanceGroups',
    label: 'Study guidance groups',
    reqRights: ['studyGuidanceGroups'],
  },
  updater: { path: '/updater', key: 'updater', label: 'Updater', reqRights: ['admin'] },
  feedback: { path: '/feedback', key: 'feedback', label: 'Give feedback' },
}

const NavigationBar = props => {
  const { logout, userRoles, rights, mockedBy, userId } = props
  const showAsUser = useShowAsUser()

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
  const renderUserMenu = () =>
    isDev ? (
      <Menu.Item as={Dropdown} style={{ backgroundColor: 'purple', color: 'white' }} text="Dev controls" tabIndex="-1">
        <Dropdown.Menu>
          {adminerUrls.map(({ url, text }) => (
            <Dropdown.Item
              key={`${url}-${text}`}
              onClick={() => {
                const win = window.open(url, '_blank')
                win.focus()
              }}
              text={text}
              icon="database"
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

  const renderLanguagePicker = () => (
    <Menu.Item>
      <LanguagePicker />
    </Menu.Item>
  )

  const renderStopMockingButton = () => (
    <Menu.Item>
      <Button onClick={() => showAsUser(null)}>Stop mocking as {userId}</Button>
    </Menu.Item>
  )

  return (
    <Menu data-cy="navBar" stackable fluid style={{ overflow: 'auto' }}>
      {renderHome()}
      {renderNavigationRoutes()}
      {renderUserMenu()}
      {renderLanguagePicker()}
      {mockedBy && renderStopMockingButton()}
    </Menu>
  )
}

const mapStateToProps = ({
  auth: {
    token: { roles, rights, mockedBy, userId },
  },
}) => ({
  userRoles: getUserRoles(roles),
  rights,
  mockedBy,
  userId,
})

const mapDispatchToProps = {
  logout: logoutAction,
}

export default connect(mapStateToProps, mapDispatchToProps, null, {
  areStatePropsEqual: isEqual,
})(NavigationBar)
