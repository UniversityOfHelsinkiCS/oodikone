import React, { useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import moment from 'moment'

const PopulationStatisticsLink = ({ studytrack, studyprogramme, year: yearLabel }) => {
  const year = Number(yearLabel.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
  const href = studytrack
    ? `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${year}`
    : `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
  return (
    <Link title={`Population statistics of class ${yearLabel}`} to={href}>
      <Icon name="level up alternate" />
    </Link>
  )
}

const getKey = year => `${year}-${Math.random()}`

const getFirstCell = (yearlyData, year, show, studytrack, studyprogramme) => {
  if (yearlyData.length === 1 || studytrack) {
    return (
      <Table.Cell key={getKey(year)}>
        {year}
        <PopulationStatisticsLink studyprogramme={studyprogramme} studytrack={studytrack} year={year} />
      </Table.Cell>
    )
  }
  return (
    <Table.Cell key={getKey(year)}>
      <Icon name={`${show ? 'angle down' : 'angle right'}`} />
      {year}
      <PopulationStatisticsLink studyprogramme={studyprogramme} year={year} />
    </Table.Cell>
  )
}

const getRow = ({ yearlyData, array, show, setShow, studytrack, studyprogramme }) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]

  if (array[0].includes('20') && !studytrack) {
    return (
      <Table.Row key={getKey(array[0])} className="header-row" onClick={() => setShow(!show)}>
        {array.map((value, index) =>
          index === 0 ? (
            getFirstCell(yearlyData, array[0], show, studytrack, studyprogramme)
          ) : (
            <Table.Cell textAlign="left">{value}</Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  if (show || studytrack) {
    return (
      <Table.Row key={getKey(array[0])} className="regular-row">
        {array.map((value, index) =>
          index === 0 && !studytrack ? (
            <Table.Cell textAlign="left" style={{ paddingLeft: '50px' }} key={getKey(array[0])}>
              {value}
              <PopulationStatisticsLink studyprogramme={studyprogramme} studytrack={studytrack} year={year} />
            </Table.Cell>
          ) : (
            <Table.Cell textAlign="left" key={getKey(array[0])}>
              {value}
            </Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  return null
}

const StudytrackDataTable = ({ studyprogramme, dataOfAllTracks, studytrack, dataOfSingleTrack, titles }) => {
  const [show, setShow] = useState(false)

  if (!dataOfAllTracks && !dataOfSingleTrack) return null

  const sortedMainStats = []
  Object.values(dataOfAllTracks).forEach(arrays => {
    if (arrays.length) {
      const copy = [...arrays]
      const sortedYear = copy.sort((a, b) => {
        if (a[0] < b[0]) return 1
        if (a[0] > b[0]) return -1
        return 0
      })
      sortedMainStats.push(sortedYear.reverse())
    }
  })

  sortedMainStats.reverse()

  return (
    <div className="datatable">
      <Table celled>
        <Table.Header>
          <Table.Row>
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 ? 1 : 2}
                textAlign="left"
                style={{ fontWeight: 'bold' }}
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {studytrack
            ? dataOfSingleTrack.map(array =>
                getRow({ yearlyData: dataOfSingleTrack, array, show, setShow, studyprogramme, studytrack })
              )
            : sortedMainStats?.map(yearlyData =>
                yearlyData.map(array => getRow({ yearlyData, array, show, setShow, studyprogramme, studytrack }))
              )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable
