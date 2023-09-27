import React, { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Segment, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import SortableTable from 'components/SortableTable'
import { getCourseStats } from '../../../redux/coursestats'

const calculatePassrate = (pass, fail) => (100 * pass) / (pass + fail)

const TeacherStatisticsTable = ({ statistics, onClickFn, getCourseStats, unifyOpenUniCourses, renderLink }) => {
  const fetchCourseStats = useCallback(
    id => getCourseStats({ courseCodes: [id], separate: false, unifyOpenUniCourses }, null),
    [unifyOpenUniCourses]
  )

  const columns = useMemo(
    () => [
      {
        key: 'code-and-link',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'code',
            title: 'Course code',
            getRowVal: row => row.id,
            cellProps: row => ({
              style: { cursor: 'pointer' },
              onClick: () => onClickFn(row.id),
            }),
          },
          {
            key: 'link',
            getRowContent: row => {
              if (!renderLink) return null
              const query = `courseCodes=["${row.id}"]&separate=false&unifyOpenUniCourses=${unifyOpenUniCourses}`
              return (
                <Item as={Link} to={`/coursestatistics?${query}`} onClick={() => fetchCourseStats(row.id)}>
                  <Icon name="level up alternate" />
                </Item>
              )
            },
          },
        ],
      },
      {
        key: 'name',
        title: 'Course name',
        getRowVal: row => row.name,
      },
      {
        key: 'credits',
        title: 'Credits',
        getRowVal: row => row.credits,
        formatValue: value => value.toFixed(2),
      },
      {
        key: 'credits-transferred',
        title: 'Credits Transferred',
        getRowVal: row => row.transferred,
      },
      {
        key: 'passrate',
        title: 'Passed',
        getRowVal: row => parseFloat(row.passrate),
        formatValue: value => value.toFixed(2),
      },
    ],
    [renderLink, unifyOpenUniCourses, fetchCourseStats]
  )

  const data = useMemo(
    () =>
      statistics.map(stat => ({
        ...stat,
        passrate: calculatePassrate(stat.passed, stat.failed),
      })),
    [statistics]
  )

  return statistics.length === 0 ? (
    <Segment basic content="No statistics found for the given query." />
  ) : (
    <>
      <SortableTable title="Teacher statistics" columns={columns} data={data} />
    </>
  )
}

const mapStateToProps = state => {
  const { unifyOpenUniCourses } = state.courseSearch
  return { unifyOpenUniCourses }
}

export default connect(mapStateToProps, { getCourseStats })(TeacherStatisticsTable)
