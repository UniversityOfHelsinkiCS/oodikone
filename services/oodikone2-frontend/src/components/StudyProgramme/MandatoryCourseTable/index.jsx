import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { sortBy } from 'lodash'
import { arrayOf, string, shape, func } from 'prop-types'
import { Button, Dropdown } from 'semantic-ui-react'
import SortableTable from '../../SortableTable'
import { getTextIn } from '../../../common'
import {
  GetMandatoryCourseLabels
} from '../../../redux/mandatoryCourseLabels'

const MandatoryCourseTable = ({
  studyProgramme,
  mandatoryCourses,
  language,
  deleteMandatoryCourse,
  setMandatoryCourseLabel,
  labels,
  getLabels
}) => {
  useEffect(() => { getLabels(studyProgramme) }, [])

  const deleteButton = code => (
    <Button onClick={() => deleteMandatoryCourse(studyProgramme, code)}>
      Delete
    </Button>
  )

  const idtolabel = labels.reduce((acc, e) => { acc[e.id] = e; return acc }, {})
  const options = sortBy(labels, ['label']).map(e => ({ key: e.id, text: e.label, value: e.id }))
  const columns = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: course => getTextIn(course.name, language)
    },
    { key: 'code', title: 'Code', getRowVal: course => course.code },
    {
      key: 'label',
      title: 'Label',
      getRowVal: course =>
        course.label &&
        idtolabel[course.label.id] &&
        idtolabel[course.label.id].label,
      getRowContent: course => (
        <Dropdown
          clearable
          selectOnBlur={false}
          selectOnNavigation={false}
          placeholder="select label"
          defaultValue={course.label && course.label.id}
          disabled={options.length === 0}
          options={options}
          onChange={(_, { value }) =>
            setMandatoryCourseLabel(studyProgramme, course.code, {
              id: value === '' ? null : value
            })
          }
        />
      )
    },
    {
      key: 'delete',
      title: 'Delete',
      getRowVal: course => deleteButton(course.code)
    }
  ]

  return (
    <SortableTable
      columns={columns}
      data={mandatoryCourses}
      getRowKey={row => row.code}
    />
  )
}

MandatoryCourseTable.propTypes = {
  mandatoryCourses: arrayOf(shape({})).isRequired,
  studyProgramme: string.isRequired,
  deleteMandatoryCourse: func.isRequired,
  setMandatoryCourseLabel: func.isRequired,
  language: string.isRequired,
  labels: arrayOf(shape({ code: string, label: string, name: shape({}) })).isRequired,
  getLabels: func.isRequired
}

const mapStateToProps = ({ mandatoryCourseLabels }) => ({
  labels: mandatoryCourseLabels.data
})

const mapDispatchToProps = dispatch => ({
  getLabels: studyProgramme => dispatch(GetMandatoryCourseLabels(studyProgramme))
})

export default connect(mapStateToProps, mapDispatchToProps)(MandatoryCourseTable)
