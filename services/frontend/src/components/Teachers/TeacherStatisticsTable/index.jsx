import React, { useMemo } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { Segment, Icon, Item } from 'semantic-ui-react'

import { calculatePercentage } from '@/common'
import { SortableTable } from '@/components/SortableTable'

const createColumnWithTitle = title => ({
  key: title,
  title: title[0].toUpperCase() + title.slice(1),
  getRowVal: row => row.name,
})

export const TeacherStatisticsTable = ({ statistics, variant }) => {
  const history = useHistory()

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
        key: 'name-and-link',
        mergeHeader: true,
        merge: true,
        children: [
          createColumnWithTitle('name'),
          {
            key: 'link',
            getRowContent: row => (
              <Item as={Link} onClick={() => history.push(`/teachers/${row.id}`)} to={`/teachers/${row.id}`}>
                <Icon name="level up alternate" />
              </Item>
            ),
          },
        ],
      })
      break
    case 'course':
      columns.unshift(createColumnWithTitle('course name'))
      columns.unshift({
        key: 'code-and-link',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'code',
            title: 'Course code',
            getRowVal: row => row.id,
          },
          {
            key: 'link',
            getRowContent: row => (
              <Item
                as={Link}
                to={`/coursestatistics?combineSubstitutions=true&courseCodes=["${row.id}"]&separate=false`}
              >
                <Icon name="level up alternate" />
              </Item>
            ),
          },
        ],
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
    <SortableTable columns={columns} data={data} featureName="teacher_statistics" title="Teacher statistics" />
  )
}
