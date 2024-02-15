import React, { useState } from 'react'
import { Button, Form, Header, List, Message } from 'semantic-ui-react'

import { useAddUserUnitsMutation, useRemoveUserUnitsMutation } from 'redux/users'
import { useGetUnfilteredProgrammesQuery } from 'redux/populations'
import { useGetAllElementDetailsQuery } from 'redux/elementdetails'
import { createLocaleComparator, textAndDescriptionSearch } from 'common'
import { useLanguage } from '../LanguagePicker/useLanguage'

export const AccessRights = ({ user }) => {
  const { id: uid, elementdetails: rightsIncludingFacultyRights, programme: regularRights, accessgroup } = user
  const { getTextIn } = useLanguage()
  const [accessRightsToBeAdded, setAccessRightsToBeAdded] = useState([])
  const [accessRightsToBeRemoved, setAccessRightsToBeRemoved] = useState([])
  const { data: elementdetails = [] } = useGetAllElementDetailsQuery()
  const { data: allProgrammes } = useGetUnfilteredProgrammesQuery()
  const programmes = Object.values(allProgrammes?.programmes || {})
    .filter(programme => !rightsIncludingFacultyRights.includes(programme.code))
    .map(({ code, name }) => ({ code, name }))
  const [addUserUnitsMutation, addResult] = useAddUserUnitsMutation()
  const [removeUserUnitsMutation, removeResult] = useRemoveUserUnitsMutation()

  const handleSave = async () => {
    if (accessRightsToBeAdded.length > 0) {
      const result = await addUserUnitsMutation({ uid, codes: accessRightsToBeAdded })
      if (!result.error) setAccessRightsToBeAdded([])
    }
    if (accessRightsToBeRemoved.length > 0) {
      const result = await removeUserUnitsMutation({ uid, codes: accessRightsToBeRemoved })
      if (!result.error) setAccessRightsToBeRemoved([])
    }
  }

  const options = programmes
    .map(({ code, name }) => ({
      key: code,
      value: code,
      text: getTextIn(name),
      description: code,
    }))
    .sort(createLocaleComparator('text'))

  const currentAccessRights = regularRights
    .reduce((acc, { elementDetailCode }) => {
      const elementInfo = elementdetails.find(e => e.code === elementDetailCode)
      if (elementInfo) acc.push({ code: elementInfo.code, name: getTextIn(elementInfo.name) })
      return acc
    }, [])
    .sort(createLocaleComparator('name'))

  if (accessgroup.some(ag => ag.group_code === 'admin')) {
    return <Message positive icon="lock open" header="This user is an admin." />
  }

  return (
    <Form
      loading={addResult.isLoading || removeResult.isLoading}
      error={addResult.isError || removeResult.isError}
      success={addResult.isSuccess || removeResult.isSuccess}
    >
      <Header size="small" content="Select new study programme access rights" style={{ marginBottom: '8px' }} />
      <Message error content="Modifying access rights failed." />
      <Message success content="The access rights were updated successfully." />
      <Form.Dropdown
        name="programme"
        placeholder="Select study programmes to add"
        data-cy="access-rights-form"
        options={options}
        multiple
        value={accessRightsToBeAdded}
        onChange={(_, { value }) => setAccessRightsToBeAdded(value)}
        fluid
        search={textAndDescriptionSearch}
        selection
        clearable
        selectOnBlur={false}
        selectOnNavigation={false}
      />
      <Header size="small" content={`Current study programme access rights (${currentAccessRights.length})`} />
      <List divided>
        {currentAccessRights.map(({ code, name }) => (
          <List.Item key={code}>
            <List.Content floated="right">
              <Button
                basic
                negative={!accessRightsToBeRemoved.includes(code)}
                floated="right"
                onClick={
                  accessRightsToBeRemoved.includes(code)
                    ? () => setAccessRightsToBeRemoved(accessRightsToBeRemoved.filter(right => right !== code))
                    : () => setAccessRightsToBeRemoved([...accessRightsToBeRemoved, code])
                }
                content={accessRightsToBeRemoved.includes(code) ? 'Cancel removal' : 'Mark for removal'}
                size="mini"
              />
            </List.Content>
            <List.Content
              content={`${name} (${code})`}
              style={{ color: accessRightsToBeRemoved.includes(code) ? 'grey' : '' }}
            />
          </List.Item>
        ))}
      </List>
      <Form.Button
        disabled={accessRightsToBeAdded.length === 0 && accessRightsToBeRemoved.length === 0}
        basic
        fluid
        positive
        content="Save"
        onClick={handleSave}
        data-cy="access-rights-save"
      />
    </Form>
  )
}
