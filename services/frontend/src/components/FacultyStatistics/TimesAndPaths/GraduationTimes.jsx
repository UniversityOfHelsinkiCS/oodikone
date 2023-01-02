import React, { useState } from 'react'
import { Divider, Message } from 'semantic-ui-react'
import MedianBarChart from './MedianBarChart'
// import BreakdownBarChart from './BreakdownBarChart'
import useLanguage from '../../LanguagePicker/useLanguage'
import '../faculty.css'

const GraduationTimes = ({
  title,
  data,
  level,
  goal,
  label,
  levelProgrammeData,
  programmeNames,
  showMeanTime,
  classSizes,
  groupBy,
  goalExceptions,
}) => {
  const [programmeData, setProgrammeData] = useState(false)
  const [year, setYear] = useState(null)
  const { language } = useLanguage()
  if (!data.some(a => a.amount > 0)) return null

  const handleClick = (e, isFacultyGraph) => {
    if (isFacultyGraph) {
      setYear(e.point.name)
      setProgrammeData(true)
    } else {
      setProgrammeData(false)
      setYear(null)
    }
  }

  return (
    <div className={`graduation-times-${level}`} data-cy={`Section-${level}`}>
      <Divider horizontal>{title}</Divider>
      <div>
        {level === 'bcMsCombo' && groupBy === 'byStartYear' && (
          <div className="graduations-message">
            <Message compact>
              Programme class sizes for recent years are not reliable as students might still lack relevant master
              studies data in Sisu
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
            showMeanTime={showMeanTime}
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
              language={language}
              showMeanTime={showMeanTime}
              classSizes={classSizes?.programmes}
              level={level}
              goalExceptions={goalExceptions}
            />
          )}
        </div>
        {/* <div className="graduations-chart-container">
          <BreakdownBarChart data={data} />
          {programmeData && <BreakdownBarChart data={levelProgrammeData[year]?.data} />}
        </div> */}
      </div>
    </div>
  )
}

export default GraduationTimes
