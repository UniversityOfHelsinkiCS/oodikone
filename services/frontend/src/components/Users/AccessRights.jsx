import { useState } from 'react'
import { Button, Form, Header, Icon, List, Message, Popup } from 'semantic-ui-react'
import {
  createLocaleComparator,
  isNewStudyProgramme,
  textAndDescriptionSearch,
  isDefaultServiceProvider,
} from '@/common'
import { userToolTips } from '@/common/InfoToolTips'
import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useAddUserUnitsMutation, useRemoveUserUnitsMutation } from '@/redux/users'

const mapAndSortProgrammes = (programmes, studyProgrammes, getTextIn) => {
  return programmes
    .map(({ code, limited }) => {
      const programme = studyProgrammes.find(programme => programme.code === code)
      return { code, name: getTextIn(programme?.name), limited }
    })
    .sort(createLocaleComparator('name'))
}

const getUserFullProgrammeRights = programmeRights => programmeRights.filter(r => !r.limited).map(r => r.code)

export const AccessRights = ({ user }) => {
  const { id: uid, roles, programmeRights } = user
  const { getTextIn } = useLanguage()
  const [accessRightsToBeAdded, setAccessRightsToBeAdded] = useState([])
  const [accessRightsToBeRemoved, setAccessRightsToBeRemoved] = useState([])
  const [filterOldProgrammes, setFilterOldProgrammes] = useState(true)
  const { data: programmes = {} } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(programmes)
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

  let options = studyProgrammes
    .filter(programme => !getUserFullProgrammeRights(programmeRights).includes(programme.code))
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
    studyProgrammes,
    getTextIn
  )

  const removeAllAccessRights = async () => {
    await removeUserUnitsMutation({ uid, codes: currentRegularAccessRights.map(r => r.code) })
  }

  const currentIamAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => isIamBased),
    studyProgrammes,
    getTextIn
  )

  if (roles.some(role => role === 'admin')) {
    return <Message header="This user is an admin." icon="lock open" positive />
  }

  if (roles.some(role => role === 'fullSisuAccess')) {
    return (
      <Message icon positive>
        <Icon name="lock open" />
        <Message.Content>
          <Message.Header>This user has full access to Sisu student data.</Message.Header>
          {currentRegularAccessRights.length > 0 && (
            <>
              The user also has {currentRegularAccessRights.length} manually given study programme access rights. Click{' '}
              <Button
                basic
                onClick={removeAllAccessRights}
                style={{ padding: '0.25em', boxShadow: 'none', marginRight: 0 }}
              >
                <span style={{ color: '#4183C4' }}>here</span>
              </Button>
              to remove all manually given study programme access rights.
            </>
          )}
        </Message.Content>
      </Message>
    )
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
        <FilterOldProgrammesToggle
          checked={filterOldProgrammes}
          onChange={() => setFilterOldProgrammes(!filterOldProgrammes)}
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
      {isDefaultServiceProvider() && (
        <>
          <Header
            content={`Current IAM group based study programme access rights (${currentIamAccessRights.length})`}
            size="small"
          />
          <InfoBox content={userToolTips.iamGroupBasedAccess} />
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
        </>
      )}
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
