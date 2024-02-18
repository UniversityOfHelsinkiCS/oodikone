import { DataTable } from 'components/StudyProgramme/BasicOverview/DataTable'
import { StackedBarChart } from 'components/StudyProgramme/BasicOverview/StackedBarChart'
import { Toggle } from 'components/StudyProgramme/Toggle'
import React, { useState } from 'react'

const getFormattedYear = (year, academicYear) => (academicYear ? `${year} - ${year + 1}` : `${year}`)

const makeGraphData = (data, showAll, isAcademicYear) => {
  if (!data) return null
  const allKeys = [
    ...new Set(
      Object.keys(data)
        .flatMap(year => Object.keys(data[year]))
        .filter(key => key !== 'total' && key !== 'other')
        .filter(key => showAll || !['agreement', 'special', 'separate'].includes(key))
    ),
  ]
  const names = {
    agreement: 'Other university',
    special: 'Special studyright: non-degree',
    separate: 'Separate studies',
    basic: 'Degree students',
    'open-uni': 'Open university',
    transferred: 'Transferred',
    'incoming-exchange': 'Exchange students',
  }
  const currentYear = new Date().getFullYear()
  const years = []
  const graphStats = []
  for (let year = 2017; year <= currentYear; year++) {
    allKeys.forEach(key => {
      if (!graphStats.find(k => k.name === names[key])) {
        graphStats.push({ name: names[key], data: [] })
      }
      graphStats.find(k => k.name === names[key]).data.push(data[getFormattedYear(year, isAcademicYear)]?.[key] || 0)
    })
    years.push(getFormattedYear(year, isAcademicYear))
  }
  return { data: graphStats, years }
}

const makeTableStats = (data, showAll, isAcademicYear) => {
  if (!data) return null
  const currentYear = new Date().getFullYear()
  const tableStats = []
  for (let year = 2017; year <= currentYear; year++) {
    const yearData = data[getFormattedYear(year, isAcademicYear)]
    if (!yearData) continue
    const basic = yearData.basic || 0
    const openUni = yearData['open-uni'] || 0
    const exchange = yearData['incoming-exchange'] || 0
    const special = yearData.special || 0
    const other = yearData.other || 0
    const agreement = yearData.agreement || 0
    const transferred = yearData.transferred || 0
    const total = basic + openUni + special + other + agreement

    /* TODO: Other-category missing for now, clarify what go in that, and fix those */
    const yearStats = [
      getFormattedYear(year, isAcademicYear),
      Math.round(total),
      Math.round(basic),
      Math.round(openUni),
      Math.round(exchange),
      Math.round(transferred),
    ]
    if (showAll) yearStats.push(Math.round(special), Math.round(agreement))
    tableStats.push(yearStats)
  }
  const titles = ['', 'Total', 'Degree students', 'Open university', 'Exchange students', 'Transferred']
  if (showAll) titles.push('Special', 'Other university')
  return { data: tableStats, titles }
}

export const CreditsProduced = ({ data, secondData, academicYear }) => {
  const [showAll, setShowAll] = useState(false)
  if (!data) return null

  const tableStats = makeTableStats(data, showAll, academicYear)
  const creditGraphStats = makeGraphData(data, showAll, academicYear)

  const secondTableStats = secondData ? makeTableStats(secondData, showAll, academicYear) : null
  const secondCreditGraphStats = secondData ? makeGraphData(secondData, showAll, academicYear) : null

  return (
    <>
      <div>
        <Toggle
          cypress="showAllCreditsToggle"
          firstLabel="Show special categories"
          value={showAll}
          setValue={setShowAll}
        />
      </div>
      <div className="section-container">
        <StackedBarChart
          cypress="CreditsProducedByTheStudyprogramme"
          data={creditGraphStats.data}
          labels={creditGraphStats.years}
        />
        <DataTable cypress="CreditsProducedByTheStudyprogramme" data={tableStats.data} titles={tableStats.titles} />
      </div>
      {secondData && (
        <div>
          {' '}
          <h4>Credits produced by the licentiate programme</h4>
          <div className="section-container">
            <StackedBarChart
              cypress="CreditsProducedByTheStudyprogramme"
              data={secondCreditGraphStats.data}
              labels={secondCreditGraphStats.years}
            />
            <DataTable
              cypress="CreditsProducedByTheStudyprogramme"
              data={secondTableStats.data}
              titles={secondTableStats.titles}
            />
          </div>
        </div>
      )}
    </>
  )
}
