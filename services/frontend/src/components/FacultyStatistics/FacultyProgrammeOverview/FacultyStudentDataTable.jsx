import PopulationLink from 'components/StudyProgramme/StudytrackOverview/PopulationLink'
import React, { useState } from 'react'
import { Table, Button, Icon, Label } from 'semantic-ui-react'
import Toggle from '../../StudyProgramme/Toggle'

const FacultyStudentDataTable = ({
  tableStats,
  programmeStats,
  programmeNames,
  titles,
  years,
  sortedKeys,
  language,
  cypress,
  requiredRights,
}) => {
  const [yearsVisible, setVisible] = useState(new Array(years.length).fill(false))
  const [showPercentages, setShowPercentages] = useState(false)

  const calendarYears = years.reduce((all, year) => {
    if (year === 'Total') return all
    return all.concat(Number(year.slice(0, 4)))
  }, [])

  const toggleVisibility = yearIndex => {
    const arrayToModify = [...yearsVisible]
    arrayToModify[yearIndex] = !yearsVisible[yearIndex]
    setVisible(arrayToModify)
  }

  return (
    <div className="datatable">
      <Toggle
        firstLabel="Hide percentages"
        secondLabel="Show percentages"
        value={showPercentages}
        setValue={setShowPercentages}
      />
      <Table data-cy="Table-StudytrackOverview" celled>
        <Table.Header>
          <Table.Row>
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                textAlign="left"
                style={{ fontWeight: 'bold' }}
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
                <Table.Row key={`${year}-faculty-row-${Math.random()}`} className="header-row">
                  {tableStats[year].map((value, valueIdx) => {
                    if (valueIdx === 0)
                      return (
                        <Table.Cell key={`${year}-faculty-cell-${Math.random()}`}>
                          <Button
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
                    if (!showPercentages && typeof value === 'string' && value.includes('%')) return null
                    if ([1, 4, 5, 8, 9, 12, 13, 16, 17].includes(valueIdx))
                      return (
                        <Table.Cell style={{ backgroundColor: '#f9f9f9' }} key={`${year}-cell-color-${Math.random()}`}>
                          {value}
                        </Table.Cell>
                      )
                    return <Table.Cell key={`${year}$-${value}-cell-${Math.random()}`}>{value}</Table.Cell>
                  })}
                </Table.Row>
                {yearsVisible[yearIndex] &&
                  sortedKeys.map(programme => {
                    return (
                      <Table.Row className="regular-row" key={`${year}-regular-row-${Math.random()}`}>
                        <Table.Cell textAlign="left" style={{ paddingLeft: '50px' }} key={`${year}-${programme}`}>
                          <b>
                            {programme}
                            <br />
                            {programmeNames[programme][language]
                              ? programmeNames[programme][language]
                              : programmeNames[programme].fi}
                          </b>
                          {(requiredRights.rights?.includes(programme) ||
                            requiredRights.isAdmin ||
                            requiredRights.IAMrights?.includes(programme)) && (
                            <PopulationLink studyprogramme={programme} year={year} years={calendarYears} />
                          )}
                        </Table.Cell>
                        {programmeStats[programme][year].map((value, valIdx) => {
                          if (
                            !showPercentages &&
                            typeof value === 'string' &&
                            (value.includes('%') || value.includes('NA'))
                          )
                            return null
                          if ([0, 3, 4, 7, 8, 11, 12, 15, 16].includes(valIdx))
                            return (
                              <Table.Cell
                                key={`${year}-${programme}-color-${Math.random()}`}
                                style={{ backgroundColor: '#f9f9f9' }}
                              >
                                {value}
                              </Table.Cell>
                            )
                          return (
                            <Table.Cell key={`${year}-${programme}-colorless-${Math.random()}`}>{value}</Table.Cell>
                          )
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
