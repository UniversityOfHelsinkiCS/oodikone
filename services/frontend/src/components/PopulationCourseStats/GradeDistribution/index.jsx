import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Item } from 'semantic-ui-react'
import { SortableTable, group } from 'components/SortableTable'
import * as _ from 'lodash-es'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { CourseFilterToggle } from '../CourseFilterToggle'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const mapCourseData = course => ({
  name: course.course.name,
  code: course.course.code,
  attempts: _.chain(course.grades).values().map('count').sum().value(),
  otherPassed: _.chain(course.grades)
    .omit(_.range(0, 6))
    .filter(g => g.status.passingGrade || g.status.improvedGrade)
    .map('count')
    .sum()
    .value(),
  grades: {
    ...course.grades,
    0: {
      count: _.chain(course.grades)
        .filter(g => g.status.failingGrade)
        .map('count')
        .sum()
        .value(),
    },
  },
})

export const GradeDistribution = ({ flat, onlyIamRights }) => {
  const { modules, courseStatistics, onGoToCourseStatisticsClick, toggleGroupExpansion, expandedGroups } =
    UsePopulationCourseContext()
  const { getTextIn } = useLanguage()

  const columns = useMemo(() => {
    const columns = [
      {
        key: 'name-parent',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'name',
            title: 'Name',
            getRowVal: row => getTextIn(row.name),
            cellProps: {
              style: {
                maxWidth: '20em',
                whiteSpace: 'normal',
                overflow: 'hidden',
              },
            },
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
      {
        key: 'stats',
        noHeader: true,
        getRowVal: (__, isGroup) => (isGroup ? ' ' : null),
        children: [
          {
            key: 'attempts',
            title: 'Attempts',
            cellProps: { style: { textAlign: 'right' } },
            filterType: 'range',
            getRowVal: row => row.attempts,
          },
          ..._.range(0, 6).map(grade => ({
            key: `grade-${grade}`,
            title: `${grade}`,
            cellProps: { style: { textAlign: 'right' } },
            filterType: 'range',
            getRowVal: row => row.grades?.[grade]?.count ?? 0,
          })),
          {
            key: 'other-passed',
            title: 'Other Passed',
            cellProps: { style: { textAlign: 'right' } },
            filterType: 'range',
            getRowVal: row => row.otherPassed,
          },
        ],
      },
    ]

    if (onlyIamRights) columns[0].children.pop()

    return columns
  }, [onGoToCourseStatisticsClick])

  const data = useMemo(() => {
    if (flat) {
      return courseStatistics.map(mapCourseData)
    }

    return modules.map(({ module, courses }) =>
      group(
        {
          key: `module-${module.code}`,
          module,
          headerRowData: ({ definition: { module }, children }) => ({
            name: module.name,
            code: module.code,
            attempts: _.chain(children).map('attempts').sum().value(),
            otherPassed: _.chain(children).map('otherPassed').sum().value(),
            grades: _.range(0, 6).map(grade => ({
              count: _.chain(children)
                .map(course => course.grades[grade]?.count ?? 0)
                .sum()
                .value(),
            })),
          }),
        },
        courses.map(mapCourseData)
      )
    )
  }, [modules])

  return (
    <SortableTable
      title="Grade distribution of courses"
      featureName="grade_distribution"
      data={data}
      columns={columns}
      toggleGroupExpansion={toggleGroupExpansion}
      expandedGroups={expandedGroups}
    />
  )
}
