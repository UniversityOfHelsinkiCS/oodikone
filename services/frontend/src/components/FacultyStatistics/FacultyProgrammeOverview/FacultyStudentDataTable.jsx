/* eslint-disable react/no-array-index-key */
import PopulationLink from 'components/StudyProgramme/StudytrackOverview/PopulationLink'
import React, { useState } from 'react'
import { Table, Button, Icon, Label } from 'semantic-ui-react'
import Toggle from '../../StudyProgramme/Toggle'

const getStyle = idx => {
  if ([4, 12].includes(idx)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21].includes(idx)) return { backgroundColor: '#f9f9f9' }
  if (idx === 18) return { borderLeftWidth: 'thick' }
  return {}
}
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
  const toggleVisibility = yearIndex => {
    const arrayToModify = [...yearsVisible]
    arrayToModify[yearIndex] = !yearsVisible[yearIndex]
    setVisible(arrayToModify)
  }

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
          <Table.Row>
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 4} />
            <Table.HeaderCell colSpan={!showPercentages ? 4 : 8} style={{ borderLeftWidth: 'thick' }}>
              Status
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 6} style={{ borderLeftWidth: 'thick' }}>
              Gender
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 2 : 4} style={{ borderLeftWidth: 'thick' }}>
              Country
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Header>
          <Table.Row>
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
                <Table.Row key={`${year}-faculty-row}`} className="header-row">
                  {tableStats[year].map((value, valueIdx) => {
                    if (valueIdx === 0)
                      return (
                        <Table.Cell key={`${year}-faculty-cell}`}>
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
                  sortedKeys.map(programme => {
                    return (
                      <Table.Row className="regular-row" key={`${year}-regular-row-${programme}`}>
                        <Table.Cell textAlign="left" style={{ paddingLeft: '50px' }} key={`${year}-${programme}`}>
                          <b>
                            {programme} - {programmeNames[programme].code}
                            <br />
                            {programmeNames[programme][language]
                              ? programmeNames[programme][language]
                              : programmeNames[programme].fi}
                          </b>
                          {(requiredRights.rights?.includes(programmeNames[programme].code) ||
                            requiredRights.isAdmin ||
                            requiredRights.IAMrights?.includes(programmeNames[programme].code)) && (
                            <PopulationLink studyprogramme={programmeNames[programme].code} year={year} />
                          )}
                        </Table.Cell>
                        {programmeStats[programme][year].map((value, valIdx) => {
                          if (
                            !showPercentages &&
                            typeof value === 'string' &&
                            (value.includes('%') || value.includes('NA'))
                          )
                            return null
                          return (
                            <Table.Cell key={`${year}-${programme}-color-${valIdx}`} style={getStyle(valIdx + 1)}>
                              {value}
                            </Table.Cell>
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
