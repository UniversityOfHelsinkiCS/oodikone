import React, { useState } from 'react'
import { Divider, Message } from 'semantic-ui-react'
// import GaugeChart from './GaugeChart'
import BarChart from './BarChart'

const GraduationTimes = ({ title, years, data, level, goal }) => {
  const [programmeData, setProgrammeData] = useState(null)
  if (!data.some(a => a.amount > 0)) return null

  const handleClick = (e, level, isFacultyGraph) => {
    // console.log(e.point.category, level)
    if (isFacultyGraph) {
      setProgrammeData({
        data: [
          { y: 40, amount: 23 },
          { y: 35, amount: 100 },
          { y: 46.5, amount: 84 },
          { y: 38, amount: 24 },
          { y: 45, amount: 7 },
        ],
        categories: ['KH001', 'KH002', 'KH003', 'KH004', 'KH005'],
        year: e.point.category,
      })
    } else {
      setProgrammeData(null)
    }
  }

  return (
    <>
      <Divider data-cy={`Section-${level}`} horizontal>
        {title}
      </Divider>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '100px' }}>
          <BarChart categories={years} data={data} level={level} goal={goal} handleClick={handleClick} />
          {programmeData === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Message compact>Click a bar to view that year's programme level breakdown.</Message>
            </div>
          ) : (
            <BarChart
              categories={programmeData?.categories}
              data={programmeData?.data}
              level={level}
              goal={36}
              facultyGraph={false}
              handleClick={handleClick}
              year={programmeData?.year}
            />
          )}
        </div>
      </div>
      {/* <div className="section-container-centered">
        {years.map(year => (
          <GaugeChart
            cypress={`${year}-AverageGraduationTimes`}
            key={year}
            year={year}
            data={data[year]}
            graduationAmount={amounts[year]}
            level={level}
          />
        ))}
      </div> */}
    </>
  )
}

export default GraduationTimes
