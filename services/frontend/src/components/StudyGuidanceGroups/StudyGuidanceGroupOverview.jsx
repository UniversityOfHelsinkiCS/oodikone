import { useEffect, useState } from 'react'
import Datetime from 'react-datetime'
import { Link, useHistory } from 'react-router-dom'
import { Button, Form, Icon, Message, Modal } from 'semantic-ui-react'

import { textAndDescriptionSearch } from '@/common'
import { useToggle } from '@/common/hooks'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { YEAR_DATE_FORMAT } from '@/constants/date'
import { useChangeStudyGuidanceGroupTagsMutation } from '@/redux/studyGuidanceGroups'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { startYearToAcademicYear, StyledMessage } from './common'
import './StudyGuidanceGroupOverview.css'

const LinkToGroup = ({ group }) => {
  const { getTextIn } = useLanguage()
  const history = useHistory()
  const destination = `/studyguidancegroups/${group.id}`
  return (
    <Link data-cy={`study-guidance-group-link-${group.id}`} style={{ color: 'black' }} to={destination}>
      {getTextIn(group.name)}
      <Icon color="blue" name="level up alternate" onClick={() => history.push(destination)} />
    </Link>
  )
}

const prettifyCamelCase = string => {
  const splitted = string.match(/[A-Za-z][a-z]*/g) || []
  return splitted.map(word => word.charAt(0).toLowerCase() + word.substring(1)).join(' ')
}

const cellWrapper = { display: 'flex', gap: '8px', width: '100%' }
const cellContent = { flexGrow: 1 }

const EditTagModal = ({ group, open, selectFieldItems, tagName, toggleEdit }) => {
  const [changeStudyGuidanceGroupTags, { isLoading }] = useChangeStudyGuidanceGroupTagsMutation()
  const { getTextIn } = useLanguage()
  const initialState = { [tagName]: '' }
  const [formValues, setFormValues] = useState(initialState)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    setFormValues(initialState)
    setFormErrors({})
  }, [group, tagName, open])

  const validate = values => {
    const tags = { studyProgramme: 'Study programme', year: 'Starting year' }
    const errors = {}
    if (!values[tagName]) {
      errors[tagName] = `${tags[tagName]} is required!`
    }
    return errors
  }

  const handleChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const errors = validate(formValues)
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      changeStudyGuidanceGroupTags({ groupId: group.id, tags: formValues })
      toggleEdit()
    }
  }

  const handleRemove = () => {
    changeStudyGuidanceGroupTags({ groupId: group.id, tags: { [tagName]: null } })
    toggleEdit()
  }

  return (
    <Modal onClose={toggleEdit} open={open}>
      <Modal.Header>{getTextIn(group.name)}</Modal.Header>
      <Modal.Content>
        <AssociateTagForm
          formErrors={formErrors}
          formValues={formValues}
          group={group}
          handleChange={handleChange}
          selectFieldItems={selectFieldItems}
          tagName={tagName}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button content="Cancel" icon="cancel" labelPosition="right" onClick={toggleEdit} />
        <Button
          content="Remove"
          disabled={isLoading || !group.tags?.[tagName]}
          icon="trash"
          labelPosition="right"
          negative
          onClick={handleRemove}
          type="submit"
        />
        <Button
          content="Save"
          disabled={isLoading}
          icon="checkmark"
          labelPosition="right"
          onClick={handleSave}
          positive
          type="submit"
        />
      </Modal.Actions>
    </Modal>
  )
}

