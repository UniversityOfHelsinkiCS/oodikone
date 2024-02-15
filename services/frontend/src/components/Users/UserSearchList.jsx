import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon, Label, Loader, Popup, Segment } from 'semantic-ui-react'

import { useShowAsUser } from 'redux/auth'
import { useGetAllElementDetailsQuery } from 'redux/elementdetails'
import { useGetAllUsersQuery } from 'redux/users'
import { reformatDate } from 'common'
import { useLanguage } from '../LanguagePicker/useLanguage'
import { SortableTable } from '../SortableTable'

export const UserSearchList = () => {
  const { getTextIn } = useLanguage()
  const [popupTimeout, setPopupTimeout] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const { data: users = [], isLoading, isError } = useGetAllUsersQuery()
  const { data: elementdetails = [] } = useGetAllElementDetailsQuery()
  const showAsUser = useShowAsUser()

  const copyEmailsToClipboard = () => {
    const clipboardString = users
      .filter(u => u.email)
      .map(u => u.email)
      .join('; ')
    navigator.clipboard.writeText(clipboardString)
  }

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
        stretch
        singleLine={false}
        hideHeaderBar
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
            getRowVal: user => (
              <Link to={`users/${user.id}`} data-cy={`user-edit-button-${user.username}`}>
                {user.username}
              </Link>
            ),
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
                  .map(({ group_code: code }) => (
                    <Label key={code} content={code} />
                  ))}
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
              if (!user.elementdetails || user.elementdetails.length === 0) return []

              return user.elementdetails.reduce((programmes, element) => {
                const elem = elementdetails.find(e => e.code === element)
                if (elem) programmes.push(getTextIn(elem.name))
                return programmes
              }, [])
            },
            getRowContent: user => {
              if (!user.elementdetails || user.elementdetails.length === 0) return null

              const nameInLanguage = code => {
                const elem = elementdetails.find(e => e.code === code)
                return elem ? getTextIn(elem.name) : null
              }

              const name = nameInLanguage(user.elementdetails[0])
              if (!name) return `${user.elementdetails.length} programmes`
              return user.elementdetails.length > 1 ? `${name} + ${user.elementdetails.length - 1} others` : name
            },
          },
          {
            key: 'IAMGROUPS',
            title: 'IAM groups',
            sortable: false,
            filterType: 'multi',
            getRowContent: user => (
              <Label.Group>
                {user.iam_groups.toSorted().map(iam => (
                  <Label key={iam} content={iam} />
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
            getRowContent: user =>
              user.last_login ? (
                <p>{reformatDate(user.last_login, 'DD.MM.YYYY')}</p>
              ) : (
                <p style={{ color: 'gray' }}>Not saved</p>
              ),
          },
          {
            key: 'SHOWAS',
            title: 'Show as user',
            filterable: false,
            sortable: false,
            getRowVal: user => (
              <Button circular size="tiny" basic icon="spy" onClick={() => showAsUser(user.username)} />
            ),
          },
        ]}
        data={users}
      />
      <Popup
        trigger={<Icon link name="envelope" onClick={copyEmailsToClipboard} style={{ float: 'right' }} />}
        content="Copied email(s)!"
        on="click"
        onOpen={handlePopupOpen}
        onClose={handlePopupClose}
        open={popupOpen}
      />
    </Segment>
  )
}
