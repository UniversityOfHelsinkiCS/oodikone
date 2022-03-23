import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import { Formik } from 'formik'
import { Form, Button, Icon } from 'semantic-ui-react'
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

const AssociateTagForm = ({ group, tagName, toggleEdit, selectFieldItems }) => {
  const [changeStudyGuidanceGroupTags, { isLoading }] = useChangeStudyGuidanceGroupTagsMutation()
  return (
    <div>
      <Formik
        initialValues={{ [tagName]: '' }}
        onSubmit={values => {
          changeStudyGuidanceGroupTags({ groupId: group.id, tags: values })
          if (group.tags?.[tagName]) toggleEdit()
        }}
        validate={values => (!values[tagName] ? { [tagName]: `${tagName} is required` } : {})}
      >
        {formik => (
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
                    const shiftedProps = {
                      ...props,
                      key: props.key - shiftBy,
                      'data-value': props['data-value'] - shiftBy,
                    }
                    const formattedAndShiftedYear = startYearToAcademicYear(year - shiftBy)
                    return <td {...shiftedProps}> {formattedAndShiftedYear}</td>
                  }}
                  renderInput={({ value, ...rest }) => {
                    return (
                      <div>
                        <input value={startYearToAcademicYear(value)} placeholder="Select year" {...rest} />
                      </div>
                    )
                  }}
                  closeOnSelect
                  value={formik.values[tagName]}
                  onChange={value => formik.setFieldValue(tagName, value?.format('YYYY'))}
                />
              )}
            </div>
            <div style={{ ...cellContent, flexGrow: 0 }}>
              <Button type="submit" style={{ margin: '0' }} disabled={isLoading}>
                Add {prettifyCamelCase(tagName)}
              </Button>
            </div>
            {group.tags?.[tagName] && (
              <div style={cellContent}>
                <Button icon type="button" style={{ margin: '0' }} onClick={() => toggleEdit()}>
                  Close
                  <Icon name="close" />
                </Button>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  )
}

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
  return group.tags?.[tagName] && !showEdit ? (
    <div style={{ ...cellWrapper, alignItems: 'baseline' }}>
      <p style={{ ...cellContent, textAlign: 'center' }}>{getText()}</p>
      <div style={{ ...cellContent, flexGrow: 0 }}>
        <Button type="button" onClick={() => toggleEdit()}>
          Edit {prettifyCamelCase(tagName)}
        </Button>
      </div>
    </div>
  ) : (
    <AssociateTagForm group={group} tagName={tagName} toggleEdit={toggleEdit} selectFieldItems={studyProgrammes} />
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
      <SortableTable figure={false} columns={headers} getRowKey={group => group.id} data={groups} />
    </>
  )
}

export default StudyGuidanceGroupOverview
