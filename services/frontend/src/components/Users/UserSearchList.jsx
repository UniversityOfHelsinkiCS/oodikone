import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon, Label } from 'semantic-ui-react'
import { useShowAsUser } from 'redux/auth'
import { reformatDate } from '../../common'
import useLanguage from '../LanguagePicker/useLanguage'
import SortableTable from '../SortableTable'

const UserSearchList = ({ enabledOnly, users, error, elementdetails }) => {
  const { getTextIn } = useLanguage()

  const usersToRender = enabledOnly ? users.filter(u => u.is_enabled) : users
  const showAsUser = useShowAsUser()

  return error ? null : (
    <div>
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
            getRowContent: user => (
              <Label.Group>
                {user.accessgroup
                  .map(ag => ag.group_code)
                  .sort()
                  .map(code => (
                    <Label key={code} content={code} />
                  ))}
              </Label.Group>
            ),
            getRowVal: user =>
              user.accessgroup
                .map(ag => ag.group_code)
                .sort()
                .join(', '),
          },
          {
            key: 'PROGRAMMES',
            title: 'Programmes',
            getRowVal: user => {
              if (!user.elementdetails || user.elementdetails.length === 0) {
                return []
              }

              const nameInLanguage = code => {
                const elem = elementdetails.find(e => e.code === code)
                if (!elem) return null
                return getTextIn(elem.name)
              }

              return user.elementdetails.map(element => nameInLanguage(element))
            },
            getRowContent: user => {
              const nameInLanguage = code => {
                const elem = elementdetails.find(e => e.code === code)
                if (!elem) return null
                return getTextIn(elem.name)
              }

              if (!user.elementdetails || user.elementdetails.length === 0) return null
              const name = nameInLanguage(user.elementdetails[0])
              if (!name) return `${user.elementdetails.length} programmes`
              if (user.elementdetails.length >= 2) {
                return `${nameInLanguage(user.elementdetails[0])} +${user.elementdetails.length - 1} others`
              }
              return name
            },
          },
          {
            key: 'IAMGROUPS',
            title: 'IAM groups',
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
            getRowVal: user => user.iam_groups.slice().sort().join(', '),
          },
          {
            key: 'OODIACCESS',
            title: 'Has access',
            getRowVal: user => user.is_enabled,
            formatValue: value => (value ? 'Has access' : 'No access'),
            getRowContent: user => (
              <Icon
                style={{ margin: 'auto' }}
                color={user.is_enabled ? 'green' : 'red'}
                name={user.is_enabled ? 'check' : 'remove'}
              />
            ),
          },
          {
            key: 'LASTLOGIN',
            title: 'Last login',
            filterType: 'date',
            getRowVal: user => (user.last_login ? user.last_login : 'Not saved'),
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
          {
            key: 'EDIT',
            title: '',
            filterable: false,
            sortable: false,
            getRowVal: user => (
              <Button.Group compact widths={2}>
                <Button
                  basic
                  size="mini"
                  as={Link}
                  to={`users/${user.id}`}
                  data-cy={`user-edit-button-${user.username}`}
                >
                  Edit
                </Button>
              </Button.Group>
            ),
          },
        ]}
        data={usersToRender}
      />
    </div>
  )
}

export default UserSearchList
