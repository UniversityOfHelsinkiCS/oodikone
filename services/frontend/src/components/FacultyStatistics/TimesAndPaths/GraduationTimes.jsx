import React, { useState } from 'react'
import { Divider, Message } from 'semantic-ui-react'
import BarChart from './BarChart'

const GraduationTimes = ({ title, years, data, level, goal, label, levelProgrammeData }) => {
  const [programmeData, setProgrammeData] = useState(null)
  if (!data.some(a => a.amount > 0)) return null

  const handleClick = (e, isFacultyGraph) => {
    if (isFacultyGraph) {
      const year = e.point.category
      setProgrammeData({
        data: levelProgrammeData[year]?.data,
        categories: levelProgrammeData[year]?.programmes,
        year,
      })
    } else {
      setProgrammeData(null)
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
          <BarChart categories={years} data={data} goal={goal} handleClick={handleClick} label={label} />
          {programmeData === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Message compact>Click a bar to view that year's programme level breakdown</Message>
            </div>
          ) : (
            <BarChart
              categories={programmeData?.categories}
              data={programmeData?.data}
              goal={goal}
              facultyGraph={false}
              handleClick={handleClick}
              year={programmeData?.year}
              label={label}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default GraduationTimes
