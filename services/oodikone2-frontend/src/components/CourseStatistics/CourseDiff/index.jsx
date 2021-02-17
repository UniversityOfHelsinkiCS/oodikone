import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { string, arrayOf, number, shape } from 'prop-types'
import { Statistic, Table, Accordion } from 'semantic-ui-react'

const DiffStatistics = ({ totalMissing, totalExtra }) => (
  <Statistic.Group>
    <Statistic>
      <Statistic.Value>{totalMissing}</Statistic.Value>
      <Statistic.Label>Credits missing in SIS</Statistic.Label>
    </Statistic>
    <Statistic>
      <Statistic.Value>{totalExtra}</Statistic.Value>
      <Statistic.Label>Extra credits in SIS</Statistic.Label>
    </Statistic>
  </Statistic.Group>
)

const CreditDiffTable = ({ title, color, students }) => (
  <Table celled collapsing compact color={color} attached="top">
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="2">{title}</Table.HeaderCell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell>Studentnumber</Table.HeaderCell>
        <Table.HeaderCell>Study year</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {students.map(missing => (
        <Table.Row key={`${missing.studentnumber}-${missing.year}`}>
          <Table.Cell>{missing.studentnumber}</Table.Cell>
          <Table.Cell>{missing.year}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
)

const CourseDiffTable = ({ data }) => (
  <Table>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Course</Table.HeaderCell>
        <Table.HeaderCell>Missing</Table.HeaderCell>
        <Table.HeaderCell>Extra</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Accordion
      as={Table.Body}
      panels={data.map(({ coursecode, missingStudents, extraStudents }) => {
        return {
          key: coursecode,
          class: 'tr',
          title: {
            as: Table.Row,
            key: coursecode,
            children: [
              <>
                <Table.Cell>
                  <b>{coursecode}</b>
                </Table.Cell>
                <Table.Cell collapsing>{missingStudents.length}</Table.Cell>
                <Table.Cell collapsing>{extraStudents.length}</Table.Cell>
              </>
            ]
          },
          content: {
            children: (
              <>
                <CreditDiffTable title="Missing credits" color="red" students={missingStudents} />
                <CreditDiffTable title="Extra credits" color="green" students={extraStudents} />
              </>
            )
          }
        }
      })}
    />
  </Table>
)

const CourseDiff = () => {
  const data = useSelector(state => state.oodiSisDiff.data)

  const totalMissing = useMemo(() => {
    return data && data.reduce((sum, course) => sum + course.missingStudents.length, 0)
  }, [data])

  const totalExtra = useMemo(() => {
    return data && data.reduce((sum, course) => sum + course.extraStudents.length, 0)
  }, [data])

  if (!data) return null

  return (
    <div>
      <DiffStatistics totalMissing={totalMissing} totalExtra={totalExtra} />
      <CourseDiffTable data={data} />
    </div>
  )
}

CourseDiffTable.propTypes = {
  data: arrayOf(shape({})).isRequired
}

CreditDiffTable.propTypes = {
  title: string.isRequired,
  color: string.isRequired,
  students: arrayOf(shape({})).isRequired
}

DiffStatistics.propTypes = {
  totalMissing: number.isRequired,
  totalExtra: number.isRequired
}

export default CourseDiff
