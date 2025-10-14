import ArrowIcon from '@mui/icons-material/NorthEast'
import { useMemo } from 'react'
import { Segment } from 'semantic-ui-react'

import { calculatePercentage, isDefaultServiceProvider } from '@/common'
import { Link } from '@/components/material/Link'
import { SortableTable } from '@/components/SortableTable'

const createColumnWithTitle = title => ({
  key: title,
  title: title[0].toUpperCase() + title.slice(1),
  getRowVal: row => row.name,
})

export const TeacherStatisticsTable = ({ statistics, variant }) => {
  const columns = [
    {
      key: 'credits',
      title: 'Credits',
      getRowVal: row => row.credits,
    },
    {
      key: 'credits-transferred',
      title: 'Credits transferred',
      getRowVal: row => row.transferred,
    },
    {
      key: 'passrate',
      title: 'Passed',
      getRowVal: row => row.passrate,
    },
  ]

  switch (variant) {
    case 'leaderboard':
      columns.unshift({
        key: 'name',
        title: 'Name',
        getRowVal: row => row.name,
        getRowContent: row => (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
            {row.name}
            {isDefaultServiceProvider() && (
              <Link target="_blank" to={`/teachers/${row.id}`}>
                <ArrowIcon />
              </Link>
            )}
          </div>
        ),
      })
      break
    case 'course':
      columns.unshift(createColumnWithTitle('course name'))
      columns.unshift({
        key: 'code',
        title: 'Course code',
        getRowVal: row => row.id,
        formatValue: code => (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
            {code}
            <Link
              target="_blank"
              to={`/coursestatistics?combineSubstitutions=true&courseCodes=["${code}"]&separate=false`}
            >
              <ArrowIcon />
            </Link>
          </div>
        ),
      })
      break
    case 'semester':
      columns.unshift(createColumnWithTitle('semester'))
      break
    case 'year':
      columns.unshift(createColumnWithTitle('year'))
      break
    default:
      break
  }

  const data = useMemo(
    () =>
      statistics.map(stat => ({
        ...stat,
        passrate: calculatePercentage(stat.passed, stat.passed + stat.failed),
      })),
    [statistics]
  )

  return statistics.length === 0 ? (
    <Segment basic content="No statistics found for the given query." />
  ) : (
    <SortableTable
      columns={columns}
      data={data}
      defaultSort={variant === 'leaderboard' ? ['credits', 'desc'] : ['name', 'asc']}
      featureName="teacher_statistics"
      title="Teacher statistics"
    />
  )
}
