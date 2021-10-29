import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Formik } from 'formik'
import { Form, Button } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import SortableTable from '../SortableTable'
import { getTextIn } from '../../common'
import StyledMessage from './StyledMessage'
import { changeStudyGuidanceGroupTags } from '../../redux/studyGuidanceGroups'

const LinkToGroup = ({ group, language }) => (
  <Link
    style={{
      color: 'black',
      display: 'inline-block',
      width: '100%',
      height: '100%',
      padding: '.78571429em .78571429em',
    }}
    to={`/studyguidancegroups/${group.id}`}
  >
    {getTextIn(group.name, language)}
  </Link>
)

const prettifyCamelCase = str => {
  const splitted = str.match(/[A-Za-z][a-z]*/g) || []
  return splitted.map(w => w.charAt(0).toLowerCase() + w.substring(1)).join(' ')
}

const AssociateTagForm = ({ group, tagName }) => {
  const dispatch = useDispatch()
  const studyProgrammeOptions = [
    {
      key: 'KH57_003',
      text: 'Ympäristötieteiden kandiohjelma',
      value: 'KH57_003',
      id: tagName,
    },
    {
      key: 'MH20_001',
      text: 'Oikeustieteen maisterin koulutusohjelma',
      value: 'MH20_001',
      id: tagName,
    },
  ]

  return (
    <Formik
      initialValues={{ [tagName]: '' }}
      onSubmit={values => {
        dispatch(changeStudyGuidanceGroupTags(group.id, values))
      }}
      validate={values => (!values[tagName] ? { [tagName]: `${tagName} is required` } : {})}
    >
      {formik => (
        <Form onSubmit={formik.handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tagName === 'studyProgramme' ? (
            <Form.Select
              name={tagName}
              style={{ margin: 'revert' }}
              fluid
              placeholder="Select study programme"
              options={studyProgrammeOptions}
              closeOnChange
              value={formik.values[tagName]}
              onChange={(_, value) => formik.setFieldValue(tagName, value?.value)}
            />
          ) : (
            <Datetime
              name={tagName}
              dateFormat="YYYY"
              timeFormat={false}
              renderYear={(props, selectableYear) => <td {...props}>{selectableYear}</td>}
              closeOnSelect
              value={formik.values[tagName]}
              onChange={value => formik.setFieldValue(tagName, value?.format('YYYY'))}
            />
          )}
          <Button type="submit">Add {prettifyCamelCase(tagName)}</Button>
        </Form>
      )}
    </Formik>
  )
}

const StudyGuidanceGroupOverview = () => {
  const { language } = useSelector(({ settings }) => settings)
  const { data: groups } = useSelector(({ studyGuidanceGroups }) => studyGuidanceGroups)
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
      },
    },
    {
      key: 'studyProgramme',
      title: 'Study programme',
      getRowVal: () => 'studyProgramme',
      getRowContent: group => <AssociateTagForm group={group} tagName="studyProgramme" />,
    },
    {
      key: 'associatedyear',
      title: 'Associated year',
      getRowVal: () => 'associatedYear',
      getRowContent: group => <AssociateTagForm group={group} tagName="year" />,
    },
  ]

  if (groups.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }
  return (
    <>
      <StyledMessage>
        <p>Tällä sivulla pääset tarkastemaan ohjattavien opiskelijoidesi etenemistä ohjausryhmittäin.</p>
      </StyledMessage>
      <SortableTable columns={headers} getRowKey={group => group.id} data={groups} />
    </>
  )
}

export default StudyGuidanceGroupOverview
