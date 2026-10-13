import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo } from 'react'

import { ExtendedCurriculumDetails, useCurriculumState } from '@/hooks/useCurriculums'
import { CurriculumOption } from '@oodikone/shared/types'

type CurriculumContextType = {
  curriculum: ExtendedCurriculumDetails | null
  curriculumList: CurriculumOption[]
  setSelectedCurriculum: Dispatch<SetStateAction<CurriculumOption | null>>
  /** The curriculum list or the selected curriculum is being loaded for the first time */
  isLoading: boolean
  isError: boolean
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
  const [curriculum, curriculumList, setSelectedCurriculum, { isLoading, isError }] = useCurriculumState(
    programmeCode,
    year
  )
  const value = useMemo(
    () => ({ curriculum, curriculumList, setSelectedCurriculum, isLoading, isError }),
    [curriculum, curriculumList, setSelectedCurriculum, isLoading, isError]
  )

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>
}

/** Context-aware variant of the curriculum hook. Use this in population statistics views. */
export const useCurriculum = () => {
  const context = useContext(CurriculumContext)
  if (!context) {
    throw new Error('useCurriculum must be used within a CurriculumProvider')
  }
  return context
}
