import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo } from 'react'

import { ExtendedCurriculumDetails, useCurriculumState } from '@/hooks/useCurriculums'
import { CurriculumOption } from '@oodikone/shared/types'

type CurriculumContextType = {
  curriculum: ExtendedCurriculumDetails | null
  curriculumList: CurriculumOption[]
  setSelectedCurriculum: Dispatch<SetStateAction<CurriculumOption | null>>
}

const CurriculumContext = createContext<CurriculumContextType | null>(null)
CurriculumContext.displayName = 'Curriculum'

export const CurriculumProvider = ({
  programmeCode,
  year,
  children,
}: {
  programmeCode: string
  year: string | number | undefined
  children: ReactNode
}) => {
  const [curriculum, curriculumList, setSelectedCurriculum] = useCurriculumState(programmeCode, year)
  const value = useMemo(
    () => ({ curriculum, curriculumList, setSelectedCurriculum }),
    [curriculum, curriculumList, setSelectedCurriculum]
  )

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>
}

/** Context variant of the curriculum hook */
export const useCurriculum = () => {
  const context = useContext(CurriculumContext)
  if (!context) {
    throw new Error('useCurriculum must be used within a CurriculumProvider')
  }
  return context
}
