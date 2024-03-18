import React, { useState } from 'react'
import { Button, Icon, Label, Popup, Table } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationLink } from '@/components/StudyProgramme/StudytrackOverview/PopulationLink'
import { Toggle } from '@/components/StudyProgramme/Toggle'

const getStyle = index => {
  if ([4, 12].includes(index)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21].includes(index)) return { backgroundColor: '#f9f9f9' }
  if (index === 18) return { borderLeftWidth: 'thick' }
  return {}
}

const backgroundColors = { KH: '#ffffff', MH: '#f2f6f7', T: '#e7edee' }
const backgroundColorsDarks = { KH: '#f9f9f9', MH: '#eeeeee', T: '#dddddd' }

const getTitlePopup = index => {
  if (index === 0) return 'All'
  if ([1, 2].includes(index)) return 'Started studying'
  if ([3, 4].includes(index)) return 'Currently enrolled'
  if ([5, 6].includes(index)) return 'Absent'
  if ([7, 8].includes(index)) return 'Inactive'
  if ([9, 10].includes(index)) return 'Graduated'
  if ([11, 12].includes(index)) return 'Men'
  if ([13, 14].includes(index)) return 'Women'
  if ([15, 16].includes(index)) return 'Other/Unknown'
  if ([17, 18].includes(index)) return 'Finland'
  return 'Other'
}

const getRowStyle = (index, tableLinePlaces, dark = false) => {
  if (tableLinePlaces.length >= 3 && tableLinePlaces[2][0] <= index)
    return dark
      ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[2][1]] }
      : { backgroundColor: backgroundColors[tableLinePlaces[2][1]] }
  if (tableLinePlaces.length >= 3 && tableLinePlaces[2][0] > index && tableLinePlaces[1][0] <= index)
    return dark
      ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[1][1]] }
      : { backgroundColor: backgroundColors[tableLinePlaces[1][1]] }
  if (tableLinePlaces.length >= 2 && tableLinePlaces[1][0] > index && tableLinePlaces[0][0] <= index)
    return dark
      ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[0][1]] }
      : { backgroundColor: backgroundColors[tableLinePlaces[0][1]] }
  return dark
    ? { backgroundColor: backgroundColorsDarks[tableLinePlaces[0][1]] }
    : { backgroundColor: backgroundColors[tableLinePlaces[0][1]] }
}

const getTableCell = ({ year, programme, valIndex, rowIndex, tableLinePlaces, value }) => {
  return (
    <Table.Cell
      key={`${year}-${programme}-color-${Math.random()}`}
      style={
        getStyle(valIndex + 1)?.backgroundColor
          ? {
              borderLeftWidth: getStyle(valIndex + 1).borderLeftWidth,
              ...getRowStyle(rowIndex, tableLinePlaces, true),
            }
          : { ...getStyle(valIndex + 1), ...getRowStyle(rowIndex, tableLinePlaces) }
      }
      textAlign="right"
    >
      {value}
    </Table.Cell>
  )
}

const getOtherCountriesList = ({ year, code, extraTableStats }) => {
  if (Object.keys(extraTableStats?.[year]?.[code]).length === 0) return <p key={`${Math.random()}-nodata`}>No data</p>
  const countriesData = extraTableStats[year][code]
  return Object.keys(countriesData)
    .sort()
    .map(key => (
      <p key={`${Math.random()}-${key}`} style={{ padding: 0, margin: 0 }}>
        {key === 'null' ? 'Unknown' : key}: <b>{countriesData[key]}</b>
      </p>
    ))
}

const getRows = ({
  index,
  programme,
  year,
  showPercentages,
  programmeStats,
  extraTableStats,
  tableLinePlaces,
  programmeNames,
}) => {
  return programmeStats[programme][year].map((value, valIndex) => {
    const key = `${programme}-${year}-${`${value}${valIndex}`}`
    if (!showPercentages && typeof value === 'string' && (value.includes('%') || value.includes('NA'))) return null
    if (valIndex === 19) {
      return (
        <Popup
          content={getOtherCountriesList({ year, code: programmeNames[programme].code, extraTableStats })}
          key={key}
          trigger={getTableCell({ year, programme, valIndex, rowIndex: index, tableLinePlaces, value })}
        />
      )
    }
    return (
      <Popup
        content={getTitlePopup(valIndex)}
        key={key}
        trigger={getTableCell({ year, programme, valIndex, rowIndex: index, tableLinePlaces, value })}
      />
    )
  })
}

