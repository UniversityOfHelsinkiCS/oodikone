import React from 'react'
import GaugeChart from './GaugeChart'

const GraduationTimes = ({ title, years, data, amounts }) => {
  return (
    <>
      <div>
        <strong>{title}</strong>
      </div>
      <div className="section-container-centered">
        {years.map(year => (
          <GaugeChart
            cypress={`${year}-AverageGraduationTimes`}
            key={year}
            year={year}
            data={data[year]}
            graduationAmount={amounts[year]}
            studyprogramme="KH"
          />
        ))}
      </div>
    </>
  )
}

export default GraduationTimes