const AssociateTagForm = ({ formErrors, formValues, group, handleChange, selectFieldItems, tagName }) => (
  <>
    <p>
      {tagName === 'studyProgramme'
        ? 'Edit associated study programme for this group:'
        : 'Edit associated starting year for this group:'}
    </p>
    <Form style={{ alignItems: 'center' }}>
      <div>
        {tagName === 'studyProgramme' ? (
          <Form.Select
            closeOnChange
            fluid
            name={tagName}
            onChange={(_, { value }) => handleChange(tagName, value)}
            options={selectFieldItems}
            placeholder={
              selectFieldItems.find(item => item.value === group.tags?.[tagName])?.text || 'Select study programme'
            }
            search={textAndDescriptionSearch}
            value={formValues[tagName]}
          />
        ) : (
          <Datetime
            className="guidance-group-overview-year-tag-selector"
            closeOnSelect
            dateFormat={YEAR_DATE_FORMAT}
            initialValue={group.tags?.[tagName]}
            inputProps={{ readOnly: true }}
            name={tagName}
            onChange={value => handleChange(tagName, value?.format(YEAR_DATE_FORMAT))}
            renderInput={({ value, ...rest }) => {
              return (
                <div>
                  <input
                    placeholder="Select year"
                    style={{ maxWidth: 400 }}
                    value={startYearToAcademicYear(value)}
                    {...rest}
                  />
                </div>
              )
            }}
            renderYear={(props, year) => {
              const shiftBy = 2 // fix to start from 2017 instead of 2019
              const formattedAndShiftedYear = startYearToAcademicYear(year - shiftBy)
              const shiftedProps = {
                ...props,
                key: props.key - shiftBy,
                className:
                  `${formValues[tagName]}` === formattedAndShiftedYear.substring(0, 4)
                    ? 'rdtYear rdtActive'
                    : 'rdtYear',
                'data-value': props['data-value'] - shiftBy,
              }
              return <td {...shiftedProps}> {formattedAndShiftedYear}</td>
            }}
            timeFormat={false}
            value={formValues[tagName]}
          />
        )}
      </div>
    </Form>
    {formErrors[tagName] && <Message header={`${formErrors[tagName]}`} icon="exclamation circle" negative />}
  </>
)

const TagCell = ({ group, studyProgrammes, tagName }) => {
  const [showEdit, toggleEdit] = useToggle()
  const getText = () => {
    switch (tagName) {
      case 'studyProgramme':
        return studyProgrammes.find(programme => programme.value === group.tags?.[tagName])?.text
      case 'year':
        return startYearToAcademicYear(group.tags?.[tagName])
      default:
        throw Error(`Wrong tagname: ${tagName}`)
    }
  }
  return (
    <>
      <EditTagModal
        group={group}
        open={showEdit}
        selectFieldItems={studyProgrammes}
        tagName={tagName}
        toggleEdit={toggleEdit}
      />
      {group.tags?.[tagName] ? (
        <div style={{ ...cellWrapper, alignItems: 'baseline' }}>
          <p style={{ ...cellContent, textAlign: 'left' }}>{getText()}</p>
          <div style={{ ...cellContent, flexGrow: 0 }}>
            <Button icon="pencil" onClick={toggleEdit} size="tiny" />
          </div>
        </div>
      ) : (
        <Button content={`Add ${prettifyCamelCase(tagName)}`} icon="add" onClick={toggleEdit} size="tiny" />
      )}
    </>
  )
}

export const StudyGuidanceGroupOverview = ({ groups }) => {
  const { getTextIn } = useLanguage()
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()

  const headers = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: group => getTextIn(group.name),
      getRowContent: group => <LinkToGroup group={group} />,
    },
    {
      key: 'students',
      title: 'Students',
      filterType: 'range',
      getRowVal: group => group.members?.length || 0,
      getRowContent: group => group.members?.length || 0,
    },
    {
      key: 'studyProgramme',
      title: 'Study programme',
      getRowVal: group => group.tags?.studyProgramme,
      formatValue: value => studyProgrammes.find(programme => programme.value === value)?.text,
      getRowContent: group => <TagCell group={group} studyProgrammes={studyProgrammes} tagName="studyProgramme" />,
    },
    {
      key: 'associatedYear',
      title: 'Associated starting academic year',
      getRowVal: group => group.tags?.year,
      formatValue: startYearToAcademicYear,
      getRowContent: group => <TagCell group={group} tagName="year" />,
    },
  ]

  if (groups.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StyledMessage style={{ marginBottom: '30px' }}>
        <p>
          Tällä sivulla pääset tarkastemaan ohjattavien opiskelijoidesi etenemistä ohjausryhmittäin. Voit halutessasi
          lisätä ohjausryhmään aloitusvuoden ja koulutusohjelman, jolloin yksittäisen ohjausryhmän näkymään avautuu
          lisäominaisuuksia.
        </p>
        <p>
          Valitsemalla valikosta Special populations &gt; Students close to graduation voit tarkastella ohjausryhmiesi
          lähellä valmistumista olevia opiskelijoita.
        </p>
      </StyledMessage>
      <div data-cy="Table-study-guidance-group-overview" style={{ margin: 'auto' }}>
        <SortableTable columns={headers} data={groups} hideHeaderBar singleLine={false} />
      </div>
    </div>
  )
}
