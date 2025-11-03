import ArrowIcon from '@mui/icons-material/NorthEast'
import { useMemo } from 'react'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Link } from '@/components/material/Link'

import { SortableTable, group } from '@/components/SortableTable'
import { CourseFilterToggle } from '../CourseFilterToggle'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const calculatePassRate = (total, passed) => {
  if (total === 0) {
    return 0
  }
  return (100 * passed) / total
}

export const PassFailEnrollments = ({ flat, onlyIamRights }) => {
  const { modules, courseStatistics, toggleGroupExpansion, expandedGroups } = UsePopulationCourseContext()
  const { getTextIn } = useLanguage()

  const columns = useMemo(() => {
    const columns = [
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
                getRowVal: row => getTextIn(row.name ?? row.course.name),
                cellProps: {
                  style: { maxWidth: '20em', whiteSpace: 'normal' },
                },
              },
              {
                key: 'filter-toggle',
                export: false,
                getRowContent: (row, isGroup) =>
                  !isGroup && <CourseFilterToggle courseCode={row.code} courseName={row.name} />,
              },
              {
                key: 'go-to-course',
                export: false,
                getRowContent: (row, isGroup) =>
                  !isGroup && (
                    <Link
                      to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                        row.code
                      )}"]&separate=false&unifyOpenUniCourses=false`}
                    >
                      <ArrowIcon />
                    </Link>
                  ),
              },
            ],
          },
          {
            key: 'course-code',
            title: 'Code',
            getRowVal: row => row.code ?? row.course.code,
            cellProps: { style: { textAlign: 'left' } },
          },
        ],
      },
      {
        key: 'statistics',
        noHeader: true,
        getRowVal: (_, isGroup) => (isGroup ? ' ' : undefined),
        children: [
          {
            key: 'total',
            title: 'Total\nstudents',
            filterType: 'range',
            getRowVal: row => row.stats?.totalStudents ?? 0,
          },
          {
            key: 'passed-total',
            title: 'Passed',
            filterType: 'range',
            getRowVal: row => row.stats?.passed ?? 0,
          },
          {
            key: 'failed-total',
            title: 'Failed',
            filterType: 'range',
            getRowVal: row => row.stats?.failed ?? 0,
          },
          {
            key: 'totalEnrolledNoGrade',
            title: 'Enrolled, \nno grade',
            filterType: 'range',
            getRowVal: row => row.stats?.totalEnrolledNoGrade ?? 0,
          },
          {
            key: 'pass-rate',
            title: 'Pass rate',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: row => calculatePassRate(row.stats?.totalStudents, row.stats?.passed),
            formatValue: value =>
              value &&
              new Intl.NumberFormat('fi-FI', {
                style: 'percent',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(value / 100),
          },
          {
            key: 'attempts',
            title: 'Attempts',
            children: [
              {
                key: 'attempts-n',
                title: 'Total',
                filterType: 'range',
                getRowVal: row => row.stats?.attempts,
              },
              {
                key: 'attempts-per-student',
                title: 'Per student',
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
            title: 'Percentage of population',
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
    ]
    if (onlyIamRights) {
      columns[0].children[0].children.pop()
    }
    return columns
  }, [courseStatistics])

  const data = useMemo(() => {
    if (flat) {
      return courseStatistics.map(course => ({ ...course, code: course.course.code, name: course.course.name }))
    }

    return modules.map(({ module, courses }) =>
      group(
        {
          key: `module-${module.code}`,
          module,
          headerRowData: { code: module.code, name: module.name },
        },
        courses
      )
    )
  }, [modules, courseStatistics])

  return (
    <SortableTable
      columns={columns}
      data={data}
      defaultSort={['total', 'desc']}
      expandedGroups={expandedGroups}
      featureName="pass_and_fail"
      title="Pass and fail statistics of courses with course enrollment details"
      toggleGroupExpansion={toggleGroupExpansion}
    />
  )
}
