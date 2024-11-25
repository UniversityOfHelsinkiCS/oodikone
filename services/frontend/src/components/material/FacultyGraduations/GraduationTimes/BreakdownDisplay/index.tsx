import { Message } from 'semantic-ui-react'

import { GraduationStats, NameWithCode } from '@/shared/types'
import { BreakdownBarChart } from './BreakdownBarChart'

export const BreakdownDisplay = ({
  data,
  handleClick,
  levelProgrammeData,
  mode,
  programmeDataVisible,
  programmeNames,
  year,
  yearLabel,
}: {
  data: GraduationStats[]
  handleClick: () => void
  levelProgrammeData: Record<
    number,
    {
      data: GraduationStats[]
      programmes: string[]
    }
  >
  mode: 'faculty' | 'programme'
  programmeDataVisible: boolean
  programmeNames: Record<string, NameWithCode>
  year: number | null
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  return (
    <div>
      <div className="graduations-chart-container">
        <BreakdownBarChart data={data} handleClick={handleClick} mode={mode} />
        {!programmeDataVisible || !(year in levelProgrammeData) ? (
          <Message compact>Click a bar to view that year's {mode} level breakdown</Message>
        ) : (
          <BreakdownBarChart
            data={levelProgrammeData[year].data}
            facultyGraph={false}
            handleClick={handleClick}
            mode={mode}
            programmeNames={programmeNames}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </div>
    </div>
  )
}
