import React, { useState } from 'react'
import { Button, Form, Header, Icon, List, Message, Popup, Radio } from 'semantic-ui-react'

import { createLocaleComparator, textAndDescriptionSearch } from '@/common'
import { userToolTips } from '@/common/InfoToolTips'
import { useGetAllElementDetailsQuery } from '@/redux/elementdetails'
import { useGetUnfilteredProgrammesQuery } from '@/redux/populations'
import { useAddUserUnitsMutation, useRemoveUserUnitsMutation } from '@/redux/users'
import { InfoBox } from '../Info/InfoBox'
import { useLanguage } from '../LanguagePicker/useLanguage'

const mapAndSortProgrammes = (programmes, elementdetails, getTextIn) =>
  programmes
    .map(({ code, limited }) => {
      const elementInfo = elementdetails.find(e => e.code === code)
      return { code, name: getTextIn(elementInfo?.name), limited }
    })
    .sort(createLocaleComparator('name'))

export const AccessRights = ({ user }) => {
  const { id: uid, elementdetails: rightsIncludingFacultyRights, accessgroup, programmeRights } = user
  const { getTextIn } = useLanguage()
  const [accessRightsToBeAdded, setAccessRightsToBeAdded] = useState([])
  const [accessRightsToBeRemoved, setAccessRightsToBeRemoved] = useState([])
  const [filterOldProgrammes, setFilterOldProgrammes] = useState(true)
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

  let options = programmes
    .map(({ code, name }) => ({
      key: code,
      value: code,
      text: getTextIn(name),
      description: code,
    }))
    .sort(createLocaleComparator('text'))

  if (filterOldProgrammes) {
    options = options.filter(({ value }) => ['MH', 'KH'].includes(value.slice(0, 2)))
  }

  const currentRegularAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => !isIamBased),
    elementdetails,
    getTextIn
  )

  const currentIamAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => isIamBased),
    elementdetails,
    getTextIn
  )

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flexGrow: 1 }}>
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
        </div>
        <Radio
          toggle
          label="Filter out old and specialized programmes"
          checked={filterOldProgrammes}
          onChange={() => setFilterOldProgrammes(!filterOldProgrammes)}
        />
      </div>
      <Header size="small" content={`Current study programme access rights (${currentRegularAccessRights.length})`} />
      <List divided>
        {currentRegularAccessRights.map(({ code, name }) => (
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
      <Header
        size="small"
        content={`Current IAM group based study programme access rights (${currentIamAccessRights.length})`}
      />
      <InfoBox content={userToolTips.IamGroupBasedAccess} />
      <List divided>
        {currentIamAccessRights.map(({ code, name, limited }) => (
          <List.Item key={code}>
            <div style={{ display: 'flex' }}>
              <div style={{ flexGrow: 1 }}>
                <List.Content content={`${name} (${code})`} />
              </div>
              <List.Content
                content={
                  <Popup
                    trigger={
                      <Icon name="exclamation triangle" color={limited ? 'green' : 'grey'} disabled={!limited} />
                    }
                    content="Limited rights"
                    position="top center"
                  />
                }
              />
              <List.Content
                content={
                  <Popup
                    trigger={<Icon name="check circle" color={!limited ? 'green' : 'grey'} disabled={limited} />}
                    content="Full rights"
                    position="top center"
                  />
                }
              />
            </div>
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
