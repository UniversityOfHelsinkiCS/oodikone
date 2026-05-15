import { useState } from 'react'

import { BreakdownDisplay } from '@/components/GraduationTimes/BreakdownDisplay'
import { MedianDisplay } from '@/components/GraduationTimes/MedianDisplay'
import { Section } from '@/components/Section'
import {
  FacultyClassSizes,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
  ProgrammeMedians,
} from '@oodikone/shared/types'

export type GraduationTimesProps = {
  mode: 'faculty' | 'programme' | 'study track'
  classSizes?: FacultyClassSizes | ProgrammeClassSizes | undefined
  data: GraduationStats[] | undefined
  goal: number | undefined
  goalExceptions: Record<string, number> | { needed: boolean }
  groupBy?: 'byGradYear' | 'byStartYear'
  allowExpand?: boolean
  isLoading: boolean
  isError: boolean
  level: string
  levelProgrammeData?: ProgrammeMedians
  names?: Record<string, Name | NameWithCode> | Record<string, string | Name>
  showMedian: boolean
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}

export const GraduationTimes = ({
  classSizes,
  data,
  goal,
  goalExceptions,
  groupBy = 'byStartYear',
  allowExpand = true,
  isLoading,
  isError,
  level,
  levelProgrammeData,
  mode,
  names,
  showMedian,
  title,
  yearLabel,
}: GraduationTimesProps) => {
  const [programmeDataVisible, setProgrammeDataVisible] = useState(false)
  const [expandKey, setExpandKey] = useState<string | null>(null)

  const handleClick = (category: string) => {
    if (category) {
      setExpandKey(category)
      setProgrammeDataVisible(true)
    } else {
      setProgrammeDataVisible(false)
      setExpandKey(null)
    }
  }

  return (
    <Section
      cypress={`${level}-graduation-times`}
      isError={isError}
      title={title}
      isLoading={isLoading}
    >
      {!showMedian ? (
        <BreakdownDisplay
          allowExpand={allowExpand}
          data={data!}
          expandKey={expandKey}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          names={names}
          programmeDataVisible={programmeDataVisible}
          yearLabel={yearLabel}
        />
      ) : (
        <MedianDisplay
          allowExpand={allowExpand}
          classSizes={classSizes}
          data={data!}
          goal={goal}
          goalExceptions={goalExceptions}
          groupBy={groupBy}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          names={names ?? {}}
          programmeDataVisible={programmeDataVisible}
          title={title}
          expandKey={expandKey}
          yearLabel={yearLabel}
        />
      )}
    </Section>
  )
}
