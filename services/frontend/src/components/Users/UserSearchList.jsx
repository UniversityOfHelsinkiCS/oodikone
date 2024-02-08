import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Label } from 'semantic-ui-react'

import { useShowAsUser } from 'redux/auth'
import { useGetAllElementDetailsQuery } from 'redux/elementdetails'
import { reformatDate } from 'common'
import { useLanguage } from '../LanguagePicker/useLanguage'
import { SortableTable } from '../SortableTable'

export const UserSearchList = ({ users }) => {
  const { getTextIn } = useLanguage()
  const { data: elementdetails = [] } = useGetAllElementDetailsQuery()
  const showAsUser = useShowAsUser()

  return (
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
                .sort((a, b) => a.group_code.localeCompare(b.group_code))
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
              {user.iam_groups
                .slice()
                .sort()
                .map(iam => (
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
          getRowVal: user => <Button circular size="tiny" basic icon="spy" onClick={() => showAsUser(user.username)} />,
        },
        {
          key: 'EDIT',
          title: '',
          filterable: false,
          sortable: false,
          getRowVal: user => (
            <Button.Group compact widths={2}>
              <Button basic size="mini" as={Link} to={`users/${user.id}`} data-cy={`user-edit-button-${user.username}`}>
                Edit
              </Button>
            </Button.Group>
          ),
        },
      ]}
      data={users.sort((a, b) => a.full_name.localeCompare(b.full_name))}
    />
  )
}
