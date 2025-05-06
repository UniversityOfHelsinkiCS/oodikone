import { useState } from 'react'

import { Section } from '@/components/material/Section'
import {
  FacultyClassSizes,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
  ProgrammeMedians,
} from '@oodikone/shared/types'
import { BreakdownDisplay } from './BreakdownDisplay'
import { MedianDisplay } from './MedianDisplay'

export const GraduationTimes = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy = 'byStartYear',
  isError,
  isLoading,
  level,
  levelProgrammeData,
  mode,
  names,
  showMedian,
  title,
  yearLabel,
}: {
  classSizes?: FacultyClassSizes | ProgrammeClassSizes
  data: GraduationStats[] | undefined
  goal: number | undefined
  goalExceptions: Record<string, number> | { needed: boolean }
  groupBy?: 'byGradYear' | 'byStartYear'
  isError: boolean
  isLoading: boolean
  level: string
  levelProgrammeData?: ProgrammeMedians
  mode: 'faculty' | 'programme' | 'study track'
  names?: Record<string, Name | NameWithCode> | Record<string, string | Name>
  showMedian: boolean
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  const [programmeDataVisible, setProgrammeDataVisible] = useState(false)
  const [year, setYear] = useState<number | null>(null)

  const handleClick = (event, isFacultyGraph: boolean, seriesCategory: number | string | null = null) => {
    if (isFacultyGraph) {
      setYear(seriesCategory ?? event.point.name)
      setProgrammeDataVisible(true)
    } else {
      setProgrammeDataVisible(false)
      setYear(null)
    }
  }

  const dataIsLoaded = classSizes && data && names && goal && levelProgrammeData

  return (
    <Section
      cypress={`${level}-graduation-times`}
      isError={isError}
      isLoading={isLoading && !dataIsLoaded}
      title={title}
    >
      {showMedian && dataIsLoaded && (
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
          names={names}
          programmeDataVisible={programmeDataVisible}
          title={title}
          year={year}
          yearLabel={yearLabel}
        />
      )}
      {!showMedian && dataIsLoaded && (
        <BreakdownDisplay
          data={data}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          names={names}
          programmeDataVisible={programmeDataVisible}
          year={year}
          yearLabel={yearLabel}
        />
      )}
    </Section>
  )
}