export const FacultyStudentDataTable = ({
  cypress,
  extraTableStats,
  programmeNames,
  programmeStats,
  requiredRights,
  sortedKeys,
  tableLinePlaces,
  tableStats,
  titles,
  years,
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
        setValue={setShowPercentages}
        value={showPercentages}
      />
      <Table celled data-cy={cypress} structured>
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
                content="Hover over 'Other' cell to see from which countries students are coming. Shown only for study programmes."
                trigger={
                  <div>
                    Countries <Icon name="question circle" />
                  </div>
                }
              />
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row key="secondHeader">
            {titles.map((title, index) => (
              <Table.HeaderCell
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                key={title}
                style={
                  [3, 7, 10].includes(index) ? { fontWeight: 'bold', borderLeftWidth: 'thick' } : { fontWeight: 'bold' }
                }
                textAlign="center"
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {years.map((year, yearIndex) => {
            return (
              <React.Fragment key={`${year}-fragment`}>
                <Table.Row className={year === 'Total' ? 'total-row-cell' : ''} key={`${year}-faculty-row}`}>
                  {tableStats[year].map((value, valueIndex) => {
                    if (valueIndex === 0)
                      return (
                        <Table.Cell key={`${year}-faculty-cell}`}>
                          <Button
                            as="div"
                            data-cy={`Button-${cypress}-${yearIndex}`}
                            key={`${year}-studentsTableButton}`}
                            labelPosition="right"
                            onClick={() => toggleVisibility(yearIndex)}
                            style={{ backgroundColor: 'white', borderRadius: 0, margin: 0, padding: 0 }}
                          >
                            <Button icon style={{ backgroundColor: 'white', borderRadius: 0, margin: 0, padding: 0 }}>
                              <Icon name={yearsVisible[yearIndex] ? 'angle down' : 'angle right'} />
                            </Button>
                            <Label as="a" style={{ backgroundColor: 'white', borderRadius: 0, margin: 0, padding: 0 }}>
                              <b>{value}</b>
                            </Label>
                          </Button>
                        </Table.Cell>
                      )
                    if (!showPercentages && typeof value === 'string' && (value.includes('%') || value.includes('NA')))
                      return null
                    return (
                      <Table.Cell
                        key={`${year}$-cell-colorless-${valueIndex + Math.random()}`}
                        style={getStyle(valueIndex)}
                        textAlign="right"
                      >
                        {value}
                      </Table.Cell>
                    )
                  })}
                </Table.Row>
                {yearsVisible[yearIndex] &&
                  sortedKeys.map((programme, index) => {
                    return programmeStats[programme][year].length === 0 ? null : (
                      <Table.Row className="regular-row" key={`${year}-regular-row-${programme}`}>
                        <Table.Cell
                          key={`${year}-${programme}`}
                          style={{ paddingLeft: '50px', ...getRowStyle(index, tableLinePlaces) }}
                          textAlign="left"
                        >
                          <Popup
                            content={
                              <p>
                                {programmeNames[programme].code} - {getTextIn(programmeNames[programme])}
                              </p>
                            }
                            trigger={<b>{programme}</b>}
                          />
                          {requiredRights.programmeRights?.includes(programmeNames[programme].code) ||
                            (requiredRights.isAdmin && (
                              <PopulationLink
                                studyprogramme={programmeNames[programme].code}
                                year={year}
                                years={calendarYears}
                              />
                            ))}
                        </Table.Cell>
                        {getRows({
                          index,
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
              </React.Fragment>
            )
          })}
        </Table.Body>
      </Table>
    </div>
  )
}
