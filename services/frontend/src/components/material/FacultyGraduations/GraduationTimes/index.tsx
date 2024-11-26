import { useState } from 'react'

import { Section } from '@/components/material/Section'
import { GraduationStats, NameWithCode } from '@/shared/types'
import { BreakdownDisplay } from './BreakdownDisplay'
import { MedianDisplay } from './MedianDisplay'

export const GraduationTimes = ({
  classSizes,
  data,
  facultyNames,
  goal,
  goalExceptions,
  groupBy,
  isError,
  isLoading,
  level,
  levelProgrammeData,
  mode,
  showMedian,
  title,
  yearLabel,
}: {
  classSizes:
    | {
        bachelor: Record<string, number>
        bcMsCombo: Record<string, number>
        master: Record<string, number>
        doctor: Record<string, number>
        programmes: {
          [code: string]: {
            bachelor: Record<string, number>
            bcMsCombo: Record<string, number>
            master: Record<string, number>
            doctor: Record<string, number>
          }
        }
      }
    | undefined
  data: GraduationStats[] | undefined
  facultyNames: Record<string, NameWithCode> | undefined
  goal: number | undefined
  goalExceptions: Record<string, number> | { needed: boolean }
  groupBy: 'byGradYear' | 'byStartYear'
  isError: boolean
  isLoading: boolean
  level: 'bachelor' | 'bcMsCombo' | 'master' | 'doctor'
  levelProgrammeData:
    | Record<
        number,
        {
          data: Array<GraduationStats & { code: string }>
          programmes: string[]
        }
      >
    | undefined
  mode: 'faculty' | 'programme'
  showMedian: boolean
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}) => {
  const [programmeDataVisible, setProgrammeDataVisible] = useState(false)
  const [year, setYear] = useState<number | null>(null)

  const handleClick = (event, isFacultyGraph: boolean, seriesCategory: number | null = null) => {
    if (isFacultyGraph) {
      setYear(seriesCategory ?? event.point.name)
      setProgrammeDataVisible(true)
    } else {
      setProgrammeDataVisible(false)
      setYear(null)
    }
  }

  const dataIsLoaded = classSizes && data && facultyNames && goal && levelProgrammeData

  return (
    <Section cypress={`${level}GraduationTimes`} isError={isError} isLoading={isLoading && !dataIsLoaded} title={title}>
      {showMedian && dataIsLoaded && (
        <MedianDisplay
          classSizes={classSizes}
          data={data}
          facultyNames={facultyNames}
          goal={goal}
          goalExceptions={goalExceptions}
          groupBy={groupBy}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          programmeDataVisible={programmeDataVisible}
          title={title}
          year={year}
          yearLabel={yearLabel}
        />
      )}
      {!showMedian && dataIsLoaded && (
        <BreakdownDisplay
          data={data}
          facultyNames={facultyNames}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          programmeDataVisible={programmeDataVisible}
          year={year}
          yearLabel={yearLabel}
        />
      )}
    </Section>
  )
}
