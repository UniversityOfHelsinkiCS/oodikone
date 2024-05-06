import _ from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Label, Loader, Popup, Segment } from 'semantic-ui-react'

import { reformatDate } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { useShowAsUser } from '@/redux/auth'
import { useGetAllElementDetailsQuery } from '@/redux/elementdetails'
import { useGetAllUsersQuery } from '@/redux/users'

export const UserSearchList = () => {
  const { getTextIn } = useLanguage()
  const [popupTimeout, setPopupTimeout] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const [userEmails, setUserEmails] = useState([])
  const { data: users = [], isLoading, isError } = useGetAllUsersQuery()
  const { data: elementdetails = [] } = useGetAllElementDetailsQuery()
  const showAsUser = useShowAsUser()

  const copyEmailsToClipboard = () => {
    navigator.clipboard.writeText(userEmails.join('; '))
  }

  const handleDisplayedDataChange = useCallback(
    users => {
      const newEmails = users.filter(u => u.email).map(u => u.email)
      if (!_.isEqual(newEmails, userEmails)) setUserEmails(newEmails)
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

  if (isLoading) return <Loader active inline="centered" />

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <Segment className="contentSegment">
      <SortableTable
        columns={[
          {
            key: 'NAME',
            title: 'Name',
            getRowVal: user => {
              const nameparts = user.full_name.split(' ')
              return nameparts[nameparts.length - 1]
            },
            getRowContent: user => user.full_name,
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
                {user.accessgroup
                  .toSorted((a, b) => a.group_code.localeCompare(b.group_code))
                  .map(({ group_code: code }) =>
                    code === 'fullSisuAccess' ? (
                      <Label color="orange" content={code} key={code} />
                    ) : (
                      <Label content={code} key={code} />
                    )
                  )}
              </Label.Group>
            ),
            getRowVal: user => user.accessgroup.map(ag => ag.group_code),
          },
          {
            key: 'PROGRAMMES',
            title: 'Programmes',
            sortable: false,
            filterType: 'multi',
            getRowVal: user => {
              if (user.accessgroup.some(ag => ag.group_code === 'fullSisuAccess')) return []
              const uniqueRights = new Set(user.programmeRights.map(r => r.code))
              const programmeNames = []
              uniqueRights.forEach(right => {
                const element = elementdetails.find(element => element.code === right)
                if (element) programmeNames.push(getTextIn(element.name))
              })
              return programmeNames
            },
            formatValue: programmes =>
              programmes.length > 1 ? `${programmes[0]} + ${programmes.length - 1} others` : programmes[0],
          },
          {
            key: 'IAMGROUPS',
            title: 'IAM groups',
            sortable: false,
            filterType: 'multi',
            getRowContent: user => (
              <Label.Group>
                {user.iam_groups.toSorted().map(iam => (
                  <Label content={iam} key={iam} />
                ))}
              </Label.Group>
            ),
            getRowVal: user => user.iam_groups,
          },
          {
            key: 'LASTLOGIN',
            title: 'Last login',
            filterType: 'date',
            getRowVal: user => (user.last_login ? new Date(user.last_login) : null),
            getRowContent: user => user.last_login && <p>{reformatDate(user.last_login, 'DD.MM.YYYY')}</p>,
          },
          {
            key: 'SHOWAS',
            title: 'Show as user',
            filterable: false,
            sortable: false,
            getRowVal: user => (
              <Button basic circular icon="spy" onClick={() => showAsUser(user.username)} size="tiny" />
            ),
          },
        ]}
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
