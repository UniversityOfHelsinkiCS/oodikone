import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import { Tab } from 'semantic-ui-react'

import { useTabChangeAnalytics } from '@/common/hooks'
import { clearCourseStats } from '@/redux/coursestats'
import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PassingSemesters } from './PassingSemesters'
import { PopulationCourseContext } from './PopulationCourseContext'
import { Students } from './Students'

const visibleCoursesFilter = ({ course }, mandatoryCourses) =>
  mandatoryCourses.defaultProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  ) ||
  mandatoryCourses.secondProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  )

const PopulationCourseStats = ({ filteredStudents, mandatoryCourses, courses, pending, onlyIamRights }) => {
  const dispatch = useDispatch()
  const [modules, setModules] = useState([])
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const { handleTabChange } = useTabChangeAnalytics()

  useEffect(() => {
    const coursestatistics = courses.coursestatistics ?? []

    const filteredCourses =
      coursestatistics && mandatoryCourses
        ? coursestatistics
            .filter(course => visibleCoursesFilter(course, mandatoryCourses))
            // it needs to be with flatMap and filter and not map and find
            // because there can be many mandatoryCourses with the same course code
            // as they can belong to many categories
            .flatMap(course => {
              const defaultProgrammeCourses = mandatoryCourses.defaultProgrammeCourses.filter(
                mandatoryCourse => mandatoryCourse.code === course.course.code
              )
              const secondProgrammeCourses = mandatoryCourses.secondProgrammeCourses.filter(
                mandatoryCourse => mandatoryCourse.code === course.course.code
              )
              return [
                ...defaultProgrammeCourses.map(programmeCourse => ({ ...course, ...programmeCourse })),
                ...secondProgrammeCourses.map(programmeCourse => ({ ...course, ...programmeCourse })),
              ]
            })
        : []

    const modules = {}

    filteredCourses?.forEach(course => {
      if (!modules[course.parent_code]) {
        modules[course.parent_code] = {
          module: { code: course.parent_code, name: course.parent_name },
          courses: [],
        }
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
  }, [courses.coursestatistics, mandatoryCourses])

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
    courseStatistics: courses.coursestatistics,
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
    {
      menuItem: 'Students',
      hideIfOnlyIamRights: true,
      render: () => (
        <Tab.Pane>
          <Students filteredStudents={filteredStudents} />
        </Tab.Pane>
      ),
    },
  ].filter(pane => !(pane.hideIfOnlyIamRights && onlyIamRights))

  if (!courses || pending) {
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

export const ConnectedPopulationCourseStats = connect(null, { clearCourseStats })(PopulationCourseStats)
