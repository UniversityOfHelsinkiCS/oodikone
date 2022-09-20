import React, { useState } from 'react'
import { Divider, Message } from 'semantic-ui-react'
import BarChart from './BarChart'
import useLanguage from '../../LanguagePicker/useLanguage'

const GraduationTimes = ({
  title,
  years,
  data,
  level,
  goal,
  label,
  levelProgrammeData,
  programmeNames,
  showMeanTime,
}) => {
  const [programmeData, setProgrammeData] = useState(false)
  const [year, setYear] = useState(null)
  const { language } = useLanguage()
  if (!data.some(a => a.amount > 0)) return null

  const handleClick = (e, isFacultyGraph) => {
    if (isFacultyGraph) {
      setYear(e.point.category)
      setProgrammeData(true)
    } else {
      setProgrammeData(false)
      setYear(null)
    }
  }
  // TODO clean up inline styling
  return (
    <>
      <Divider data-cy={`Section-${level}`} horizontal>
        {title}
      </Divider>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '100px' }}>
          <BarChart
            categories={years}
            data={data}
            goal={goal}
            handleClick={handleClick}
            label={label}
            programmeNames={programmeNames}
            showMeanTime={showMeanTime}
          />
          {!programmeData ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Message compact>Click a bar to view that year's programme level breakdown</Message>
            </div>
          ) : (
            <BarChart
              categories={levelProgrammeData[year]?.programmes}
              data={levelProgrammeData[year]?.data}
              goal={goal}
              facultyGraph={false}
              handleClick={handleClick}
              year={year} // programmeData?.year}
              label={label}
              programmeNames={programmeNames}
              language={language}
              showMeanTime={showMeanTime}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default GraduationTimes
