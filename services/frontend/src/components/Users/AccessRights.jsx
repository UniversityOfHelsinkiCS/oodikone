import React, { useState } from 'react'
import { Button, Form, Header, Icon, List, Message, Popup, Radio } from 'semantic-ui-react'

import { createLocaleComparator, isNewStudyProgramme, textAndDescriptionSearch } from '@/common'
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

const getUserFullProgrammeRights = programmeRights => programmeRights.filter(r => !r.limited).map(r => r.code)

export const AccessRights = ({ user }) => {
  const { id: uid, accessgroup, programmeRights } = user
  const { getTextIn } = useLanguage()
  const [accessRightsToBeAdded, setAccessRightsToBeAdded] = useState([])
  const [accessRightsToBeRemoved, setAccessRightsToBeRemoved] = useState([])
  const [filterOldProgrammes, setFilterOldProgrammes] = useState(true)
  const { data: elementdetails = [] } = useGetAllElementDetailsQuery()
  const { data: allProgrammes } = useGetUnfilteredProgrammesQuery()
  const programmes = Object.values(allProgrammes?.programmes || {})
    .filter(programme => !getUserFullProgrammeRights(programmeRights).includes(programme.code))
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
    options = options.filter(({ value }) => isNewStudyProgramme(value))
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
    return <Message header="This user is an admin." icon="lock open" positive />
  }

  return (
    <Form
      error={addResult.isError || removeResult.isError}
      loading={addResult.isLoading || removeResult.isLoading}
      success={addResult.isSuccess || removeResult.isSuccess}
    >
      <Header content="Select new study programme access rights" size="small" style={{ marginBottom: '8px' }} />
      <Message content="Modifying access rights failed." error />
      <Message content="The access rights were updated successfully." success />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flexGrow: 1 }}>
          <Form.Dropdown
            clearable
            data-cy="access-rights-form"
            fluid
            multiple
            name="programme"
            onChange={(_, { value }) => setAccessRightsToBeAdded(value)}
            options={options}
            placeholder="Select study programmes to add"
            search={textAndDescriptionSearch}
            selectOnBlur={false}
            selectOnNavigation={false}
            selection
            value={accessRightsToBeAdded}
          />
        </div>
        <Radio
          checked={filterOldProgrammes}
          label="Filter out old and specialized programmes"
          onChange={() => setFilterOldProgrammes(!filterOldProgrammes)}
          toggle
        />
      </div>
      <Header content={`Current study programme access rights (${currentRegularAccessRights.length})`} size="small" />
      <List divided>
        {currentRegularAccessRights.map(({ code, name }) => (
          <List.Item key={code}>
            <List.Content floated="right">
              <Button
                basic
                content={accessRightsToBeRemoved.includes(code) ? 'Cancel removal' : 'Mark for removal'}
                floated="right"
                negative={!accessRightsToBeRemoved.includes(code)}
                onClick={
                  accessRightsToBeRemoved.includes(code)
                    ? () => setAccessRightsToBeRemoved(accessRightsToBeRemoved.filter(right => right !== code))
                    : () => setAccessRightsToBeRemoved([...accessRightsToBeRemoved, code])
                }
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
        content={`Current IAM group based study programme access rights (${currentIamAccessRights.length})`}
        size="small"
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
                    content="Limited rights"
                    position="top center"
                    trigger={
                      <Icon color={limited ? 'green' : 'grey'} disabled={!limited} name="exclamation triangle" />
                    }
                  />
                }
              />
              <List.Content
                content={
                  <Popup
                    content="Full rights"
                    position="top center"
                    trigger={<Icon color={!limited ? 'green' : 'grey'} disabled={limited} name="check circle" />}
                  />
                }
              />
            </div>
          </List.Item>
        ))}
      </List>
      <Form.Button
        basic
        content="Save"
        data-cy="access-rights-save"
        disabled={accessRightsToBeAdded.length === 0 && accessRightsToBeRemoved.length === 0}
        fluid
        onClick={handleSave}
        positive
      />
    </Form>
  )
}
