import { useState } from 'react'
import { Radio } from 'semantic-ui-react'

import { DataTable } from '@/pages/StudyProgramme/BasicInformationTab/DataTable'
import { StackedBarChart } from '@/pages/StudyProgramme/BasicInformationTab/StackedBarChart'

const getFormattedYear = (year, academicYear) => (academicYear ? `${year} - ${year + 1}` : `${year}`)

export const makeGraphData = (data, showAll, isAcademicYear) => {
  if (!data) return null
  const allKeys = [
    ...new Set(
      Object.keys(data)
        .flatMap(year => Object.keys(data[year]))
        .filter(key => key !== 'total' && key !== 'other')
        .filter(key => showAll || !['agreement', 'separate'].includes(key))
    ),
  ]
  const names = {
    agreement: 'Other university',
    separate: 'Separate studies',
    basic: 'Degree students',
    'open-uni': 'Open university',
    transferred: 'Transferred',
    'incoming-exchange': 'Exchange students',
  }
  const years = []
  const graphStats = []
  const today = new Date()
  const latestYear = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()
  for (let year = 2017; year <= latestYear; year++) {
    allKeys.forEach(key => {
      if (!graphStats.find(k => k.name === names[key])) {
        graphStats.push({ name: names[key], data: [] })
      }
      graphStats.find(k => k.name === names[key]).data.push(data[getFormattedYear(year, isAcademicYear)]?.[key] || 0)
    })
    years.push(getFormattedYear(year, isAcademicYear))
  }
  graphStats.sort((a, b) => a.name.localeCompare(b.name))
  return { data: graphStats, years }
}

export const makeTableStats = (data, showAll, isAcademicYear) => {
  if (!data) return null
  const currentYear = new Date().getFullYear()
  const tableStats = []
  for (let year = currentYear - (isAcademicYear && new Date().getMonth() < 7 ? 1 : 0); year >= 2017; year--) {
    const yearData = data[getFormattedYear(year, isAcademicYear)]
    const basic = yearData?.basic || 0
    const openUni = yearData?.['open-uni'] || 0
    const exchange = yearData?.['incoming-exchange'] || 0
    const separate = yearData?.separate || 0
    const agreement = yearData?.agreement || 0
    const transferred = yearData?.transferred || 0
    const total = basic + openUni + exchange + separate + agreement

    /* TODO: Other-category missing for now, clarify what go in that, and fix those */
    const yearStats = [
      getFormattedYear(year, isAcademicYear),
      Math.round(total),
      Math.round(basic),
      Math.round(exchange),
      Math.round(openUni),
      Math.round(transferred),
    ]
    if (showAll) yearStats.splice(5, 0, Math.round(agreement), Math.round(separate))
    tableStats.push(yearStats)
  }
  const titles = ['Code', 'Total', 'Degree students', 'Exchange students', 'Open university', 'Transferred']
  if (showAll) titles.splice(5, 0, 'Other university', 'Separate')
  return { data: tableStats, titles }
}

export const CreditsProduced = ({ academicYear, data, secondData }) => {
  const [showAll, setShowAll] = useState(false)
  if (!data) return null

  const tableStats = makeTableStats(data, showAll, academicYear)
  const creditGraphStats = makeGraphData(data, showAll, academicYear)

  const secondTableStats = secondData ? makeTableStats(secondData, showAll, academicYear) : null
  const secondCreditGraphStats = secondData ? makeGraphData(secondData, showAll, academicYear) : null

  return (
    <>
      <div className="original-toggle-container">
        <Radio checked={showAll} label="Show special categories" onChange={() => setShowAll(!showAll)} toggle />
      </div>
      <div className="section-container">
        <StackedBarChart
          cypress="CreditsProducedByTheStudyProgramme"
          data={creditGraphStats.data}
          labels={creditGraphStats.years}
        />
        <DataTable cypress="CreditsProducedByTheStudyProgramme" data={tableStats.data} titles={tableStats.titles} />
      </div>
      {secondData && (
        <div>
          <h4>Credits produced by the licentiate programme</h4>
          <div className="section-container">
            <StackedBarChart
              cypress="CreditsProducedByTheStudyProgramme"
              data={secondCreditGraphStats.data}
              labels={secondCreditGraphStats.years}
            />
            <DataTable
              cypress="CreditsProducedByTheStudyProgramme"
              data={secondTableStats.data}
              titles={secondTableStats.titles}
            />
          </div>
        </div>
      )}
    </>
  )
}
