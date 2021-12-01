import React, { useState, useMemo } from 'react'
import { Table, Icon, Popup, Item, Pagination } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { useSelector, connect } from 'react-redux'
import { bool, instanceOf, func } from 'prop-types'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import FilterToggleIcon from '../../FilterToggleIcon'
import useFilters from '../../FilterView/useFilters'
import { isCourseSelected, toggleCourseSelection } from '../../FilterView/filters/courses'
import { getTextIn } from '../../../common'
import StudentNameVisibilityToggle from '../../StudentNameVisibilityToggle'

const verticalTitle = (...params) => {
  // https://stackoverflow.com/a/41396815
  return (
    <div className="studentVerticalTitle">
      {params.map(p => (
        <div key={p}>{p}</div>
      ))}
    </div>
  )
}

const StudentsRow = ({ course, pagedStudents, hasCompleted, onGoToCourseStatisticsClick }) => {
  const { language } = useSelector(({ settings }) => settings)
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isCourseSelected(course.code))

  return (
    <Table.Row key={course.code}>
      <Popup
        trigger={
          <Table.Cell className="filterCell clickableCell">
            <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleCourseSelection(course.code))} />
          </Table.Cell>
        }
        content={
          isActive ? (
            <span>
              Poista rajaus kurssin <b>{getTextIn(course.name, language)}</b> perusteella
            </span>
          ) : (
            <span>
              Rajaa opiskelijat kurssin <b>{getTextIn(course.name, language)}</b> perusteella
            </span>
          )
        }
        position="top right"
      />
      <Table.Cell className="nameCell" key="name" content={course.name.fi} />
      <Table.Cell className="iconCell clickableCell">
        <p>
          <Item
            as={Link}
            to={`/coursestatistics?courseCodes=["${encodeURIComponent(
              course.code
            )}"]&separate=false&unifyOpenUniCourses=false`}
          >
            <Icon name="level up alternate" onClick={() => onGoToCourseStatisticsClick(course.code)} />
          </Item>
        </p>
      </Table.Cell>
      <Table.Cell key="code" content={course.code} />
      {pagedStudents.map(student => (
        <Table.Cell
          key={student.studentnumber}
          content={hasCompleted(student.studentnumber) ? <Icon fitted name="check" color="green" /> : null}
        />
      ))}
    </Table.Row>
  )
}

const Students = ({ filteredStudents, expandedGroups, toggleGroupExpansion, showNames }) => {
  const { courseStatistics, filterInput, onGoToCourseStatisticsClick, modules } = UsePopulationCourseContext()
  const { language } = useSelector(({ settings }) => settings)
  const [page, setPage] = useState(0)

  const hasCompleted = (courseCode, student) => {
    const course = courseStatistics.find(c => c.course.code === courseCode)
    if (!course) return false

    return Boolean(course.students.passed[student])
  }

  const countCompleted = (courses, student) => {
    let completed = 0
    courses.forEach(course => {
      if (hasCompleted(course.code, student)) {
        completed++
      }
    })

    return completed
  }

  const students = useMemo(() => {
    const studentSet = new Set()
    courseStatistics.forEach(course => {
      const allStudents = Object.keys(course.students.all)
      allStudents.forEach(student => studentSet.add(student))
    })

    const allStudents = Array.from(studentSet)
    return allStudents
      .map(student => {
        let passed = 0
        courseStatistics.forEach(course => {
          if (course.students.passed[student]) {
            passed++
          }
        })

        const found = filteredStudents?.find(s => s?.studentNumber === student)
        const name = found ? `${found.lastname} ${found.firstnames}` : null

        return { studentnumber: student, name, passed }
      })
      .filter(s => !!s.name)
  }, [courseStatistics])

  const maxPages = Math.floor(students.length / 10)

  const pagedStudents = students.slice(page * 10, page * 10 + 10)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <StudentNameVisibilityToggle />
      </div>
      <Pagination
        secondary
        activePage={page + 1}
        totalPages={maxPages + 1}
        onPageChange={(e, { activePage }) => setPage(activePage - 1)}
        ellipsisItem={null}
        firstItem={null}
        lastItem={null}
      />
      <Table sortable className="fixed-header" striped celled>
        <Table.Header>
          <Table.Row>
            {filterInput('nameFilter', 'Name', '3')}
            {filterInput('codeFilter', 'Code')}
            {pagedStudents.map(student => (
              <Table.HeaderCell
                key={student.studentnumber}
                content={
                  <Link style={{ color: 'black' }} to={`/students/${student.studentnumber}`}>
                    {showNames ? verticalTitle(student.name) : verticalTitle(student.studentnumber)}
                  </Link>
                }
              />
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {modules.map(({ module, courses }) => (
            <React.Fragment key={module.code}>
              <Table.Row>
                <Table.Cell style={{ cursor: 'pointer' }} colSpan="3" onClick={() => toggleGroupExpansion(module.code)}>
                  <Icon name={expandedGroups.has(module.code) ? 'angle down' : 'angle right'} />
                  <b>{getTextIn(module.name, language)}</b>
                </Table.Cell>
                <Table.Cell>
                  <b>{module.code}</b>
                </Table.Cell>
                {pagedStudents.map(student => (
                  <Table.Cell key={`${module.code}-${student.studentnumber}`}>
                    {countCompleted(courses, student.studentnumber)}
                  </Table.Cell>
                ))}
              </Table.Row>
              {expandedGroups.has(module.code) &&
                courses
                  .filter(c => c.visible.visibility)
                  .map(col => (
                    <StudentsRow
                      course={col}
                      pagedStudents={pagedStudents}
                      hasCompleted={sn => hasCompleted(col.code, sn)}
                      onGoToCourseStatisticsClick={onGoToCourseStatisticsClick}
                    />
                  ))}
            </React.Fragment>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

const mapStateToProps = state => ({
  showNames: state.settings.namesVisible,
})

Students.propTypes = {
  showNames: bool.isRequired,
  expandedGroups: instanceOf(Set).isRequired,
  toggleGroupExpansion: func.isRequired,
}

export default connect(mapStateToProps)(Students)
