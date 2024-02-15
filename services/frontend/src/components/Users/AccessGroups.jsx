import React, { useState } from 'react'
import { Form, Button, Message } from 'semantic-ui-react'

import { useGetAccessGroupsQuery, useModifyAccessGroupsMutation } from 'redux/users'

export const AccessGroups = ({ user }) => {
  const [selected, setSelected] = useState(user.accessgroup.map(({ group_code: code }) => code))
  const { data: accessGroups = [] } = useGetAccessGroupsQuery()
  const [mutateAccessGroups, result] = useModifyAccessGroupsMutation()

  const groups = accessGroups.map(({ group_code: code, group_info: description }) => ({
    key: code,
    text: code,
    value: code,
    description,
  }))

  const submit = async () => {
    const accessgroups = groups.reduce((acc, { value }) => ({ ...acc, [value]: !!selected.includes(value) }), {})
    const { data } = await mutateAccessGroups({ username: user.username, accessgroups })
    if (data) {
      setSelected(data.accessgroup.map(({ group_code: code }) => code))
    }
  }

  return (
    <Form loading={result.isLoading} error={result.isError} success={result.isSuccess}>
      <Message error content="Modifying access rights failed." />
      <Message success content="Modifying access rights succeeded." />
      <Form.Dropdown
        name="groups"
        data-cy="access-groups-form"
        placeholder="Select access groups"
        fluid
        multiple
        selection
        options={groups}
        value={selected}
        onChange={(_, { value }) => setSelected(value)}
        selectOnBlur={false}
        selectOnNavigation={false}
      />
      <Button basic fluid positive content="Save" data-cy="access-groups-save" onClick={submit} />
    </Form>
  )
}
