import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { orderBy } from 'lodash-es'
import { useEffect, useState } from 'react'

import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PassingSemesters } from './PassingSemesters'

const visibleCoursesFilter = (course, mandatoryCourses) =>
  mandatoryCourses?.defaultProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  ) ??
  mandatoryCourses?.secondProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  ) ??
  false

export const PopulationCourseStats = ({ curriculum, filteredCourses, pending, onlyIamRights }) => {
  const [tab, setTab] = useState(0)
  const [modules, setModules] = useState([])

  useEffect(() => {
    const modules = (filteredCourses ?? [])
      .filter(({ course }) => visibleCoursesFilter(course, curriculum))
      // it needs to be with flatMap and filter and not map and find
      // because there can be many mandatoryCourses with the same course code
      // as they can belong to many categories
      .flatMap(course => {
        const defaultProgrammeCourses = curriculum.defaultProgrammeCourses
          .filter(pg => pg.code === course.course.code)
          .map(programmeCourse => ({ ...course, ...programmeCourse }))

        const secondProgrammeCourses = curriculum.secondProgrammeCourses
          .filter(pg => pg.code === course.course.code)
          .map(programmeCourse => ({ ...course, ...programmeCourse }))

        return [defaultProgrammeCourses, secondProgrammeCourses].flat()
      })
      .reduce((modules, course) => {
        modules[course.parent_code] ??= { module: { code: course.parent_code, name: course.parent_name }, courses: [] }
        modules[course.parent_code].courses.push(course)

        return modules
      }, {})

    setModules(
      orderBy(
        Object.values(modules).map(({ module, courses }) => ({
          name: module.name,
          code: module.code,
          courses,
        })),
        item => item.code
      )
    )
  }, [filteredCourses, curriculum])

  const panes = [
    {
      label: 'Pass/fail',
      render: <PassFailEnrollments courseStatistics={modules} onlyIamRights={onlyIamRights} />,
    },
    {
      label: 'Grades',
      render: <GradeDistribution courseStatistics={modules} onlyIamRights={onlyIamRights} />,
    },
    {
      label: 'When passed',
      render: <PassingSemesters courseStatistics={modules} onlyIamRights={onlyIamRights} />,
    },
  ]

  if (!filteredCourses || pending) return null

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render ?? null}
    </>
  )
}
