import React from 'react'
import './navigationBar.css'
import { Menu, Dropdown, Button, Label } from 'semantic-ui-react'
import { NavLink, Link } from 'react-router-dom'
import { useLogoutMutation, useShowAsUser, useGetAuthorizedUserQuery } from 'redux/auth'
import { checkUserAccess } from '../../common'
import { LanguagePicker } from '../LanguagePicker'
import { isDev, adminerUrls } from '../../conf'

const allNavigationItems = {
  university: { path: '/evaluationoverview/university', key: 'university', label: 'University' },
  faculty: { path: '/faculties', key: 'faculties', label: 'Faculties' },
  populations: {
    key: 'studyProgramme',
    label: 'Programmes',
    items: [
      { path: '/populations', key: 'class', label: 'Year class' },
      { path: '/study-programme', key: 'overview', label: 'Overview' },
    ],
  },
  courseStatistics: { path: '/coursestatistics', key: 'courseStatistics', label: 'Courses' },
  students: { path: '/students', key: 'students', label: 'Students' },
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
    label: 'Special populations',
    items: [
      { path: '/custompopulation', key: 'customSearch', label: 'Custom population' },
      { path: '/openunipopulation', key: 'openUniSearch', label: 'Fetch Open Uni Students by Courses' },
      { path: '/completedcoursessearch', key: 'completedCoursesSearch', label: 'Completed courses of students' },
      { path: '/languagecenterview', key: 'languageCenterView', label: 'Language center view' },
    ],
  },
  updater: { path: '/updater', key: 'updater', label: 'Updater', reqRights: ['admin'] },
  feedback: { path: '/feedback', key: 'feedback', label: 'Give feedback' },
}

export const NavigationBar = () => {
  const { isLoading, rights, iamRights, iamGroups, mockedBy, userId, roles, isAdmin } = useGetAuthorizedUserQuery()
  const showAsUser = useShowAsUser()
  const [logout] = useLogoutMutation()

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems = {}
    if (isLoading) return visibleNavigationItems
    Object.keys(allNavigationItems).forEach(key => {
      if (key === 'populations') {
        if (!isAdmin && rights.length === 0 && iamRights.length === 0) return
      }
      if (key === 'students') {
        if (!checkUserAccess(['admin', 'studyGuidanceGroups'], roles) && rights.length === 0) return
      } else if (key === 'courseStatistics') {
        if (!checkUserAccess(['courseStatistics', 'admin'], roles) && rights.length === 0) return
      } else if (key === 'faculty') {
        if (!checkUserAccess(['facultyStatistics', 'admin'], roles)) return
      }
      const { reqRights } = allNavigationItems[key]
      if (!reqRights || reqRights.every(r => roles.includes(r) || (key === 'teachers' && isAdmin))) {
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

  const showSearch = item => {
    if (item.key === 'class' || item.key === 'overview') return true
    if (checkUserAccess(['openUniSearch', 'admin'], roles) && item.key === 'openUniSearch') return true
    if ((checkUserAccess(['studyGuidanceGroups', 'admin'], roles) || rights.length > 0) && item.key === 'customSearch')
      return true
    if (item.key === 'completedCoursesSearch') return true
    if (
      (checkUserAccess(['admin'], roles) || iamGroups.includes('grp-kielikeskus-esihenkilot')) &&
      item.key === 'languageCenterView'
    )
      return true
    return false
  }

  const renderNavigationRoutes = () =>
    Object.values(visibleNavigationItems).map(({ items, path, key, label, tag }) =>
      items ? (
        <Menu.Item as={Dropdown} key={`menu-item-drop-${key}`} tabIndex="-1" text={label} data-cy={`navbar-${key}`}>
          <Dropdown.Menu>
            {items.map(
              i =>
                showSearch(i) && (
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
