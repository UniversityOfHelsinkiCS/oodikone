import React, { useState } from 'react'
import { Form, Button, Message } from 'semantic-ui-react'

import { useGetAccessGroupsQuery, useModifyAccessGroupsMutation } from '@/redux/users'

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
    <Form error={result.isError} loading={result.isLoading} success={result.isSuccess}>
      <Message content="Modifying access rights failed." error />
      <Message content="Modifying access rights succeeded." success />
      <Form.Dropdown
        data-cy="access-groups-form"
        fluid
        multiple
        name="groups"
        onChange={(_, { value }) => setSelected(value)}
        options={groups}
        placeholder="Select access groups"
        selectOnBlur={false}
        selectOnNavigation={false}
        selection
        value={selected}
      />
      <Button basic content="Save" data-cy="access-groups-save" fluid onClick={submit} positive />
    </Form>
  )
}
