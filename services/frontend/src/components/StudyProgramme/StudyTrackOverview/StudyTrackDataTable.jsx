import { useState } from 'react'
import { Icon, Popup, Table } from 'semantic-ui-react'

import { getCalendarYears } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { PopulationLink } from './PopulationLink'

const shouldBeHidden = (showPercentages, value) => !showPercentages && typeof value === 'string' && value.includes('%')

const getCellClass = value => (value === 'Total' ? 'total-row-cell' : '')

const getSpanValue = (combinedProgramme, index, showPercentages) => {
  if (combinedProgramme && showPercentages) return index + 2
  if (combinedProgramme) return index + 1
  return index
}

const getStyleForBasic = index => {
  if ([4, 12].includes(index)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 5, 8, 9, 12, 13, 16, 17, 20, 21].includes(index)) return { backgroundColor: '#f9f9f9' }
  if (index === 18) return { borderLeftWidth: 'thick' }
  return {}
}

const getStyleForCombined = index => {
  if ([4, 20].includes(index)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 5, 8, 9, 12, 13, 16, 17, 21].includes(index)) return { backgroundColor: '#f9f9f9' }
  if ([14].includes(index)) return { borderLeftWidth: 'thick' }
  return {}
}

const createCountriesContent = ({ otherCountriesStats, studyProgramme, year }) => {
  const countriesData = otherCountriesStats?.[studyProgramme]?.[year]

  if (!countriesData || Object.keys(countriesData).length === 0) {
    return null
  }

  return Object.keys(countriesData)
    .sort()
    .map(country => (
      <div key={country}>
        {country}: <b>{countriesData[country]}</b>
      </div>
    ))
}

const getBasicTableCell = ({ combinedProgramme, index, row, value }) => (
  <Table.Cell
    className={getCellClass(row[0])}
    key={`${index}-${value}`}
    style={combinedProgramme ? getStyleForCombined(index) : getStyleForBasic(index)}
    textAlign="right"
  >
    {value}
  </Table.Cell>
)

const getOtherCountriesCell = ({ combinedProgramme, index, otherCountriesStats, row, studyProgramme, value, year }) => {
  const countriesPopupContent = createCountriesContent({ otherCountriesStats, studyProgramme, year })
  const tableCell = getBasicTableCell({ combinedProgramme, index, row, value })
  if (!countriesPopupContent) {
    return tableCell
  }
  return <Popup content={countriesPopupContent} key={`${studyProgramme}-${year}`} trigger={tableCell} />
}

const getFirstCell = ({
  allRights,
  calendarYears,
  combinedProgramme,
  fullAccessToStudentData,
  setShow,
  show,
  studyProgramme,
  year,
  yearlyData,
}) => (
  <Table.Cell className={getCellClass(year)} key={year} onClick={setShow}>
    {yearlyData.length > 1 && <Icon name={`${show ? 'angle down' : 'angle right'}`} />}
    {year}
    {(fullAccessToStudentData || allRights.includes(studyProgramme) || allRights.includes(combinedProgramme)) && (
      <PopulationLink
        combinedProgramme={combinedProgramme}
        studyProgramme={studyProgramme}
        year={year}
        years={calendarYears}
      />
    )}
  </Table.Cell>
)

const getSingleTrackRow = ({
  allRights,
  calendarYears,
  code,
  combinedProgramme,
  fullAccessToStudentData,
  otherCountriesStats,
  row,
  showPercentages,
  studyProgramme,
}) => (
  <Table.Row className="regular-row" key={`${code}-${row[0]}`}>
    {row.map((value, index) => {
      if (shouldBeHidden(showPercentages, value)) return null
      if (index === row.length - 2 && otherCountriesStats)
        return getOtherCountriesCell({
          combinedProgramme,
          index,
          otherCountriesStats,
          row,
          studyProgramme: code,
          value,
          year: row[0],
        })
      return (
        <Table.Cell
          className={getCellClass(row[0])}
          // eslint-disable-next-line react/no-array-index-key
          key={`${code}-${row[0]}-${index}`}
          style={combinedProgramme ? getStyleForCombined(index) : getStyleForBasic(index)}
          textAlign="left"
        >
          {value}
          {index === 0 &&
            (fullAccessToStudentData ||
              allRights.includes(studyProgramme) ||
              allRights.includes(combinedProgramme)) && (
              <PopulationLink
                combinedProgramme={combinedProgramme}
                studyProgramme={studyProgramme}
                studyTrack={code}
                year={row[0]}
                years={calendarYears}
              />
            )}
        </Table.Cell>
      )
    })}
  </Table.Row>
)

