import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'
import { Tab } from 'semantic-ui-react'

import { useTabChangeAnalytics } from '@/hooks/tabChangeAnalytics'
import { clearCourseStats } from '@/redux/courseStats'
import { useAppDispatch } from '@/redux/hooks'
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
  const dispatch = useAppDispatch()
  const [modules, setModules] = useState([])
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const { handleTabChange } = useTabChangeAnalytics()

  useEffect(() => {
    const modules = {}

    const programmeCourses =
      filteredCourses && curriculum
        ? filteredCourses
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
        : []

    programmeCourses.forEach(course => {
      modules[course.parent_code] ??= {
        module: { code: course.parent_code, name: course.parent_name },
        courses: [],
      }
      modules[course.parent_code].courses.push(course)
    })

    Object.keys(modules).forEach(module => {
      if (modules[module].courses.length === 0) {
        delete modules[module]
      }
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

  const onGoToCourseStatisticsClick = () => {
    dispatch(clearCourseStats())
  }

  const toggleGroupExpansion = (code, close = false, all = null) => {
    if (all) {
      setExpandedGroups(new Set(all))
    } else if (close) {
      setExpandedGroups(new Set())
    } else {
      const newExpandedGroups = new Set(expandedGroups)
      if (newExpandedGroups.has(code)) {
        newExpandedGroups.delete(code)
      } else {
        newExpandedGroups.add(code)
      }
      setExpandedGroups(newExpandedGroups)
    }
  }

  const contextValue = {
    modules,
    courseStatistics: filteredCourses,
    onGoToCourseStatisticsClick,
    toggleGroupExpansion,
    expandedGroups,
  }

  const panes = [
    {
      menuItem: 'Pass/fail',
      render: () => (
        <Tab.Pane>
          <PassFailEnrollments onlyIamRights={onlyIamRights} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Grades',
      render: () => (
        <Tab.Pane>
          <GradeDistribution onlyIamRights={onlyIamRights} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'When passed',
      render: () => (
        <Tab.Pane>
          <PassingSemesters onlyIamRights={onlyIamRights} />
        </Tab.Pane>
      ),
    },
  ]

  if (!filteredCourses || pending) {
    return null
  }

  return (
    <div>
      <PopulationCourseContext.Provider value={contextValue}>
        <Tab onTabChange={handleTabChange} panes={panes} />
      </PopulationCourseContext.Provider>
    </div>
  )
}
