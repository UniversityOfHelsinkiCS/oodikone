import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'

import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PassingSemesters } from './PassingSemesters'
import { PopulationCourseContext } from './PopulationCourseContext'

const visibleCoursesFilter = ({ course }, mandatoryCourses) =>
  mandatoryCourses.defaultProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  ) ??
  mandatoryCourses.secondProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  )

export const PopulationCourseStats = ({ curriculum, filteredCourses, pending, onlyIamRights }) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [modules, setModules] = useState([])

  const [tab, setTab] = useState(0)

  useEffect(() => {
    const modules = {}

    if (filteredCourses && curriculum)
      filteredCourses
        .filter(course => visibleCoursesFilter(course, curriculum))
        // it needs to be with flatMap and filter and not map and find
        // because there can be many mandatoryCourses with the same course code
        // as they can belong to many categories
        .flatMap(course => {
          const defaultProgrammeCourses = curriculum.defaultProgrammeCourses.filter(
            mandatoryCourse => mandatoryCourse.code === course.course.code
          )
          const secondProgrammeCourses = curriculum.secondProgrammeCourses.filter(
            mandatoryCourse => mandatoryCourse.code === course.course.code
          )
          return [
            ...defaultProgrammeCourses.map(programmeCourse => ({ ...course, ...programmeCourse })),
            ...secondProgrammeCourses.map(programmeCourse => ({ ...course, ...programmeCourse })),
          ]
        })
        .forEach(course => {
          modules[course.parent_code] ??= {
            module: { code: course.parent_code, name: course.parent_name },
            courses: [],
          }
          modules[course.parent_code].courses.push(course)
        })

    setModules(
      orderBy(
        Object.entries(modules).map(([, { module, courses }]) => ({
          module,
          courses,
        })),
        item => item.module.code
      )
    )
  }, [filteredCourses, curriculum])

  const toggleGroupExpansion = (code, close = false, all = null) => {
    if (all) {
      setExpandedGroups(new Set(all))
    } else if (close) {
      setExpandedGroups(new Set())
    } else {
      const newExpandedGroups = new Set(expandedGroups)
      if (!newExpandedGroups.delete(code)) newExpandedGroups.add(code)

      setExpandedGroups(newExpandedGroups)
    }
  }

  const contextValue = {
    modules,
    courseStatistics: filteredCourses,
    toggleGroupExpansion,
    expandedGroups,
  }

  const panes = [
    {
      label: 'Pass/fail',
      render: () => <PassFailEnrollments onlyIamRights={onlyIamRights} />,
    },
    {
      label: 'Grades',
      render: () => <GradeDistribution onlyIamRights={onlyIamRights} />,
    },
    {
      label: 'When passed',
      render: () => <PassingSemesters onlyIamRights={onlyIamRights} />,
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
        {panes.at(tab)?.render() ?? null}
      </PopulationCourseContext.Provider>
    </>
  )
}
