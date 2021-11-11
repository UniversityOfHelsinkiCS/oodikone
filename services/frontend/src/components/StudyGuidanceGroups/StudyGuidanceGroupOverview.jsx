import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import { Formik } from 'formik'
import { Form, Button, Icon } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import { getTextIn, textAndDescriptionSearch } from 'common'
import { useChangeStudyGuidanceGroupTagsMutation } from 'redux/studyGuidanceGroups'
import { getElementDetails } from 'redux/elementdetails'
import { useToggle } from 'common/hooks'
import SortableTable from 'components/SortableTable'
import StyledMessage from './StyledMessage'

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

const startYearToAcademicYear = year => {
  return year === '' || Number.isNaN(year) ? '' : `${year} - ${parseInt(year, 10) + 1}`
}

const cellWrapper = { display: 'flex', gap: '8px', width: '100%' }
const cellContent = { flex: '0 1 50%' }

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
                  name={tagName}
                  dateFormat="YYYY"
                  timeFormat={false}
                  initialvalue={group.tags?.[tagName]}
                  renderYear={(props, selectableYear) => <td {...props}>{startYearToAcademicYear(selectableYear)}</td>}
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
            <div style={cellContent}>
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
      <div style={cellContent}>
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
  const dispatch = useDispatch()
  const { language } = useSelector(({ settings }) => settings)
  const { data: elementDetails } = useSelector(({ elementdetails }) => elementdetails)

  useEffect(() => {
    if (elementDetails && elementDetails.length > 0) return
    dispatch(getElementDetails())
  }, [dispatch])

  const studyProgrammesFilteredForDropdown =
    elementDetails
      ?.filter(elem => elem.code.startsWith('KH') || elem.code.startsWith('MH'))
      .map(elem => ({
        key: elem.code,
        value: elem.code,
        description: elem.code,
        text: getTextIn(elem.name, language),
      })) || []

  const headers = [
    {
      key: 'name',
      title: 'name',
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
      title: 'students',
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
      title: 'Study programme',
      getRowVal: group => group.tags?.studyProgramme,
      headerProps: { onClick: null, sorted: null },
      getRowContent: group => (
        <TagCell tagName="studyProgramme" studyProgrammes={studyProgrammesFilteredForDropdown} group={group} />
      ),
    },
    {
      key: 'associatedyear',
      title: 'Associated starting academic year',
      getRowVal: group => group.tags?.year,
      headerProps: { onClick: null, sorted: null },
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
      <SortableTable columns={headers} getRowKey={group => group.id} data={groups} />
    </>
  )
}

export default StudyGuidanceGroupOverview
