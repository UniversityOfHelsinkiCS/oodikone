import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Form, Button, Divider, Message } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import { getAccessGroups } from '../../redux/accessGroups'
import { modifyAccessGroups } from '../../redux/users'

const AccessGroups = ({
  savePending,
  userGroups,
  user,
  groups,
  modifyAccessGroups,
  pending,
  saveError,
  getAccessGroups,
}) => {
  const [selected, setSelected] = useState(userGroups)

  useEffect(() => {
    if (groups.length === 0) getAccessGroups()
  }, [])

  useEffect(() => {
    const finishedRequest = !savePending
    if (finishedRequest) setSelected(userGroups)
  }, [savePending])

  const submit = () => {
    const rights = groups.reduce((acc, { value }) => ({ ...acc, [value]: false }), {})
    selected.forEach(value => {
      rights[value] = true
    })
    modifyAccessGroups(user.id, rights)
  }

  return (
    <Form loading={savePending} error={!!saveError}>
      <Message error content="Modifying access rights failed." />
      <Form.Dropdown
        loading={pending}
        name="groups"
        label="Access Groups"
        data-cy="access-groups-form"
        placeholder="Select access groups"
        fluid
        multiple
        options={groups}
        value={selected}
        onChange={(_, { value }) => setSelected(value)}
        clearable
        selectOnBlur={false}
        selectOnNavigation={false}
      />
      <Divider />
      <Button basic fluid positive content="Save" data-cy="access-groups-save" onClick={submit} />
    </Form>
  )
}

AccessGroups.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  getAccessGroups: PropTypes.func.isRequired,
  modifyAccessGroups: PropTypes.func.isRequired,
  groups: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  userGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
  saveError: PropTypes.bool.isRequired,
  savePending: PropTypes.bool.isRequired,
  pending: PropTypes.bool.isRequired,
}

const mapStateToProps = ({ accessGroups, users }, { user }) => {
  const { data, pending } = accessGroups
  const { accessgroupError: saveError, accessgroupPending: savePending } = users
  const groups = data.map(group => ({
    key: group.id,
    text: group.group_code,
    value: group.group_code,
    description: group.group_info,
  }))
  const userGroups = user.accessgroup.map(({ group_code: code }) => code)
  return {
    groups,
    userGroups,
    pending: !!pending,
    saveError: !!saveError,
    savePending: !!savePending,
  }
}

export default connect(mapStateToProps, {
  getAccessGroups,
  modifyAccessGroups,
})(AccessGroups)
