import { useState } from 'react'

import { Section } from '@/components/material/Section'
import { GraduationStats, NameWithCode } from '@/shared/types'
import { BreakdownDisplay } from './BreakdownDisplay'
import { MedianDisplay } from './MedianDisplay'

export const GraduationTimes = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy,
  level,
  levelProgrammeData,
  mode,
  programmeNames,
  showMedian,
  title,
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
  level: 'bachelor' | 'bcMsCombo' | 'master' | 'doctor'
  levelProgrammeData: Record<
    number,
    {
      data: GraduationStats[]
      programmes: string[]
    }
  >
  mode: 'faculty' | 'programme'
  programmeNames: Record<string, NameWithCode>
  showMedian: boolean
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  const [programmeDataVisible, setProgrammeDataVisible] = useState(false)
  const [year, setYear] = useState<number | null>(null)

  if (!data) {
    return null // TODO: Use isLoading and isError instead
  }

  const handleClick = (event, isFacultyGraph: boolean, seriesCategory = null) => {
    if (isFacultyGraph) {
      setYear(seriesCategory ?? event.point.name)
      setProgrammeDataVisible(true)
    } else {
      setProgrammeDataVisible(false)
      setYear(null)
    }
  }

  return (
    <Section cypress={`section-${level}`} title={title}>
      {showMedian ? (
        <MedianDisplay
          classSizes={classSizes}
          data={data}
          goal={goal}
          goalExceptions={goalExceptions}
          groupBy={groupBy}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          programmeDataVisible={programmeDataVisible}
          programmeNames={programmeNames}
          title={title}
          year={year}
          yearLabel={yearLabel}
        />
      ) : (
        <BreakdownDisplay
          data={data}
          handleClick={handleClick}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          programmeDataVisible={programmeDataVisible}
          programmeNames={programmeNames}
          year={year}
          yearLabel={yearLabel}
        />
      )}
    </Section>
  )
}
