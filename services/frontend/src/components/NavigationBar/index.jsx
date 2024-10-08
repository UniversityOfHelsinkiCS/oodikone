import { Link, NavLink, useLocation } from 'react-router-dom'
import { Button, Dropdown, Label, Menu } from 'semantic-ui-react'

import { checkUserAccess, getFullStudyProgrammeRights, isDefaultServiceProvider } from '@/common'
import { LanguagePicker } from '@/components/LanguagePicker'
import { adminerUrls, isDev, languageCenterViewEnabled } from '@/conf'
import { useGetAuthorizedUserQuery, useLogoutMutation, useShowAsUser } from '@/redux/auth'
import './navigationBar.css'

const allNavigationItems = {
  university: { key: 'university', label: 'University', path: '/university' },
  faculty: { key: 'faculties', label: 'Faculties', path: '/faculties' },
  populations: {
    key: 'studyProgramme',
    items: [
      { key: 'class', label: 'Class statistics', path: '/populations' },
      { key: 'overview', label: 'Overview', path: '/study-programme' },
    ],
    label: 'Programmes',
  },
  courseStatistics: { key: 'courseStatistics', label: 'Courses', path: '/coursestatistics' },
  students: { key: 'students', label: 'Students', path: '/students' },
  teachers: { key: 'teachers', label: 'Teachers', path: '/teachers', reqRights: ['teachers'] },
  users: { key: 'users', label: 'Users', path: '/users', reqRights: ['admin'] },
  studyGuidanceGroups: {
    key: 'studyGuidanceGroups',
    label: 'Guidance groups',
    path: '/studyguidancegroups',
    reqRights: ['studyGuidanceGroups'],
  },
  customPopulations: {
    key: 'customPopulation',
    items: [
      { key: 'customSearch', label: 'Custom population', path: '/custompopulation' },
      { key: 'openUniSearch', label: 'Fetch open uni students by courses', path: '/openunipopulation' },
      { key: 'completedCoursesSearch', label: 'Completed courses of students', path: '/completedcoursessearch' },
      { key: 'languageCenterView', label: 'Language center view', path: '/languagecenterview' },
      { key: 'closeToGraduation', label: 'Students close to graduation', path: '/close-to-graduation' },
    ],
    label: 'Special populations',
  },
  updater: { key: 'updater', label: 'Updater', path: '/updater', reqRights: ['admin'] },
  feedback: { key: 'feedback', label: 'Give feedback', path: '/feedback' },
}

export const NavigationBar = () => {
  const { isLoading, iamGroups, mockedBy, username, roles, isAdmin, programmeRights, fullAccessToStudentData } =
    useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const location = useLocation()
  const showAsUser = useShowAsUser()
  const [logout] = useLogoutMutation()

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems = {}
    if (isLoading) {
      return visibleNavigationItems
    }
    Object.keys(allNavigationItems).forEach(key => {
      if (key === 'populations') {
        if (!fullAccessToStudentData && programmeRights.length === 0) return
      }
      if (key === 'students') {
        if (
          !checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles) &&
          fullStudyProgrammeRights.length === 0
        )
          return
      } else if (key === 'courseStatistics') {
        if (
          !checkUserAccess(['admin', 'fullSisuAccess', 'courseStatistics'], roles) &&
          fullStudyProgrammeRights.length === 0
        )
          return
      } else if (key === 'faculty') {
        if (!checkUserAccess(['admin', 'fullSisuAccess', 'facultyStatistics'], roles)) return
      } else if (key === 'feedback') {
        if (!isDefaultServiceProvider()) return
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
      <span>
        <h2>oodikone</h2>
      </span>
      {isDev && <Label color="red">dev</Label>}
    </Menu.Item>
  )

  const showSearch = item => {
    if (item.key === 'class' || item.key === 'overview') return true
    if (
      checkUserAccess(['admin', 'openUniSearch'], roles) &&
      item.key === 'openUniSearch' &&
      isDefaultServiceProvider()
    )
      return true
    if (
      (checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles) ||
        fullStudyProgrammeRights.length > 0) &&
      item.key === 'customSearch'
    )
      return true
    if (item.key === 'completedCoursesSearch') return true
    if (
      (checkUserAccess(['admin'], roles) || iamGroups.includes('grp-kielikeskus-esihenkilot')) &&
      item.key === 'languageCenterView' &&
      languageCenterViewEnabled
    )
      return true
    if (item.key === 'closeToGraduation' && checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles))
      return true
    return false
  }

  const visibleNavigationItems = refreshNavigationRoutes()

  const renderNavigationRoutes = () =>
    Object.values(visibleNavigationItems).map(({ items, key, label, path, tag }) =>
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
      <Button onClick={() => showAsUser(null)}>Stop mocking as {username}</Button>
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
