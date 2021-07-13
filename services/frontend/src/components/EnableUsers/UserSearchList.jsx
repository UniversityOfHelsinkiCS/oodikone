import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Button, Icon, Label } from 'semantic-ui-react'
import { getTextIn } from '../../common'
import useLanguage from '../LanguagePicker/useLanguage'
import SortableTable from '../SortableTable'

const UserSearchList = ({ enabledOnly, users, error, elementdetails }) => {
  const { language } = useLanguage()

  let usersToRender

  if (enabledOnly) {
    usersToRender = users.filter(u => u.is_enabled)
  } else {
    usersToRender = users
  }

  return error ? null : (
    <div>
      <SortableTable
        getRowKey={user => user.id}
        tableProps={{ celled: true, structured: true }}
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
            getRowVal: user => user.accessgroup.map(ag => ag.group_code).sort(),
          },
          {
            key: 'PROGRAMMES',
            title: 'Programmes',
            getRowVal: user => {
              const nameInLanguage = code => {
                const elem = elementdetails.find(e => e.code === code)
                if (!elem) return null
                return getTextIn(elem.name, language)
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
            key: 'OODIACCESS',
            title: 'Has access',
            getRowVal: user => user.is_enabled,
            getRowContent: user => (
              <Icon
                style={{ margin: 'auto' }}
                color={user.is_enabled ? 'green' : 'red'}
                name={user.is_enabled ? 'check' : 'remove'}
              />
            ),
          },
          {
            key: 'EDIT',
            title: '',
            getRowVal: user => (
              <Button.Group compact widths={2}>
                <Button basic size="mini" as={Link} to={`users/${user.id}`}>
                  Edit
                </Button>
              </Button.Group>
            ),
            headerProps: { onClick: null, sorted: null },
          },
        ]}
        data={usersToRender}
      />
    </div>
  )
}

UserSearchList.propTypes = {
  enabledOnly: PropTypes.bool.isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  error: PropTypes.bool.isRequired,
  elementdetails: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
}

export default UserSearchList
