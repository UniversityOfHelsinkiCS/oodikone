import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Formik } from 'formik'
import { Form, Button, Icon } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import SortableTable from '../SortableTable'
import { getTextIn } from '../../common'
import StyledMessage from './StyledMessage'
import { changeStudyGuidanceGroupTags } from '../../redux/studyGuidanceGroups'
import { useToggle } from '../../common/hooks'

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
const studyProgrammeOptions = [
  {
    key: 'KH57_003',
    text: 'Ympäristötieteiden kandiohjelma',
    value: 'KH57_003',
  },
  {
    key: 'MH20_001',
    text: 'Oikeustieteen maisterin koulutusohjelma',
    value: 'MH20_001',
  },
]

const AssociateTagForm = ({ group, tagName, toggleEdit }) => {
  const dispatch = useDispatch()

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Formik
        initialValues={{ [tagName]: '' }}
        onSubmit={values => {
          dispatch(changeStudyGuidanceGroupTags(group.id, values))
        }}
        validate={values => (!values[tagName] ? { [tagName]: `${tagName} is required` } : {})}
      >
        {formik => (
          <Form onSubmit={formik.handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            {tagName === 'studyProgramme' ? (
              <Form.Select
                name={tagName}
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
            <Button type="submit" style={{ margin: '0 0 1em 0' }}>
              Add {prettifyCamelCase(tagName)}
            </Button>
          </Form>
        )}
      </Formik>

      {group.tags?.[tagName] ? (
        <Button icon style={{ margin: '0 0 1em 0' }} onClick={() => toggleEdit()}>
          Close
          <Icon name="close" />
        </Button>
      ) : null}
    </div>
  )
}

const TagCell = ({ tagName, value, toggleEdit }) => {
  const text = tagName === 'studyProgramme' ? studyProgrammeOptions.find(p => p.value === value).text : value
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
      <p>{text}</p>
      <Button type="button" onClick={() => toggleEdit()}>
        Edit {prettifyCamelCase(tagName)}
      </Button>
    </div>
  )
}

const StudyGuidanceGroupOverview = () => {
  const { language } = useSelector(({ settings }) => settings)
  const { data: groups } = useSelector(({ studyGuidanceGroups }) => studyGuidanceGroups)
  const [showEditStudyProgramme, toggleShowEditStudyProgramme] = useToggle()
  const [showEditYear, toggleShowEditYear] = useToggle()

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
      getRowContent: group =>
        group.tags?.studyProgramme && !showEditStudyProgramme ? (
          <TagCell
            tagName="studyProgramme"
            value={group.tags.studyProgramme}
            toggleEdit={toggleShowEditStudyProgramme}
          />
        ) : (
          <AssociateTagForm group={group} tagName="studyProgramme" toggleEdit={toggleShowEditStudyProgramme} />
        ),
    },
    {
      key: 'associatedyear',
      title: 'Associated year',
      getRowVal: () => 'associatedYear',
      getRowContent: group =>
        group.tags?.year && !showEditYear ? (
          <TagCell tagName="year" value={group.tags.year} toggleEdit={toggleShowEditYear} />
        ) : (
          <AssociateTagForm group={group} tagName="year" toggleEdit={toggleShowEditYear} />
        ),
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
