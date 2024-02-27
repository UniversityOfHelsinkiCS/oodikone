import _ from 'lodash'
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Item, Icon, Button } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable, group } from '@/components/SortableTable'
import { CourseFilterToggle } from '../CourseFilterToggle'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const semesterColumn = (year, semester, cumulative) => ({
  key: `semester-${year}-${semester}`,
  cellProps: { style: { textAlign: 'right' } },
  filterType: 'range',
  title: semester,
  getRowVal: row =>
    ((cumulative ? row?.stats?.passingSemestersCumulative : row?.stats?.passingSemesters) ?? {})[
      `${year}-${semester.toUpperCase()}`
    ],
  getRowContent: row => {
    const value = ((cumulative ? row?.stats?.passingSemestersCumulative : row?.stats?.passingSemesters) ?? {})[
      `${year}-${semester.toUpperCase()}`
    ]

    if (value === 0) {
      return null
    }
    return value
  },
})

const yearColumn = (year, cumulative) => ({
  key: `year-${year}`,
  title: `${year + 1}${['st', 'nd', 'rd'][year] ?? 'th'} year`,
  children: [semesterColumn(year, 'Fall', cumulative), semesterColumn(year, 'Spring', cumulative)],
})

export const PassingSemesters = ({ onlyIamRights }) => {
  const { modules, onGoToCourseStatisticsClick, toggleGroupExpansion, expandedGroups } = UsePopulationCourseContext()
  const [cumulativeStats, setCumulativeStats] = useState(false)
  const { getTextIn } = useLanguage()

  const columns = useMemo(() => {
    const columns = [
      {
        key: 'course-name',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'name',
            title: 'Name',
            getRowVal: (row, isGroup, parents) => getTextIn(isGroup ? parents[0].module.name : row.name),
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
        getRowVal: (row, isGroup, parents) => (isGroup ? parents[0].module.code : row.code),
      },
      {
        key: 'stats',
        noHeader: true,
        getRowVal: (__, isGroup) => (isGroup ? ' ' : null),
        children: [
          {
            key: 'students',
            title: 'Students',
            filterType: 'range',
            getRowVal: row => row.stats?.students,
            cellProps: { style: { textAlign: 'right' } },
          },
          {
            key: 'passed',
            title: 'Passed',
            filterType: 'range',
            getRowVal: row => row.stats?.passed,
            cellProps: { style: { textAlign: 'right' } },
          },
          {
            key: 'passed-before',
            title: 'Before 1st year',
            filterType: 'range',
            getRowVal: row =>
              (cumulativeStats ? row.stats?.passingSemesters : row.stats?.passingSemestersCumulative)?.BEFORE,
            cellProps: { style: { textAlign: 'right' } },
          },
          ..._.range(0, 6).map(i => yearColumn(i, cumulativeStats)),
        ],
      },
    ]

    if (onlyIamRights) columns[0].children.pop()

    return columns
  }, [cumulativeStats, onGoToCourseStatisticsClick])

  const data = useMemo(
    () =>
      _.chain(modules)
        .map(({ module, courses }) =>
          group(
            {
              key: `module-${module.code}`,
              module,
              headerRowData: {},
              columnOverrides: {},
            },
            courses
          )
        )
        .value(),
    [modules]
  )

  return (
    <div>
      <SortableTable
        title="Students Passing a Course per Semester"
        featureName="passing_semester"
        actions={
          <Button size="mini" style={{ padding: '.75em .75em' }} onClick={() => setCumulativeStats(!cumulativeStats)}>
            {cumulativeStats ? 'Show yearly stats' : 'Show cumulative stats'}
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
