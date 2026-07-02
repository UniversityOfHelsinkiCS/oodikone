import { useMemo, useState } from 'react'

import { BreakdownDisplay } from '@/components/GraduationTimes/BreakdownDisplay'
import { MedianDisplay } from '@/components/GraduationTimes/MedianDisplay'
import { Section } from '@/components/Section'
import {
  ClassSizes,
  GraduationStats,
  Name,
  NameWithCode,
  ProgrammeClassSizes,
  ProgrammeMedians,
} from '@oodikone/shared/types'

export type GraduationView = 'breakdown' | 'median' | 'average'
export type GraduationTimesProps = {
  mode: 'faculty' | 'programme' | 'study track' // "Mode" is one step below the current view in hierarchy e.g. viewing a programme overview -> mode should be study track
  classSizes?: ClassSizes | ProgrammeClassSizes | undefined
  data: GraduationStats[] | undefined
  goal?: number | undefined
  goalExceptions?: Record<string, number> | { needed: boolean }
  groupBy?: 'byGradYear' | 'byStartYear'
  allowExpand?: boolean
  isLoading: boolean
  isError: boolean
  level?: 'unset' | 'bachelor' | 'master' | 'bcMsCombo' | 'doctor'
  levelProgrammeData?: ProgrammeMedians
  names?: Record<string, Name | NameWithCode> | Record<string, string | Name>
  view: GraduationView
  title: string
  yearLabel: 'Graduation year' | 'Start year'
}

export const GraduationTimes = ({
  classSizes,
  data,
  goal,
  goalExceptions = { needed: false },
  groupBy = 'byStartYear',
  allowExpand = true,
  isLoading,
  isError,
  level = 'unset',
  levelProgrammeData,
  mode,
  names,
  view,
  title,
  yearLabel,
}: GraduationTimesProps) => {
  const [programmeDataVisible, setProgrammeDataVisible] = useState(false)
  const [expandKey, setExpandKey] = useState<string>('')

  const handleClick = (category: string) => {
    if (category) {
      setExpandKey(category)
      setProgrammeDataVisible(true)
    } else {
      setProgrammeDataVisible(false)
      setExpandKey('')
    }
  }

  // Keys are either years e.g. "2025" or year ranges "2025 - 2026"
  const sortedData = useMemo(
    () => data?.toSorted((a, b) => Number(b.name.slice(0, 4)) - Number(a.name.slice(0, 4))),
    [data]
  )

  return (
    <Section cypress={`${level}-graduation-times`} isError={isError} isLoading={isLoading} title={title}>
      {view === 'breakdown' && (
        <BreakdownDisplay
          allowExpand={allowExpand}
          data={sortedData!}
          expandKey={expandKey}
          handleClick={handleClick}
          level={level}
          levelProgrammeData={levelProgrammeData}
          mode={mode}
          names={names}
          programmeDataVisible={programmeDataVisible}
          yearLabel={yearLabel}
        />
      )}
      {view === 'median' && (
        <MedianDisplay
          allowExpand={allowExpand}
          classSizes={classSizes}
          data={sortedData!}
          expandKey={expandKey}
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
          variant="median"
          yearLabel={yearLabel}
        />
      )}
      {view === 'average' && (
        <MedianDisplay
          allowExpand={allowExpand}
          classSizes={classSizes}
          data={sortedData!}
          expandKey={expandKey}
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
          variant="average"
          yearLabel={yearLabel}
        />
      )}
    </Section>
  )
}
