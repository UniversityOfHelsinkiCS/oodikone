/* eslint-disable react/no-array-index-key */
import PopulationLink from 'components/StudyProgramme/StudytrackOverview/PopulationLink'
import React, { useState } from 'react'
import { Table, Button, Icon, Label, Popup } from 'semantic-ui-react'
import useLanguage from 'components/LanguagePicker/useLanguage'
import Toggle from '../../StudyProgramme/Toggle'

const getStyle = idx => {
  if ([4, 12].includes(idx)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21].includes(idx)) return { backgroundColor: '#f9f9f9' }
  if (idx === 18) return { borderLeftWidth: 'thick' }
  return {}
}

const backgroundColors = { KH: '#ffffff', MH: '#f2f6f7', T: '#e7edee' }
const backgroundColorsDarks = { KH: '#f9f9f9', MH: '#eeeeee', T: '#dddddd' }

const getTitlePopup = idx => {
  if (idx === 0) return <p>All</p>
  if ([1, 2].includes(idx)) return <p>Started studying</p>
  if ([3, 4].includes(idx)) return <p>Currently enrolled</p>
  if ([5, 6].includes(idx)) return <p>Absent</p>
  if ([7, 8].includes(idx)) return <p>Inactive</p>
  if ([9, 10].includes(idx)) return <p>Graduated</p>
  if ([11, 12].includes(idx)) return <p>Men</p>
  if ([13, 14].includes(idx)) return <p>Women</p>
  if ([15, 16].includes(idx)) return <p>Other/Unknown</p>
  if ([17, 18].includes(idx)) return <p>Finland</p>
  return <p>Other</p>
}

const getRowStyle = (idx, tableLinePlaces, dark = false) => {
  if (tableLinePlaces.length >= 3 && tableLinePlaces[2][0] <= idx)
    return dark
      ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[2][1]] }
      : { backgroundColor: backgroundColors[tableLinePlaces[2][1]] }
  if (tableLinePlaces.length >= 3 && tableLinePlaces[2][0] > idx && tableLinePlaces[1][0] <= idx)
    return dark
      ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[1][1]] }
      : { backgroundColor: backgroundColors[tableLinePlaces[1][1]] }
  if (tableLinePlaces.length >= 2 && tableLinePlaces[1][0] > idx && tableLinePlaces[0][0] <= idx)
    return dark
      ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[0][1]] }
      : { backgroundColor: backgroundColors[tableLinePlaces[0][1]] }
  return dark
    ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[0][1]] }
    : { backgroundColor: backgroundColors[tableLinePlaces[0][1]] }
}

const getTableCell = ({ year, programme, valIdx, rowIdx, tableLinePlaces, value }) => {
  return (
    <Table.Cell
      key={`${year}-${programme}-color-${valIdx}`}
      style={
        getStyle(valIdx + 1)?.backgroundColor
          ? {
              borderLeftWidth: getStyle(valIdx + 1).borderLeftWidth,
              ...getRowStyle(rowIdx, tableLinePlaces, true),
            }
          : { ...getStyle(valIdx + 1), ...getRowStyle(rowIdx, tableLinePlaces) }
      }
    >
      {value}
    </Table.Cell>
  )
}

const getOtherCountriesString = ({ year, code, extraTableStats }) => {
  if (
    !extraTableStats ||
    !extraTableStats[year] ||
    !extraTableStats[year][code] ||
    !extraTableStats[year][code]?.countries
  )
    return ''
  const countriesData = extraTableStats[year][code].countries
  return Object.keys(countriesData)
    .sort()
    .reduce((acc, key) => `${acc} | ${key}: ${countriesData[key]}`, '')
}

const getRows = ({
  idx,
  programme,
  year,
  showPercentages,
  programmeStats,
  extraTableStats,
  tableLinePlaces,
  programmeNames,
}) => {
  return programmeStats[programme][year].map((value, valIdx) => {
    if (!showPercentages && typeof value === 'string' && (value.includes('%') || value.includes('NA'))) return null
    if (valIdx === 19) {
      return (
        <Popup
          key={`${valIdx}-${programme}-${idx}`}
          content={getOtherCountriesString({ year, code: programmeNames[programme].code, extraTableStats }).slice(3)}
          trigger={getTableCell({ year, programme, valIdx, rowIdx: idx, tableLinePlaces, value })}
        />
      )
    }
    return (
      <Popup
        key={`${valIdx}-${idx}-${programme}`}
        content={getTitlePopup(valIdx)}
        trigger={getTableCell({ year, programme, valIdx, rowIdx: idx, tableLinePlaces, value })}
      />
    )
  })
}

