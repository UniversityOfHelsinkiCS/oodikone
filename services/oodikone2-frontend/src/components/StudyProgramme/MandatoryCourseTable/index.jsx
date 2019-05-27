import React, { useState } from 'react'
import { arrayOf, string, shape, func } from 'prop-types'
import { Button, Form } from 'semantic-ui-react'
import SortableTable from '../../SortableTable'
import { getTextIn } from '../../../common'

const MandatoryCourseTable = ({ studyProgramme, mandatoryCourses, language, deleteMandatoryCourse, setMandatoryCourseLabel }) => {
  const deleteButton = code => (
    <Button
      onClick={() => deleteMandatoryCourse(studyProgramme, code)}
    >
      Delete
    </Button>
  )

  const initialLabels = mandatoryCourses.reduce((acc, e) => {
    acc[e.code] = e.label
    return acc
  }, {})
  const [labels, setLabels] = useState(initialLabels)
  const labelInput = code => (
    <Form>
      <Form.Group>
        <Form.Input defaultValue={initialLabels[code]} onChange={e => setLabels({ ...labels, [code]: e.target.value })} />
        <Form.Button
          disabled={initialLabels[code] === labels[code] || labels[code] == null || (initialLabels[code] == null && labels[code] === '')}
          onClick={() => setMandatoryCourseLabel(studyProgramme, code, labels[code])}
        >
          Save label
        </Form.Button>
      </Form.Group>
    </Form>
  )

  const columns = [
    { key: 'name', title: 'Name', getRowVal: course => getTextIn(course.name, language) },
    { key: 'code', title: 'Code', getRowVal: course => course.code },
    { key: 'label', title: 'Label', getRowVal: course => labels[course.code], getRowContent: course => labelInput(course.code) },
    { key: 'delete', title: 'Delete', getRowVal: course => deleteButton(course.code) }
  ]

  return <SortableTable columns={columns} data={mandatoryCourses} getRowKey={row => row.code} />
}

MandatoryCourseTable.propTypes = {
  mandatoryCourses: arrayOf(shape({})).isRequired,
  studyProgramme: string.isRequired,
  deleteMandatoryCourse: func.isRequired,
  setMandatoryCourseLabel: func.isRequired,
  language: string.isRequired
}

export default MandatoryCourseTable
