import React, { useState, useMemo, useCallback } from 'react'
import { Icon, Button, Item, Pagination } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import * as _ from 'lodash-es'

import { SortableTable, group } from 'components/SortableTable'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import { CourseFilterToggle } from '../CourseFilterToggle'
import { useStudentNameVisibility } from '../../StudentNameVisibilityToggle'

export const Students = ({ filteredStudents }) => {
  const { courseStatistics, onGoToCourseStatisticsClick, modules, toggleGroupExpansion, expandedGroups } =
    UsePopulationCourseContext()
  const { visible: namesVisible, toggle: toggleStudentNames } = useStudentNameVisibility()
  const [page, setPage] = useState(0)
  const { getTextIn } = useLanguage()

  const hasCompleted = useCallback(
    (courseCode, student) => {
      const course = courseStatistics.find(c => c.course.code === courseCode)
      if (!course) return false

      return Boolean(course.students.passed[student])
    },
    [courseStatistics]
  )

  const countCompleted = useCallback(
    (courses, student) => {
      let completed = 0
      courses.forEach(course => {
        if (hasCompleted(course.code, student)) {
          completed++
        }
      })

      return completed
    },
    [hasCompleted]
  )

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

  const data = useMemo(() => {
    return _.chain(modules)
      .map(({ module, courses }) =>
        group(
          {
            key: `module-${module.code}`,
            headerRowData: {
              name: module.name,
              code: module.code,
              courses,
            },
          },
          courses
        )
      )
      .value()
  }, [modules])

  const columns = useMemo(
    () => [
      {
        key: 'course',
        title: 'Course',
        children: [
          {
            key: 'title-parent',
            mergeHeader: 'title',
            merge: true,
            children: [
              {
                key: 'title',
                title: 'Name',
                getRowVal: row => getTextIn(row.name),
              },
              {
                key: 'filter-toggle',
                export: false,
                getRowContent: (row, isGroup) => {
                  if (isGroup) return null

                  return <CourseFilterToggle course={row} />
                },
              },
              {
                key: 'go-to-course',
                export: false,
                getRowContent: (row, isGroup) =>
                  !isGroup && (
                    <Item
                      as={Link}
                      to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                        row.code
                      )}"]&separate=false&unifyOpenUniCourses=false`}
                    >
                      <Icon name="level up alternate" onClick={() => onGoToCourseStatisticsClick(row.code)} />
                    </Item>
                  ),
              },
            ],
          },
          {
            key: 'code',
            title: 'Code',
            getRowVal: row => row.code,
          },
        ],
      },
      {
        key: 'students',
        title: 'Students',
        children: pagedStudents.map(student => ({
          key: `student-${student.studentnumber}`,
          title: `${namesVisible ? student.name : student.studentnumber}`,
          vertical: true,
          getRowVal: (row, isGroup) =>
            isGroup
              ? countCompleted(row.courses, student.studentnumber)
              : hasCompleted(row.code, student.studentnumber),
          getRowContent: (row, isGroup) =>
            isGroup
              ? countCompleted(row.courses, student.studentnumber)
              : hasCompleted(row.code, student.studentnumber) && <Icon fitted name="check" color="green" />,
          formatValue: value => (value ? 'Passed' : 'Not passed'),
        })),
      },
    ],
    [modules, pagedStudents]
  )

  return (
    <div>
      <SortableTable
        title={
          <>
            Courses passed by students
            <Pagination
              style={{ marginLeft: '1em' }}
              size="mini"
              secondary
              activePage={page + 1}
              totalPages={maxPages + 1}
              onPageChange={(e, { activePage }) => setPage(activePage - 1)}
              ellipsisItem={null}
              firstItem={null}
              lastItem={null}
            />
          </>
        }
        featureName="courses_passed"
        actions={
          <Button size="tiny" onClick={() => toggleStudentNames()}>
            {namesVisible ? 'Hide student names' : 'Show student names'}
          </Button>
        }
        columns={columns}
        data={data}
        toggleGroupExpansion={toggleGroupExpansion}
        expandedGroups={expandedGroups}
      />
    </div>
  )
}
