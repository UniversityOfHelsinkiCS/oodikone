import React, { useState, useMemo, useEffect } from 'react'
import { Table, Icon, Popup, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import FilterToggleIcon from '../../FilterToggleIcon'
import { getTextIn } from '../../../common'
import useCourseFilter from '../../FilterTray/filters/Courses/useCourseFilter'
import useFeatureToggle from '../../../common/useFeatureToggle'

const verticalTitle = title => {
  // https://stackoverflow.com/a/41396815
  return <div className="tableVerticalTitle">{title}</div>
}

const Students = () => {
  const {
    courseStatistics,
    filterInput,
    isActiveCourse,
    onCourseNameCellClick,
    onGoToCourseStatisticsClick
  } = UsePopulationCourseContext()
  const { language } = useSelector(({ settings }) => settings)
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const [page, setPage] = useState(0)
  const [visible, setVisible] = useState({})
  const [modules, setModules] = useState([])
  const [filterFeatToggle] = useFeatureToggle('filterFeatToggle')
  const { courseIsSelected } = useCourseFilter()

  useEffect(() => {
    const modules = {}

    courseStatistics.forEach(course => {
      const code = course.label_code
      if (!modules[code]) {
        modules[code] = []
      }
      modules[code].push(course)
    })

    Object.keys(modules).forEach(m => {
      if (modules[m].length === 0) {
        delete modules[m]
      }
    })

    setModules(
      Object.entries(modules)
        .map(([module, courses]) => ({
          module: { code: module, name: courses[0].label_name, order: courses[0].module_order },
          courses
        }))
        .sort((a, b) => a.module.order - b.module.order)
    )
  }, [mandatoryCourses, courseStatistics])

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

  const maxPages = Math.floor(students.length / 10)

  const changePage = direction => {
    const newPage = page + direction
    if (newPage > maxPages) {
      setPage(0)
    } else if (newPage < 0) {
      setPage(maxPages)
    } else {
      setPage(newPage)
    }
  }

  const toggleVisible = code => {
    const newState = !visible[code]
    setVisible({ ...visible, [code]: newState })
  }

  const pagedStudents = students.slice(page * 10, page * 10 + 10)

  return (
    <div>
      <button type="button" onClick={() => changePage(-1)}>
        page-
      </button>
      <button type="button" onClick={() => changePage(1)}>
        page+
      </button>
      <span>
        {page + 1} / {maxPages + 1}
      </span>
      <Table sortable className="fixed-header" striped celled>
        <Table.Header>
          <Table.Row>
            {filterInput('nameFilter', 'populationCourses.name', '3')}
            {filterInput('codeFilter', 'populationCourses.code')}
            {pagedStudents.map(student => (
              <Table.HeaderCell
                className="rotatedTableHeader"
                key={student.studentnumber}
                content={verticalTitle(student.studentnumber)}
              />
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {modules.map(({ module, courses }) => (
            <React.Fragment key={module.code}>
              <Table.Row>
                <Table.Cell style={{ cursor: 'pointer' }} colSpan="3" onClick={() => toggleVisible(module.code)}>
                  <Icon name={visible[module.code] ? 'angle down' : 'angle right'} />
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
              {visible[module.code] &&
                courses
                  .filter(c => c.visible.visibility)
                  .map(col => (
                    <Table.Row key={col.code}>
                      <Popup
                        trigger={
                          <Table.Cell className="filterCell clickableCell">
                            <FilterToggleIcon
                              isActive={filterFeatToggle ? courseIsSelected(col.code) : isActiveCourse(col)}
                              onClick={() => onCourseNameCellClick(col.code)}
                            />
                          </Table.Cell>
                        }
                        content={
                          // This is the best ternary I've ever written :mintu:
                          /* eslint-disable-next-line no-nested-ternary */
                          (filterFeatToggle ? (
                            courseIsSelected(col.code)
                          ) : (
                            isActiveCourse(col)
                          )) ? (
                            <span>
                              Poista rajaus kurssin <b>{getTextIn(col.name, language)}</b> perusteella
                            </span>
                          ) : (
                            <span>
                              Rajaa opiskelijat kurssin <b>{getTextIn(col.name, language)}</b> perusteella
                            </span>
                          )
                        }
                        position="top right"
                      />
                      <Table.Cell className="nameCell" key="name" content={col.name.fi} />
                      <Table.Cell className="iconCell clickableCell">
                        <p>
                          <Item
                            as={Link}
                            to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                              col.code
                            )}"]&separate=false&unifyOpenUniCourses=false`}
                          >
                            <Icon name="level up alternate" onClick={() => onGoToCourseStatisticsClick(col.code)} />
                          </Item>
                        </p>
                      </Table.Cell>
                      <Table.Cell key="code" content={col.code} />
                      {pagedStudents.map(student => (
                        <Table.Cell
                          key={student.studentnumber}
                          content={
                            hasCompleted(col.code, student.studentnumber) ? (
                              <Icon fitted name="check" color="green" />
                            ) : null
                          }
                        />
                      ))}
                    </Table.Row>
                  ))}
            </React.Fragment>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default Students
