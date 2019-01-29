import React from 'react'
import { arrayOf, string, shape } from 'prop-types'
import SortableTable from '../../SortableTable'

const MandatoryCourseTable = ({ mandatoryCourses, language }) => {
  const columns = [
    { key: 'name', title: 'Name', getRowVal: course => course.name[language] },
    { key: 'code', title: 'Code', getRowVal: course => course.code }
  ]
  return <SortableTable columns={columns} data={mandatoryCourses} getRowKey={row => row.code} />
}

MandatoryCourseTable.propTypes = {
  mandatoryCourses: arrayOf(shape({})).isRequired,
  language: string.isRequired
}

export default MandatoryCourseTable
