import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import { Formik } from 'formik'
import { Form, Button, Icon, Modal } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import { getTextIn, textAndDescriptionSearch } from 'common'
import { useChangeStudyGuidanceGroupTagsMutation } from 'redux/studyGuidanceGroups'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'
import { useToggle } from 'common/hooks'
import SortableTable from 'components/SortableTable'
import { startYearToAcademicYear, StyledMessage } from './common'
import './StudyGuidanceGroupOverview.css'

const LinkToGroup = ({ group, language }) => {
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
    >
      {getTextIn(group.name, language)}
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
  const { language } = useSelector(({ settings }) => settings)

  const onSubmit = values => {
    changeStudyGuidanceGroupTags({ groupId: group.id, tags: values })
    toggleEdit()
  }

  return (
    <Modal onClose={toggleEdit} open={open}>
      <Formik
        initialValues={{ [tagName]: '' }}
        onSubmit={values => onSubmit(values)}
        validate={values => (!values[tagName] ? { [tagName]: `${tagName} is required` } : {})}
      >
        {formik => (
          <>
            <Modal.Header>{getTextIn(group.name, language)}</Modal.Header>
            <Modal.Content>
              <AssociateTagForm group={group} tagName={tagName} selectFieldItems={selectFieldItems} formik={formik} />
            </Modal.Content>
            <Modal.Actions>
              <Button content="Cancel" labelPosition="right" icon="trash" onClick={toggleEdit} negative />
              <Button
                content="Save"
                type="submit"
                labelPosition="right"
                icon="checkmark"
                onClick={formik.handleSubmit}
                disabled={isLoading}
                positive
              />
            </Modal.Actions>
          </>
        )}
      </Formik>
    </Modal>
  )
}

const AssociateTagForm = ({ group, tagName, selectFieldItems, formik }) => (
  <>
    <p>
      {tagName === 'studyProgramme'
        ? `Edit associated study programme for this group:`
        : `Edit associated starting year for this group:`}
    </p>
    <Form onSubmit={formik.handleSubmit} style={{ ...cellWrapper, alignItems: 'center' }}>
      <div style={cellContent}>
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
            value={formik.values[tagName]}
            onChange={(_, value) => formik.setFieldValue(tagName, value?.value)}
          />
        ) : (
          <Datetime
            className="studyguidancegroupoverview__yeartagselector"
            name={tagName}
            dateFormat="YYYY"
            timeFormat={false}
            initialvalue={group.tags?.[tagName]}
            inputProps={{ readOnly: true }}
            renderYear={(props, year) => {
              const shiftBy = 2 // fix to start from 2017 instead of 2019
              const formattedAndShiftedYear = startYearToAcademicYear(year - shiftBy)
              const shiftedProps = {
                ...props,
                key: props.key - shiftBy,
                className:
                  `${formik.values[tagName]}` === formattedAndShiftedYear.substring(0, 4)
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
            value={formik.values[tagName]}
            onChange={value => formik.setFieldValue(tagName, value?.format('YYYY'))}
          />
        )}
      </div>
    </Form>
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

const StudyGuidanceGroupOverview = ({ groups }) => {
  const { language } = useSelector(({ settings }) => settings)
  const studyProgrammes = useFilteredAndFormattedElementDetails(language)

  const headers = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: group => getTextIn(group.name, language),
      getRowContent: group => <LinkToGroup group={group} language={language} />,
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
      <SortableTable hideHeaderBar columns={headers} data={groups} singleLine={false} />
    </>
  )
}

export default StudyGuidanceGroupOverview
