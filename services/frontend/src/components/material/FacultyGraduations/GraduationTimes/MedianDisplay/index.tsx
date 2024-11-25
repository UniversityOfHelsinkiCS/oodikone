import { Stack } from '@mui/material'
import { Message } from 'semantic-ui-react'

import { GraduationStats, NameWithCode } from '@/shared/types'
import { MedianBarChart } from './MedianBarChart'

export const MedianDisplay = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy,
  handleClick,
  level,
  levelProgrammeData,
  mode,
  programmeDataVisible,
  programmeNames,
  title,
  year,
  yearLabel,
}: {
  classSizes: {
    bachelor: Record<string, number>
    bcMsCombo: Record<string, number>
    master: Record<string, number>
    doctor: Record<string, number>
    programmes: Record<string, Record<string, number>>
  }
  data: GraduationStats[]
  goal: number
  goalExceptions: Record<string, number> & { needed: boolean }
  groupBy: 'byGradYear' | 'byStartYear'
  handleClick
  level: 'bachelor' | 'bcMsCombo' | 'master' | 'doctor'
  levelProgrammeData: Record<
    string,
    {
      data: GraduationStats[]
      programmes: string[]
    }
  >
  mode: 'faculty' | 'programme'
  programmeDataVisible: boolean
  programmeNames: Record<string, NameWithCode>
  title: 'Bachelor' | 'Bachelor + Master' | 'Master' | 'Doctor'
  year: number | null
  yearLabel: 'Graduation year' | 'Start year'
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
      <Stack direction={{ sm: 'column', md: 'row' }}>
        <MedianBarChart
          classSizes={classSizes?.[level]}
          data={data}
          goal={goal}
          handleClick={handleClick}
          mode={mode}
          programmeNames={programmeNames}
          title={title}
          yearLabel={yearLabel}
        />
        {!programmeDataVisible || !(year in levelProgrammeData) ? (
          <div className="graduations-message">
            <Message compact>Click a bar to view that year's {mode} level breakdown</Message>
          </div>
        ) : (
          <MedianBarChart
            classSizes={classSizes?.programmes}
            data={levelProgrammeData[year].data}
            facultyGraph={false}
            goal={goal}
            goalExceptions={goalExceptions}
            handleClick={handleClick}
            level={level}
            mode={mode}
            programmeNames={programmeNames}
            title={title}
            year={year}
            yearLabel={yearLabel}
          />
        )}
      </Stack>
    </div>
  )
}
