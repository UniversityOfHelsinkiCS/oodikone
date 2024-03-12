import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Button, Dropdown, Label, Menu } from 'semantic-ui-react'

import { checkUserAccess, getFullStudyProgrammeRights } from '@/common'
import { LanguagePicker } from '@/components/LanguagePicker'
import { adminerUrls, isDev } from '@/conf'
import { useGetAuthorizedUserQuery, useLogoutMutation, useShowAsUser } from '@/redux/auth'
import './navigationBar.css'

const allNavigationItems = {
  university: { path: '/university', key: 'university', label: 'University' },
  faculty: { path: '/faculties', key: 'faculties', label: 'Faculties' },
  populations: {
    key: 'studyProgramme',
    label: 'Programmes',
    items: [
      { path: '/populations', key: 'class', label: 'Class statistics' },
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
    label: 'Guidance groups',
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
  const { isLoading, iamGroups, mockedBy, userId, roles, isAdmin, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const location = useLocation()

  const showAsUser = useShowAsUser()
  const [logout] = useLogoutMutation()

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems = {}
    if (isLoading) return visibleNavigationItems
    Object.keys(allNavigationItems).forEach(key => {
      if (key === 'populations') {
        if (!isAdmin && programmeRights.length === 0) return
      }
      if (key === 'students') {
        if (!checkUserAccess(['admin', 'studyGuidanceGroups'], roles) && fullStudyProgrammeRights.length === 0) return
      } else if (key === 'courseStatistics') {
        if (!checkUserAccess(['courseStatistics', 'admin'], roles) && fullStudyProgrammeRights.length === 0) return
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

  const renderHome = () => (
    <Menu.Item as={Link} tabIndex="-1" to="/">
      <span className="logo">
        <h2 className="logoText">oodikone</h2>
      </span>
    </Menu.Item>
  )

  const showSearch = item => {
    if (item.key === 'class' || item.key === 'overview') return true
    if (checkUserAccess(['openUniSearch', 'admin'], roles) && item.key === 'openUniSearch') return true
    if (
      (checkUserAccess(['studyGuidanceGroups', 'admin'], roles) || fullStudyProgrammeRights.length > 0) &&
      item.key === 'customSearch'
    )
      return true
    if (item.key === 'completedCoursesSearch') return true
    if (
      (checkUserAccess(['admin'], roles) || iamGroups.includes('grp-kielikeskus-esihenkilot')) &&
      item.key === 'languageCenterView'
    )
      return true
    return false
  }

  const visibleNavigationItems = refreshNavigationRoutes()

  const renderNavigationRoutes = () =>
    Object.values(visibleNavigationItems).map(({ items, path, key, label, tag }) =>
      items ? (
        <Menu.Item
          active={items.some(item => location.pathname.includes(item.path))}
          as={Dropdown}
          data-cy={`navbar-${key}`}
          key={`menu-item-drop-${key}`}
          tabIndex="-1"
          text={label}
        >
          <Dropdown.Menu>
            {items.map(
              item =>
                showSearch(item) && (
                  <Dropdown.Item
                    as={NavLink}
                    data-cy={`navbar-${item.key}`}
                    key={`menu-item-${item.path}`}
                    tabIndex="-1"
                    to={item.path}
                  >
                    {item.label}
                  </Dropdown.Item>
                )
            )}
          </Dropdown.Menu>
        </Menu.Item>
      ) : (
        <Menu.Item as={NavLink} data-cy={`navbar-${key}`} key={`menu-item-${path}`} tabIndex="-1" to={path}>
          {label}
          {tag && (
            <div style={{ position: 'absolute', top: 0, right: 17 }}>
              <Label color="red" ribbon="right" style={{ fontSize: '8px' }}>
                {tag}
              </Label>
            </div>
          )}
        </Menu.Item>
      )
    )

  const renderUserMenu = () =>
    isDev ? (
      <Menu.Item as={Dropdown} style={{ backgroundColor: 'purple', color: 'white' }} tabIndex="-1" text="Dev controls">
        <Dropdown.Menu>
          {adminerUrls.map(({ url, text }) => (
            <Dropdown.Item
              icon="database"
              key={`${url}-${text}`}
              onClick={() => {
                const win = window.open(url, '_blank')
                win.focus()
              }}
              text={text}
            />
          ))}
          <Dropdown.Item icon="log out" onClick={() => logout()} text="Logout" />
        </Dropdown.Menu>
      </Menu.Item>
    ) : (
      <Menu.Item icon="log out" link onClick={() => logout()} tabIndex="-1">
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
    <Menu className="navBar" data-cy="navBar" fluid stackable>
      {renderHome()}
      {!isLoading && renderNavigationRoutes()}
      {!isLoading && renderUserMenu()}
      {!isLoading && renderLanguagePicker()}
      {!isLoading && mockedBy && renderStopMockingButton()}
    </Menu>
  )
}
