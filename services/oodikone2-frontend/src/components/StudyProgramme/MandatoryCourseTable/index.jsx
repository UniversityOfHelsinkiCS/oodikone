import React from 'react'
import { arrayOf, string, shape, func } from 'prop-types'
import { Button } from 'semantic-ui-react'
import SortableTable from '../../SortableTable'

const MandatoryCourseTable = ({ studyProgramme, mandatoryCourses, language, deleteMandatoryCourse }) => {
  const deleteButton = code => (
    <Button
      onClick={() => deleteMandatoryCourse(studyProgramme, code)}
    >
      Delete
    </Button>
  )

  const columns = [
    { key: 'name', title: 'Name', getRowVal: course => course.name ? course.name[language] : null }, //eslint-disable-line
    { key: 'code', title: 'Code', getRowVal: course => course.code },
    { key: 'delete', title: 'Delete', getRowVal: course => deleteButton(course.code) }
  ]

  return <SortableTable columns={columns} data={mandatoryCourses} getRowKey={row => row.code} />
}

MandatoryCourseTable.propTypes = {
  mandatoryCourses: arrayOf(shape({})).isRequired,
  studyProgramme: string.isRequired,
  deleteMandatoryCourse: func.isRequired,
  language: string.isRequired
}

export default MandatoryCourseTable