const FacultyStudentDataTable = ({
  tableStats,
  extraTableStats,
  programmeStats,
  programmeNames,
  tableLinePlaces,
  titles,
  years,
  sortedKeys,
  cypress,
  requiredRights,
}) => {
  const [yearsVisible, setVisible] = useState(new Array(years.length).fill(false))
  const [showPercentages, setShowPercentages] = useState(false)
  const { getTextIn } = useLanguage()
  const toggleVisibility = yearIndex => {
    const arrayToModify = [...yearsVisible]
    arrayToModify[yearIndex] = !yearsVisible[yearIndex]
    setVisible(arrayToModify)
  }

  const calendarYears = years.reduce((all, year) => {
    if (year === 'Total') return all
    return all.concat(Number(year.slice(0, 4)))
  }, [])

  return (
    <div className="datatable">
      <Toggle
        cypress="HidePercentagesToggle"
        firstLabel="Hide percentages"
        secondLabel="Show percentages"
        value={showPercentages}
        setValue={setShowPercentages}
      />
      <Table data-cy={cypress} celled structured>
        <Table.Header>
          <Table.Row key="FirstHeader">
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 4} />
            <Table.HeaderCell colSpan={!showPercentages ? 4 : 8} style={{ borderLeftWidth: 'thick' }}>
              Status
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 6} style={{ borderLeftWidth: 'thick' }}>
              Gender
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 2 : 4} style={{ borderLeftWidth: 'thick' }}>
              <Popup
                trigger={
                  <div>
                    Countries <Icon name="question circle" />
                  </div>
                }
                content="Hover over 'Other' cell to see from which countries students are coming. Shown only for study programmes."
              />
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row key="secondHeader">
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                style={
                  [3, 7, 10].includes(index) ? { fontWeight: 'bold', borderLeftWidth: 'thick' } : { fontWeight: 'bold' }
                }
                textAlign="left"
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {years.map((year, yearIndex) => {
            return (
              <>
                <Table.Row key={`${year}-faculty-row}`} className={year === 'Total' ? 'total-row-cell' : ''}>
                  {tableStats[year].map((value, valueIdx) => {
                    if (valueIdx === 0)
                      return (
                        <Table.Cell key={`${year}-faculty-cell}`}>
                          <Button
                            key={`${year}-studentsTableButton}`}
                            as="div"
                            onClick={() => toggleVisibility(yearIndex)}
                            labelPosition="right"
                            style={{ backgroundColor: 'white', borderRadius: 0, padding: 0, margin: 0 }}
                            data-cy={`Button-${cypress}-${yearIndex}`}
                          >
                            <Button icon style={{ backgroundColor: 'white', borderRadius: 0, padding: 0, margin: 0 }}>
                              <Icon name={yearsVisible[yearIndex] ? 'angle down' : 'angle right'} />
                            </Button>
                            <Label as="a" style={{ backgroundColor: 'white', borderRadius: 0, padding: 0, margin: 0 }}>
                              <b>{value}</b>
                            </Label>
                          </Button>
                        </Table.Cell>
                      )
                    if (!showPercentages && typeof value === 'string' && (value.includes('%') || value.includes('NA')))
                      return null
                    return (
                      <Table.Cell
                        style={getStyle(valueIdx)}
                        key={`${year}$-cell-colorless-${valueIdx + Math.random()}`}
                      >
                        {value}
                      </Table.Cell>
                    )
                  })}
                </Table.Row>
                {yearsVisible[yearIndex] &&
                  sortedKeys.map((programme, idx) => {
                    return programmeStats[programme][year].length === 0 ? null : (
                      <Table.Row className="regular-row" key={`${year}-regular-row-${programme}`}>
                        <Table.Cell
                          textAlign="left"
                          key={`${year}-${programme}`}
                          style={{ paddingLeft: '50px', ...getRowStyle(idx, tableLinePlaces) }}
                        >
                          <Popup
                            content={
                              <p>
                                {programmeNames[programme].code} - {getTextIn(programmeNames[programme])}
                              </p>
                            }
                            trigger={<b>{programme}</b>}
                          />
                          {(requiredRights.rights?.includes(programmeNames[programme].code) ||
                            requiredRights.isAdmin ||
                            requiredRights.IAMrights?.includes(programmeNames[programme].code)) && (
                            <PopulationLink
                              studyprogramme={programmeNames[programme].code}
                              year={year}
                              years={calendarYears}
                            />
                          )}
                        </Table.Cell>
                        {getRows({
                          idx,
                          programme,
                          year,
                          showPercentages,
                          programmeStats,
                          extraTableStats,
                          tableLinePlaces,
                          programmeNames,
                        })}
                      </Table.Row>
                    )
                  })}
              </>
            )
          })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default FacultyStudentDataTable
