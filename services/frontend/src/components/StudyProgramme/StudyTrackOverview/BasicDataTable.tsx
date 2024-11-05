import { Table } from 'semantic-ui-react'

interface BasicDataTableProps {
  data: Record<string, Array<Array<string | number>>>
  titles: string[]
  track: string
}

export const BasicDataTable = ({ data, titles, track }: BasicDataTableProps) => {
  if (!data || !data[track]?.length || !titles) {
    return null
  }

  const sortedData = data[track].toSorted((a, b) => {
    if (a[0] === 'Total') return 1
    if (b[0] === 'Total') return -1
    return parseInt(String(b[0]).split(' - ')[0], 10) - parseInt(String(a[0]).split(' - ')[0], 10)
  })

  return (
    <Table celled compact data-cy="Table-StudyTrackProgress">
      <Table.Header>
        <Table.Row>
          {titles?.map(title => (
            <Table.HeaderCell key={title} textAlign="center">
              {title}
            </Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedData.map(row => (
          <Table.Row key={row[0]}>
            {row.map((value, index) => (
              <Table.Cell
                className={row[0] === 'Total' ? 'total-row-cell' : ''}
                // eslint-disable-next-line react/no-array-index-key
                key={`${index}-${value}`}
                textAlign={index === 0 ? 'center' : 'right'}
              >
                {value}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
