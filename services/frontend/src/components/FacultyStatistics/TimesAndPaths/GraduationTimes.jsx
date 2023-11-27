import React, { useState } from 'react'
import { Divider, Message } from 'semantic-ui-react'
import { MedianBarChart } from './MedianBarChart'
import { BreakdownBarChart } from './BreakdownBarChart'
import '../faculty.css'

const MedianDisplay = ({
  handleClick,
  data,
  level,
  goal,
  label,
  levelProgrammeData,
  programmeNames,
  classSizes,
  groupBy,
  goalExceptions,
  year,
  programmeData,
}) => {
  return (
    <div>
      {level === 'bcMsCombo' && groupBy === 'byStartYear' && (
        <div className="graduations-message">
          <Message compact>
            Programme class sizes for recent years are not reliable as students might still lack relevant master studies
            data in Sisu
          </Message>
        </div>
      )}
      {goalExceptions.needed && ['master', 'bcMsCombo'].includes(level) && (
        <div className="graduations-message">
          <Message compact>
            <b>Different goal times</b> have been taken into account in all numbers and programme level bar coloring,
            but the faculty level bar color is based on the typical goal time of {goal} months
          </Message>
        </div>
      )}
      <div className="graduations-chart-container">
        <MedianBarChart
          data={data}
          goal={goal}
          handleClick={handleClick}
          label={label}
          programmeNames={programmeNames}
          classSizes={classSizes?.[level]}
        />
        {!programmeData ? (
          <div className="graduations-message">
            <Message compact>Click a bar to view that year's programme level breakdown</Message>
          </div>
        ) : (
          <MedianBarChart
            data={levelProgrammeData[year]?.data}
            goal={goal}
            facultyGraph={false}
            handleClick={handleClick}
            year={year}
            label={label}
            programmeNames={programmeNames}
            classSizes={classSizes?.programmes}
            level={level}
            goalExceptions={goalExceptions}
          />
        )}
      </div>
    </div>
  )
}

const BreakdownDislay = ({ handleClick, data, label, levelProgrammeData, programmeNames, year, programmeData }) => {
  return (
    <div>
      <div className="graduations-chart-container">
        <BreakdownBarChart data={data} handleClick={handleClick} label={label} />
        {!programmeData ? (
          <div className="graduations-message">
            <Message compact>Click a bar to view that year's programme level breakdown</Message>
          </div>
        ) : (
          <BreakdownBarChart
            data={levelProgrammeData[year]?.data}
            handleClick={handleClick}
            facultyGraph={false}
            year={year}
            label={label}
            programmeNames={programmeNames}
          />
        )}
      </div>
    </div>
  )
}

export const GraduationTimes = ({
  title,
  data,
  level,
  goal,
  label,
  levelProgrammeData,
  programmeNames,
  showMedian,
  classSizes,
  groupBy,
  goalExceptions,
}) => {
  const [programmeData, setProgrammeData] = useState(false)
  const [year, setYear] = useState(null)
  if (!data.some(a => a.amount > 0)) return null

  const handleClick = (e, isFacultyGraph, seriesCategory = null) => {
    if (isFacultyGraph) {
      setYear(seriesCategory || e.point.name)
      setProgrammeData(true)
    } else {
      setProgrammeData(false)
      setYear(null)
    }
  }

  return (
    <div className={`graduation-times-${level}`} data-cy={`Section-${level}`}>
      <Divider horizontal>{title}</Divider>
      {!showMedian ? (
        <BreakdownDislay
          handleClick={handleClick}
          data={data}
          level={level}
          label={label}
          levelProgrammeData={levelProgrammeData}
          programmeNames={programmeNames}
          year={year}
          programmeData={programmeData}
        />
      ) : (
        <MedianDisplay
          handleClick={handleClick}
          data={data}
          level={level}
          goal={goal}
          label={label}
          levelProgrammeData={levelProgrammeData}
          programmeNames={programmeNames}
          classSizes={classSizes}
          groupBy={groupBy}
          goalExceptions={goalExceptions}
          year={year}
          programmeData={programmeData}
        />
      )}
    </div>
  )
}
