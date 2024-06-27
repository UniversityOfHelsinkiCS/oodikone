import { isEqual } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Label, Loader, Popup, Segment } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useShowAsUser } from '@/redux/auth'
import { useGetStudyProgrammesQuery } from '@/redux/studyProgramme'
import { reformatDate } from '@/util/timeAndDate'

export const UserSearchList = ({ users, isLoading, isError }) => {
  const { getTextIn } = useLanguage()
  const [popupTimeout, setPopupTimeout] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const [userEmails, setUserEmails] = useState([])
  const { data: studyProgrammes = [] } = useGetStudyProgrammesQuery()
  const showAsUser = useShowAsUser()

  const copyEmailsToClipboard = () => {
    navigator.clipboard.writeText(userEmails.join('; '))
  }

  const handleDisplayedDataChange = useCallback(
    users => {
      const newEmails = users.filter(user => user.email).map(user => user.email)
      if (!isEqual(newEmails, userEmails)) {
        setUserEmails(newEmails)
      }
    },
    [userEmails]
  )

  useEffect(() => {
    return () => clearTimeout(popupTimeout)
  }, [])

  const handlePopupOpen = () => {
    setPopupOpen(true)
    setPopupTimeout(setTimeout(() => setPopupOpen(false), 1500))
  }

  const handlePopupClose = () => {
    setPopupOpen(false)
    setPopupTimeout(null)
  }

  const columnsWithoutIamGroups = [
    {
      key: 'NAME',
      title: 'Name',
      getRowVal: user => {
        const nameparts = user.name.split(' ')
        return nameparts[nameparts.length - 1]
      },
      getRowContent: user => user.name,
    },
    {
      key: 'USERNAME',
      title: 'Username',
      getRowContent: user => (
        <Link data-cy={`user-edit-button-${user.username}`} to={`users/${user.id}`}>
          {user.username}
        </Link>
      ),
      getRowVal: user => user.username,
    },
    {
      key: 'ROLE',
      title: 'Role',
      sortable: false,
      filterType: 'multi',
      getRowContent: user => (
        <Label.Group>
          {user.roles
            .toSorted((a, b) => a.localeCompare(b))
            .map(role =>
              role === 'fullSisuAccess' ? (
                <Label color="orange" content={role} key={role} />
              ) : (
                <Label content={role} key={role} />
              )
            )}
        </Label.Group>
      ),
      getRowVal: user => user.roles,
    },
    {
      key: 'PROGRAMMES',
      title: 'Programmes',
      sortable: false,
      filterType: 'multi',
      getRowVal: user => {
        const uniqueRights = new Set(user.programmeRights.map(programmeRight => programmeRight.code))
        const programmeNames = []
        uniqueRights.forEach(right => {
          const studyProgramme = studyProgrammes.find(studyProgramme => studyProgramme.code === right)
          if (studyProgramme) {
            programmeNames.push(getTextIn(studyProgramme.name))
          }
        })
        return programmeNames
      },
      formatValue: programmes =>
        programmes.length > 1 ? `${programmes[0]} + ${programmes.length - 1} others` : programmes[0],
    },
    {
      key: 'LASTLOGIN',
      title: 'Last login',
      filterType: 'date',
      getRowVal: user => user.lastLogin && new Date(user.lastLogin),
      getRowContent: user => user.lastLogin && <p>{reformatDate(user.lastLogin, DISPLAY_DATE_FORMAT)}</p>,
    },
    {
      key: 'SHOWAS',
      title: 'Show as user',
      filterable: false,
      sortable: false,
      getRowVal: user => <Button basic circular icon="spy" onClick={() => showAsUser(user.username)} size="tiny" />,
    },
  ]

  const columnsWithIamGroups = [
    ...columnsWithoutIamGroups.slice(0, 4),
    {
      key: 'IAMGROUPS',
      title: 'IAM groups',
      sortable: false,
      filterType: 'multi',
      getRowContent: user => (
        <Label.Group>
          {user.iamGroups.toSorted().map(iam => (
            <Label content={iam} key={iam} />
          ))}
        </Label.Group>
      ),
      getRowVal: user => user.iamGroups,
    },
    ...columnsWithoutIamGroups.slice(4),
  ]

  if (isLoading) return <Loader active inline="centered" />

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <Segment className="contentSegment">
      <SortableTable
        columns={isDefaultServiceProvider() ? columnsWithIamGroups : columnsWithoutIamGroups}
        data={users}
        handleDisplayedDataChange={handleDisplayedDataChange}
        hideHeaderBar
        singleLine={false}
        stretch
      />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Popup
          content="Copied email(s)!"
          on="click"
          onClose={handlePopupClose}
          onOpen={handlePopupOpen}
          open={popupOpen}
          position="top center"
          size="large"
          trigger={
            <Button content="Copy email addresses" icon="envelope" onClick={copyEmailsToClipboard} primary size="big" />
          }
        />
      </div>
    </Segment>
  )
}
