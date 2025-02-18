import { isEqual } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button, Label, Popup } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { SortableTable } from '@/components/SortableTable'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useShowAsUser } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useDeleteUserMutation } from '@/redux/users'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'

export const UsersTable = ({
  getAllUsersQuery,
  isError,
  isLoading,
  users,
}: {
  getAllUsersQuery
  isError: boolean
  isLoading: boolean
  users: User[]
}) => {
  const { getTextIn } = useLanguage()
  const [popupTimeout, setPopupTimeout] = useState<number | undefined>(undefined)
  const [popupOpen, setPopupOpen] = useState<boolean>(false)
  const [userEmails, setUserEmails] = useState<string[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { data: studyProgrammes = {} } = useGetProgrammesQuery({})
  console.log(studyProgrammes)
  const showAsUser = useShowAsUser()

  const [deleteUserMutation, { data: deletedUser }] = useDeleteUserMutation()

  const copyEmailsToClipboard = () => {
    void navigator.clipboard.writeText(userEmails.join('; '))
  }

  const handleDisplayedDataChange = useCallback(
    (users: User[]) => {
      const newEmails = users.filter(user => user.email).map(user => user.email)
      if (!isEqual(newEmails, userEmails)) {
        setUserEmails(newEmails)
      }
    },
    [userEmails]
  )

  useEffect(() => {
    if (deletedUser) {
      setConfirmDeleteId(null)
      getAllUsersQuery()
    }
  }, [deletedUser])

  useEffect(() => {
    return () => clearTimeout(popupTimeout)
  }, [popupTimeout])

  const handlePopupOpen = () => {
    setPopupOpen(true)
    setPopupTimeout(setTimeout(() => setPopupOpen(false), 1500))
  }

  const handlePopupClose = () => {
    setPopupOpen(false)
    setPopupTimeout(undefined)
  }

  const deleteUser = (userId: string) => {
    void deleteUserMutation(userId)
  }

  const changeButton = (userId: string) => {
    if (confirmDeleteId !== userId) {
      setConfirmDeleteId(userId)
    } else {
      deleteUser(userId)
    }
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
        <Link data-cy={`user-edit-button-${user.username}`} to={`/users/${user.id}`}>
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
          const studyProgramme = studyProgrammes[right]
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

  const columnsWithoutIamGroupsWithDelete = [
    ...columnsWithoutIamGroups,
    {
      key: 'DELETE',
      title: 'Delete user',
      filterable: false,
      sortable: false,
      getRowVal: user => (
        <Button
          color={confirmDeleteId !== user.id ? 'red' : 'black'}
          id={`delete-${user.id}`}
          onClick={() => changeButton(user.id)}
          size="tiny"
          style={{ width: '150px' }}
        >
          {confirmDeleteId !== user.id ? 'Delete user' : 'Click again to confirm deletion'}
        </Button>
      ),
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

  return (
    <Section isError={isError} isLoading={isLoading}>
      <SortableTable
        columns={isDefaultServiceProvider() ? columnsWithIamGroups : columnsWithoutIamGroupsWithDelete}
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
    </Section>
  )
}
