import React, { useEffect, useState } from 'react'
import Datetime from 'react-datetime'
import { Link, useHistory } from 'react-router-dom'
import { Form, Button, Icon, Modal, Message } from 'semantic-ui-react'

import { textAndDescriptionSearch } from '@/common'
import { useToggle } from '@/common/hooks'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { useFilteredAndFormattedElementDetails } from '@/redux/elementdetails'
import { useChangeStudyGuidanceGroupTagsMutation } from '@/redux/studyGuidanceGroups'
import { startYearToAcademicYear, StyledMessage } from './common'
import './StudyGuidanceGroupOverview.css'

const LinkToGroup = ({ group }) => {
  const { getTextIn } = useLanguage()
  const history = useHistory()
  const dest = `/studyguidancegroups/${group.id}`
  return (
    <Link
      style={{
        color: 'black',
        display: 'inline-block',
        width: '100%',
        height: '100%',
        padding: '.78571429em .78571429em',
      }}
      to={dest}
      data-cy={`study-guidance-group-link-${group.id}`}
    >
      {getTextIn(group.name)}
      <Icon color="blue" name="level up alternate" onClick={() => history.push(dest)} />
    </Link>
  )
}

const prettifyCamelCase = str => {
  const splitted = str.match(/[A-Za-z][a-z]*/g) || []
  return splitted.map(w => w.charAt(0).toLowerCase() + w.substring(1)).join(' ')
}

const cellWrapper = { display: 'flex', gap: '8px', width: '100%' }
const cellContent = { flexGrow: 1 }

const EditTagModal = ({ group, tagName, toggleEdit, selectFieldItems, open }) => {
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

  const handleSubmit = () => {
    const errors = validate(formValues)
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      changeStudyGuidanceGroupTags({ groupId: group.id, tags: formValues })
      toggleEdit()
    }
  }

  return (
    <Modal onClose={toggleEdit} open={open}>
      <>
        <Modal.Header>{getTextIn(group.name)}</Modal.Header>
        <Modal.Content>
          <AssociateTagForm
            group={group}
            tagName={tagName}
            selectFieldItems={selectFieldItems}
            formValues={formValues}
            handleChange={handleChange}
            formErrors={formErrors}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button content="Cancel" labelPosition="right" icon="trash" onClick={toggleEdit} negative />
          <Button
            content="Save"
            type="submit"
            labelPosition="right"
            icon="checkmark"
            onClick={handleSubmit}
            disabled={isLoading}
            positive
          />
        </Modal.Actions>
      </>
    </Modal>
  )
}

const AssociateTagForm = ({ group, tagName, selectFieldItems, formValues, handleChange, formErrors }) => (
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
            name={tagName}
            search={textAndDescriptionSearch}
            fluid
            placeholder={
              selectFieldItems.find(p => p.value === group.tags?.[tagName])?.text || 'Select study programme'
            }
            options={selectFieldItems}
            closeOnChange
            value={formValues[tagName]}
            onChange={(_, { value }) => handleChange(tagName, value)}
          />
        ) : (
          <Datetime
            className="guidance-group-overview-year-tag-selector"
            name={tagName}
            dateFormat="YYYY"
            timeFormat={false}
            initialValue={group.tags?.[tagName]}
            inputProps={{ readOnly: true }}
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
            renderInput={({ value, ...rest }) => {
              return (
                <div>
                  <input
                    value={startYearToAcademicYear(value)}
                    placeholder="Select year"
                    style={{ maxWidth: 400 }}
                    {...rest}
                  />
                </div>
              )
            }}
            closeOnSelect
            value={formValues[tagName]}
            onChange={value => handleChange(tagName, value?.format('YYYY'))}
          />
        )}
      </div>
    </Form>
    {formErrors[tagName] && <Message negative icon="exclamation circle" header={`${formErrors[tagName]}`} />}
  </>
)

const TagCell = ({ tagName, group, studyProgrammes }) => {
  const [showEdit, toggleEdit] = useToggle()
  const getText = () => {
    switch (tagName) {
      case 'studyProgramme':
        return studyProgrammes.find(p => p.value === group.tags?.[tagName])?.text
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
        tagName={tagName}
        toggleEdit={toggleEdit}
        selectFieldItems={studyProgrammes}
        open={showEdit}
      />
      {group.tags?.[tagName] ? (
        <div style={{ ...cellWrapper, alignItems: 'baseline' }}>
          <p style={{ ...cellContent, textAlign: 'center' }}>{getText()}</p>
          <div style={{ ...cellContent, flexGrow: 0 }}>
            <Button icon="pencil" onClick={() => toggleEdit()} size="tiny" />
          </div>
        </div>
      ) : (
        <Button content={`Add ${prettifyCamelCase(tagName)}`} icon="add" onClick={() => toggleEdit()} size="tiny" />
      )}
    </>
  )
}

export const StudyGuidanceGroupOverview = ({ groups }) => {
  const { getTextIn } = useLanguage()
  const studyProgrammes = useFilteredAndFormattedElementDetails()

  const headers = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: group => getTextIn(group.name),
      getRowContent: group => <LinkToGroup group={group} />,
      cellProps: {
        style: {
          padding: '0',
        },
        className: 'iconCellNoPointer',
      },
    },
    {
      key: 'students',
      title: 'Students',
      filterType: 'range',
      getRowVal: group => group.members?.length || 0,
      getRowContent: group => group.members?.length || 0,
      cellProps: {
        style: {
          padding: '0',
          textAlign: 'center',
        },
      },
    },
    {
      key: 'studyProgramme',
      title: 'Study Programme',
      getRowVal: group => group.tags?.studyProgramme,
      formatValue: value => studyProgrammes.find(p => p.value === value)?.text,
      getRowContent: group => <TagCell tagName="studyProgramme" studyProgrammes={studyProgrammes} group={group} />,
    },
    {
      key: 'associatedyear',
      title: 'Associated Starting Academic Year',
      getRowVal: group => group.tags?.year,
      formatValue: startYearToAcademicYear,
      getRowContent: group => <TagCell tagName="year" group={group} />,
    },
  ]

  if (groups.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }
  return (
    <>
      <StyledMessage>
        <p>
          Tällä sivulla pääset tarkastemaan ohjattavien opiskelijoidesi etenemistä ohjausryhmittäin. Voit halutessasi
          lisätä ohjausryhmään aloitusvuoden ja koulutusohjelman, jolloin yksittäisen ohjausryhmän näkymään avautuu
          lisäominaisuuksia.{' '}
        </p>
      </StyledMessage>
      <div data-cy="Table-study-guidance-group-overview">
        <SortableTable hideHeaderBar columns={headers} data={groups} singleLine={false} />
      </div>
    </>
  )
}
