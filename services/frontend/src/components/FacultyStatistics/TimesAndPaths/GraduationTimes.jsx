import { useState } from 'react'
import { Divider, Message } from 'semantic-ui-react'

import '@/components/FacultyStatistics/faculty.css'
import { BreakdownBarChart } from './BreakdownBarChart'
import { MedianBarChart } from './MedianBarChart'

const MedianDisplay = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy,
  handleClick,
  level,
  levelProgrammeData,
  programmeData,
  programmeNames,
  universityMode,
  year,
  yearLabel,
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
          classSizes={classSizes?.[level]}
          data={data}
          goal={goal}
          handleClick={handleClick}
          programmeNames={programmeNames}
          universityMode={universityMode}
          yearLabel={yearLabel}
        />
        {!programmeData ? (
          <div className="graduations-message">
            <Message compact>
              Click a bar to view that year's {universityMode ? 'faculty' : 'programme'} level breakdown
            </Message>
          </div>
        ) : (
          <MedianBarChart
            classSizes={classSizes?.programmes}
            data={levelProgrammeData[year]?.data}
            facultyGraph={false}
            goal={goal}
            goalExceptions={goalExceptions}
            handleClick={handleClick}
            level={level}
            programmeNames={programmeNames}
            universityMode={universityMode}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </div>
    </div>
  )
}

const BreakdownDisplay = ({
  data,
  handleClick,
  levelProgrammeData,
  programmeData,
  programmeNames,
  universityMode,
  year,
  yearLabel,
}) => {
  return (
    <div>
      <div className="graduations-chart-container">
        <BreakdownBarChart
          data={data}
          handleClick={handleClick}
          universityMode={universityMode}
          yearLabel={yearLabel}
        />
        {!programmeData || !(year in levelProgrammeData) ? (
          <div className="graduations-message">
            <Message compact>
              Click a bar to view that year's {universityMode ? 'faculty' : 'programme'} level breakdown
            </Message>
          </div>
        ) : (
          <BreakdownBarChart
            data={levelProgrammeData[year].data}
            facultyGraph={false}
            handleClick={handleClick}
            programmeNames={programmeNames}
            universityMode={universityMode}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </div>
    </div>
  )
}

export const GraduationTimes = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy,
  level,
  levelProgrammeData,
  programmeNames,
  showMedian,
  title,
  universityMode,
  yearLabel,
}) => {
  const [programmeData, setProgrammeData] = useState(false)
  const [year, setYear] = useState(null)

  if (!data) return null

  const handleClick = (event, isFacultyGraph, seriesCategory = null) => {
    if (isFacultyGraph) {
      setYear(seriesCategory || event.point.name)
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
        <BreakdownDisplay
          data={data}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          programmeData={programmeData}
          programmeNames={programmeNames}
          universityMode={universityMode}
          year={year}
          yearLabel={yearLabel}
        />
      ) : (
        <MedianDisplay
          classSizes={classSizes}
          data={data}
          goal={goal}
          goalExceptions={goalExceptions}
          groupBy={groupBy}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          programmeData={programmeData}
          programmeNames={programmeNames}
          universityMode={universityMode}
          year={year}
          yearLabel={yearLabel}
        />
      )}
    </div>
  )
}
