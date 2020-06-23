import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { arrayOf, string, shape, func } from 'prop-types'
import { Button, Label } from 'semantic-ui-react'
import SortableTable from '../../SortableTable'
import { getTextIn } from '../../../common'
import { GetMandatoryCourseLabels } from '../../../redux/mandatoryCourseLabels'
import { setCourseExclusion, removeCourseExclusion } from '../../../redux/populationMandatoryCourses'

const MandatoryCourseTable = ({
  studyProgramme,
  mandatoryCourses,
  language,
  labels,
  getLabels,
  setExclusion,
  removeExclusion
}) => {
  useEffect(() => {
    getLabels(studyProgramme)
  }, [])

  const setExclusionButton = code => <Button onClick={() => setExclusion(studyProgramme, code)}>Set hidden</Button>
  const deleteButton = (coursecode, id) => (
    <Button onClick={() => removeExclusion(studyProgramme, coursecode, id)}>Set visible</Button>
  )

  const idtolabel = labels.reduce((acc, e) => {
    acc[e.id] = e
    return acc
  }, {})

  // remove duplicates for now until we figure out how to present modules

  const filteredCourses = mandatoryCourses.filter(course => {
    let counter = 0
    mandatoryCourses.forEach(course2 => {
      if (course2.code === course.code) counter += 1
    })
    return counter === 1
  })

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
      getRowVal: course => course.label && idtolabel[course.label.id] && idtolabel[course.label.id].label,
      getRowContent: course => (
        <Label
          content={course.visible.visibility ? 'visible' : 'hidden'}
          color={course.visible.visibility ? 'green' : 'red'}
        />
      )
    },
    {
      key: 'visibility',
      title: 'Set visibility',
      getRowVal: course =>
        course.visible.visibility ? setExclusionButton(course.code) : deleteButton(course.code, course.visible.id)
    }
  ]

  return <SortableTable columns={columns} data={filteredCourses} getRowKey={row => row.code} />
}

MandatoryCourseTable.propTypes = {
  mandatoryCourses: arrayOf(shape({})).isRequired,
  studyProgramme: string.isRequired,
  removeExclusion: func.isRequired,
  setExclusion: func.isRequired,
  language: string.isRequired,
  labels: arrayOf(shape({ code: string, label: string, name: shape({}) })).isRequired,
  getLabels: func.isRequired
}

const mapStateToProps = ({ mandatoryCourseLabels }) => ({
  labels: mandatoryCourseLabels.data
})

const mapDispatchToProps = dispatch => ({
  getLabels: studyProgramme => dispatch(GetMandatoryCourseLabels(studyProgramme)),
  setExclusion: (programmecode, coursecode) => dispatch(setCourseExclusion(programmecode, coursecode)),
  removeExclusion: (programmecode, coursecode, id) => dispatch(removeCourseExclusion(programmecode, coursecode, id))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MandatoryCourseTable)
