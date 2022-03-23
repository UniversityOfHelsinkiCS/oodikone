import React, { useMemo } from 'react'
import _ from 'lodash'
import SortableTable, { group } from 'components/SortableTable'
import { Item, Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import CourseFilterToggle from '../CourseFilterToggle'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import { getTextIn } from '../../../common'

const createModuleAggregateRow = ({ definition, children }) => ({
  label_code: definition.module.code,
  label_name: definition.module.name,
  stats: {
    passed: _.chain(children).map('stats.passed').sum().value(),
    retryPassed: _.chain(children).map('stats.retryPassed').sum().value(),
    percentage: _.chain(children).map('stats.percentage').mean().value(),
    failed: _.chain(children).map('stats.failed').sum().value(),
    failedMany: _.chain(children).map('stats.failedMany').sum().value(),
    attempts: _.chain(children).map('stats.attempts').sum().value(),
    perStudent: _.chain(children).map('stats.perStudent').mean().value(),
    passedOfPopulation: _.chain(children).map('stats.passedOfPopulation').mean().value(),
    triedOfPopulation: _.chain(children).map('stats.triedOfPopulation').mean().value(),
  },
})

const PassFail = ({ flat }) => {
  const { modules, courseStatistics, onGoToCourseStatisticsClick } = UsePopulationCourseContext()

  const columns = useMemo(
    () => [
      {
        key: 'course',
        title: 'Course',
        children: [
          {
            key: 'course-name-parent',
            mergeHeader: true,
            merge: true,
            children: [
              {
                key: 'course-name',
                title: 'Name',
                getRowVal: (row, isGroup) => getTextIn(isGroup ? row.label_name : row.name ?? row.course.name),
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
            key: 'course-code',
            title: 'Code',
            getRowVal: (row, isGroup) => (isGroup ? row.label_code : row.code ?? row.course.code),
          },
        ],
      },
      {
        key: 'statistics',
        noHeader: true,
        getRowVal: (_, isGroup) => (isGroup ? ' ' : undefined),
        children: [
          {
            key: 'passed',
            title: 'Passed',
            children: [
              {
                key: 'passed-n',
                title: 'Total',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.passed ?? 0,
              },
              {
                key: 'passed-after-retry',
                title: 'After Retry',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.retryPassed ?? 0,
              },
              {
                key: 'passed-percentage',
                title: 'Passed-%',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.percentage ?? 0,
                formatValue: value =>
                  value &&
                  new Intl.NumberFormat('fi-FI', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(value / 100),
              },
            ],
          },
          {
            key: 'failed',
            title: 'Failed',
            children: [
              {
                key: 'failed-n',
                title: 'Total',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.failed ?? 0,
              },
              {
                key: 'failed-many',
                title: 'Multiple Times',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.failedMany ?? 0,
              },
            ],
          },
          {
            key: 'attempts',
            title: 'Attempts',
            children: [
              {
                key: 'attempts-n',
                title: 'Total',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.attempts,
              },
              {
                key: 'attempts-per-student',
                title: 'per Student',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.perStudent,
                formatValue: value =>
                  new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value),
              },
            ],
          },
          {
            key: 'of-population',
            title: 'Percentage of Population',
            children: [
              {
                key: 'passed-of-population',
                title: 'Passed',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.passedOfPopulation,
                formatValue: value =>
                  new Intl.NumberFormat('fi-FI', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(value / 100),
              },
              {
                key: 'attempted-of-population',
                title: 'Attempted',
                cellStyle: { textAlign: 'right' },
                filterType: 'range',
                getRowVal: row => row.stats?.triedOfPopulation,
                formatValue: value =>
                  new Intl.NumberFormat('fi-FI', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(value / 100),
              },
            ],
          },
        ],
      },
    ],
    [onGoToCourseStatisticsClick]
  )

  const data = useMemo(() => {
    if (flat) {
      return courseStatistics.map(course => ({ ...course, code: course.course.code, name: course.course.name }))
    }

    return _.chain(modules)
      .map(({ module, courses }) =>
        group(
          {
            key: `module-${module.code}`,
            module,
            headerRowData: createModuleAggregateRow,
            columnOverrides: {},
          },
          courses
        )
      )
      .value()
  }, [modules])

  return (
    <>
      <SortableTable title="Pass and fail statistics of courses" data={data} columns={columns} />
    </>
  )
}

export default PassFail
