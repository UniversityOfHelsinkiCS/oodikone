import React from 'react'
import { Divider, Header } from 'semantic-ui-react'
import GaugeChart from './GaugeChart'

const GraduationTimes = ({ title, years, data, amounts, level }) => {
  if (!Object.values(amounts).some(a => a > 0)) return null

  return (
    <>
      <div className="divider">
        <Header as="h4" floated="left">
          {title}
        </Header>
        <Divider clearing />
        {/* <Divider data-cy={`Title-${level}-degree`} clearing>
          {title}
        </Divider> */}
      </div>
      <div className="section-container-centered">
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
      </div>
    </>
  )
}

export default GraduationTimes