const getRow = ({
  allRights,
  calendarYears,
  combinedProgramme,
  getTextIn,
  fullAccessToStudentData,
  otherCountriesStats,
  row,
  index: yearIndex,
  setShow,
  show,
  showPercentages,
  studyProgramme,
  studyTracks,
  years,
  yearlyData,
}) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]

  if (years.includes(row[0])) {
    return (
      <Table.Row className="header-row" key={`${yearIndex}-${row[0]}`}>
        {row.map((value, index) => {
          if (shouldBeHidden(showPercentages, value)) return null
          if (index === 0)
            return getFirstCell({
              allRights,
              calendarYears,
              combinedProgramme,
              fullAccessToStudentData,
              setShow,
              show,
              studyProgramme,
              year: row[0],
              yearlyData,
            })
          if (index === row.length - 2 && otherCountriesStats)
            return getOtherCountriesCell({
              combinedProgramme,
              index,
              otherCountriesStats,
              row,
              studyProgramme,
              value,
              year: row[0],
            })
          return getBasicTableCell({ combinedProgramme, index, row, value })
        })}
      </Table.Row>
    )
  }

  if (!show) {
    return null
  }

  const correctStudyTrack = row[0]
  const title =
    studyTracks[correctStudyTrack] === undefined
      ? correctStudyTrack
      : `${getTextIn(studyTracks[correctStudyTrack])}, ${correctStudyTrack}`

  return (
    <Table.Row className="regular-row" key={title}>
      {row.map((value, index) => {
        if (shouldBeHidden(showPercentages, value)) return null
        if (index === 0) {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Table.Cell key={`${title}-${index}`} style={{ paddingLeft: '50px' }} textAlign="left">
              {title}
              {(fullAccessToStudentData ||
                allRights.includes(studyProgramme) ||
                allRights.includes(combinedProgramme)) && (
                <PopulationLink
                  combinedProgramme={combinedProgramme}
                  studyProgramme={studyProgramme}
                  studyTrack={correctStudyTrack}
                  year={year}
                  years={calendarYears}
                />
              )}
            </Table.Cell>
          )
        }
        if (index === row.length - 2 && otherCountriesStats) {
          return getOtherCountriesCell({
            combinedProgramme,
            index,
            otherCountriesStats,
            row,
            studyProgramme: correctStudyTrack,
            value,
            year,
          })
        }
        return getBasicTableCell({ combinedProgramme, index, row, value })
      })}
    </Table.Row>
  )
}

const sortTrackDataByYear = data => {
  if (!data || !data.length) return []

  const copy = [...data]
  const sortedData = copy.sort((a, b) => {
    if (a[0] === 'Total') return -1
    if (b[0] === 'Total') return 1
    if (a[0] < b[0]) return -1
    if (a[0] > b[0]) return 1
    return 0
  })

  sortedData.reverse()
  return sortedData
}

const sortMainDataByYear = data => {
  if (!data || !data.length) return []

  const sortedData = []
  data.forEach(arrays => {
    if (arrays.length) {
      const copy = [...arrays]
      const sortedYear = copy.sort((a, b) => {
        if (a[0] === 'Total') return 1
        if (b[0] === 'Total') return -1
        if (a[0] < b[0]) return 1
        if (a[0] > b[0]) return -1
        return 0
      })
      sortedData.push(sortedYear.reverse())
    }
  })

  sortedData.reverse()
  return sortedData
}

export const StudyTrackDataTable = ({
  combinedProgramme,
  dataOfAllTracks,
  dataOfSingleTrack,
  otherCountriesStats,
  singleTrack,
  studyProgramme,
  studyTracks,
  titles,
  years,
}) => {
  const [show, setShow] = useState([])
  const [showPercentages, setShowPercentages] = useState(false)
  const { getTextIn } = useLanguage()
  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const allRights = programmeRights.map(({ code }) => code)
  if (!dataOfAllTracks && !dataOfSingleTrack) return null
  const firstCellClicked = index => {
    const newShow = [...show]
    show[index] = newShow[index] === undefined ? true : !show[index]
    setShow([...show])
  }
  const sortedMainStats = sortMainDataByYear(Object.values(dataOfAllTracks))
  const sortedTrackStats = sortTrackDataByYear(dataOfSingleTrack)
  const calendarYears = getCalendarYears(years)
  const borderStyleArray = combinedProgramme ? [3, 8, 11] : [3, 7, 10]
  return (
    <div className="datatable">
      <Toggle
        firstLabel="Hide percentages"
        secondLabel="Show percentages"
        setValue={setShowPercentages}
        value={showPercentages}
      />
      <Table celled data-cy="Table-StudyTrackOverview">
        <Table.Header>
          <Table.Row key="FirstHeader">
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 4} />
            <Table.HeaderCell
              colSpan={
                !showPercentages
                  ? getSpanValue(combinedProgramme, 4, showPercentages)
                  : getSpanValue(combinedProgramme, 8, showPercentages)
              }
              style={{ borderLeftWidth: 'thick' }}
            >
              Current status
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 6} style={{ borderLeftWidth: 'thick' }}>
              Gender
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 2 : 4} style={{ borderLeftWidth: 'thick' }}>
              <Popup
                content="Hover over 'Other' cell to see from which countries students are coming."
                trigger={
                  <div>
                    Countries <Icon name="question circle" />
                  </div>
                }
              />
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row key="Table-Studytrack-Titles">
            {titles.map((title, index) => (
              <Table.HeaderCell
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                key={title}
                style={
                  borderStyleArray.includes(index)
                    ? { fontWeight: 'bold', borderLeftWidth: 'thick' }
                    : { fontWeight: 'bold' }
                }
                textAlign="center"
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        {(sortedMainStats || sortedTrackStats) && (
          <Table.Body>
            {singleTrack
              ? sortedTrackStats.map(row =>
                  getSingleTrackRow({
                    allRights,
                    calendarYears,
                    code: singleTrack,
                    combinedProgramme,
                    fullAccessToStudentData,
                    otherCountriesStats,
                    row,
                    showPercentages,
                    studyProgramme,
                  })
                )
              : sortedMainStats?.map((yearlyData, index) =>
                  yearlyData.map(row =>
                    getRow({
                      allRights,
                      calendarYears,
                      combinedProgramme,
                      getTextIn,
                      index,
                      fullAccessToStudentData,
                      otherCountriesStats,
                      row,
                      setShow: () => firstCellClicked(index),
                      show: show[index],
                      showPercentages,
                      studyProgramme,
                      studyTracks,
                      years,
                      yearlyData,
                    })
                  )
                )}
          </Table.Body>
        )}
      </Table>
    </div>
  )
}
