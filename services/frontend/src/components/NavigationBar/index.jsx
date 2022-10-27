import React from 'react'
import './navigationBar.css'
import { Menu, Dropdown, Button, Label } from 'semantic-ui-react'
import { NavLink, Link } from 'react-router-dom'
import { useLogoutMutation, useShowAsUser } from 'redux/auth'
import { checkUserAccess } from '../../common'
import { useGetAuthorizedUserQuery } from '../../redux/auth'
import LanguagePicker from '../LanguagePicker'
import { isDev, adminerUrls } from '../../conf'

const allNavigationItems = {
  trends: { path: '/trends', key: 'trends', label: 'Trends' },
  faculty: { path: '/faculties', key: 'faculties', label: 'Faculties' },
  populations: {
    key: 'studyProgramme',
    label: 'Study programme',
    items: [
      { path: '/populations', key: 'class', label: 'Search by class' },
      { path: '/study-programme', key: 'overview', label: 'Overview' },
    ],
  },
  courseStatistics: { path: '/coursestatistics', key: 'courseStatistics', label: 'Course statistics' },
  students: { path: '/students', key: 'students', label: 'Student statistics' },
  teachers: { path: '/teachers', key: 'teachers', label: 'Teachers', reqRights: ['teachers'] },
  users: { path: '/users', key: 'users', label: 'Users', reqRights: ['admin'] },
  studyGuidanceGroups: {
    path: '/studyguidancegroups',
    key: 'studyGuidanceGroups',
    label: 'Study guidance groups',
    reqRights: ['studyGuidanceGroups'],
  },
  customPopulations: {
    key: 'customPopulation',
    label: 'Custom populations',
    items: [
      { path: '/custompopulation', key: 'custom search', label: 'Search by Studentnumbers' },
      { path: '/openunipopulation', key: 'openUniSearch', label: 'Fetch Open Uni Students by Courses' },
    ],
  },
  updater: { path: '/updater', key: 'updater', label: 'Updater', reqRights: ['admin'] },
  feedback: { path: '/feedback', key: 'feedback', label: 'Give feedback' },
}

const NavigationBar = () => {
  const { isLoading, rights, iamRights, mockedBy, userId, roles, isAdmin } = useGetAuthorizedUserQuery()
  const showAsUser = useShowAsUser()
  const [logout] = useLogoutMutation()

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems = {}
    if (isLoading) return visibleNavigationItems
    Object.keys(allNavigationItems).forEach(key => {
      if (key === 'populations') {
        if (!isAdmin && rights.length === 0 && iamRights.length === 0) return
      }
      if (key === 'students' || key === 'customPopulations') {
        if (!checkUserAccess(['admin', 'studyGuidanceGroups'], roles) && rights.length === 0) return
      } else if (key === 'courseStatistics') {
        if (!checkUserAccess(['courseStatistics', 'admin'], roles) && rights.length === 0) return
      } else if (key === 'faculty') {
        if (!checkUserAccess(['facultyStatistics', 'admin'], roles)) return
      }
      const { reqRights } = allNavigationItems[key]
      if (!reqRights || reqRights.every(r => roles.includes(r))) {
        visibleNavigationItems[key] = allNavigationItems[key]
      }
    })
    return { ...visibleNavigationItems }
  }

  const visibleNavigationItems = refreshNavigationRoutes()

  // Min-content sets logo always to the left
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
            {items.map(
              i =>
                !(!checkUserAccess(['openUniSearch', 'admin'], roles) && i.key === 'openUniSearch') && (
                  <Dropdown.Item
                    as={NavLink}
                    key={`menu-item-${i.path}`}
                    to={i.path}
                    tabIndex="-1"
                    data-cy={`navbar-${i.key}`}
                  >
                    {i.label}
                  </Dropdown.Item>
                )
            )}
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
          <Dropdown.Item icon="log out" text="Logout" onClick={() => logout()} />
        </Dropdown.Menu>
      </Menu.Item>
    ) : (
      <Menu.Item link onClick={() => logout()} icon="log out" tabIndex="-1">
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
    <Menu data-cy="navBar" stackable fluid className="navBar">
      {renderHome()}
      {!isLoading && renderNavigationRoutes()}
      {!isLoading && renderUserMenu()}
      {!isLoading && renderLanguagePicker()}
      {!isLoading && mockedBy && renderStopMockingButton()}
    </Menu>
  )
}

export default NavigationBar
