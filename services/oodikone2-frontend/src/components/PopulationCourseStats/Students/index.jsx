import React, { useState, useMemo, useEffect } from 'react'
import { Table, Icon } from 'semantic-ui-react'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const verticalTitle = title => {
  // https://stackoverflow.com/a/41396815
  return <div className="tableVerticalTitle">{title}</div>
}

const Students = () => {
  const { courseStatistics, filterInput } = UsePopulationCourseContext()
  const [page, setPage] = useState(0)
  const [sortedRows, setSortedRows] = useState(courseStatistics.map(c => ({ ...c.course, passed: c.stats.passed })))

  useEffect(() => {
    setSortedRows(courseStatistics.map(c => ({ ...c.course, passed: c.stats.passed })))
  }, [courseStatistics])

  const hasCompleted = (courseCode, student) => {
    const course = courseStatistics.find(c => c.course.code === courseCode)
    if (!course) return false

    return Boolean(course.students.passed[student])
  }

  const students = useMemo(() => {
    const studentSet = new Set()
    courseStatistics.forEach(course => {
      const allStudents = Object.keys(course.students.all)
      allStudents.forEach(student => studentSet.add(student))
    })

    const allStudents = Array.from(studentSet)
    return allStudents.map(student => {
      let passed = 0
      courseStatistics.forEach(course => {
        if (course.students.passed[student]) {
          passed++
        }
      })

      return { studentnumber: student, passed }
    })
  }, [courseStatistics])

  return (
    <div>
      <button type="button" onClick={() => setPage(page - 1)}>
        page-
      </button>
      <button type="button" onClick={() => setPage(page + 1)}>
        page+
      </button>
      <input type="text" value={page} onChange={e => setPage(Number(e.target.value))} />
      <Table sortable className="fixed-header" striped celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell key="general" content={<b>Students:</b>} colSpan="2" style={{ textAlign: 'right' }} />
            {students.slice(page * 10, page * 10 + 10).map(student => (
              <Table.HeaderCell
                className="rotatedTableHeader"
                key={student.studentnumber}
                content={verticalTitle(student.studentnumber)}
              />
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            {filterInput('nameFilter', 'populationCourses.name')}
            {filterInput('codeFilter', 'populationCourses.code')}
            <Table.Cell>Total</Table.Cell>
            {students.slice(page * 10, page * 10 + 10).map(student => (
              <Table.Cell key={student.studentnumber} content={student.passed} />
            ))}
          </Table.Row>
          {sortedRows.map(col => (
            <Table.Row key={col.code}>
              <Table.Cell key="name" content={col.name.fi} />
              <Table.Cell key="code" content={col.code} />
              <Table.Cell key="totals" content={col.passed} />
              {students.slice(page * 10, page * 10 + 10).map(student => (
                <Table.Cell
                  key={student.studentnumber}
                  content={
                    hasCompleted(col.code, student.studentnumber) ? <Icon fitted name="check" color="green" /> : null
                  }
                />
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default Students
