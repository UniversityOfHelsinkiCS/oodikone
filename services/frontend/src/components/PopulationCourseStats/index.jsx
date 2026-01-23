import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { orderBy } from 'lodash-es'
import { useEffect, useState } from 'react'

import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PassingSemesters } from './PassingSemesters'
import { PopulationCourseContext } from './PopulationCourseContext'

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

    setModules(orderBy(Object.values(modules), item => item.module.code))
  }, [filteredCourses, curriculum])

  const contextValue = {
    modules,
    courseStatistics: filteredCourses,
  }

  const panes = [
    {
      label: 'Pass/fail',
      render: <PassFailEnrollments onlyIamRights={onlyIamRights} useModules />,
    },
    {
      label: 'Grades',
      render: <GradeDistribution onlyIamRights={onlyIamRights} useModules />,
    },
    {
      label: 'When passed',
      render: <PassingSemesters onlyIamRights={onlyIamRights} useModules />,
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
      <PopulationCourseContext.Provider value={contextValue}>
        {panes.at(tab)?.render ?? null}
      </PopulationCourseContext.Provider>
    </>
  )
}
