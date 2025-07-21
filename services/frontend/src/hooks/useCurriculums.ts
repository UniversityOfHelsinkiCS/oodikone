import { useEffect, useState, Dispatch, SetStateAction } from 'react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/curriculum'
import { CurriculumOption, CurriculumDetails } from '@oodikone/shared/types'

export type ExtendedCurriculumDetails = CurriculumDetails & CurriculumOption

export const useCurriculumState = (
  programmeCode: string,
  year: string | number
): [ExtendedCurriculumDetails | null, CurriculumOption[], Dispatch<SetStateAction<CurriculumOption | null>>] => {
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumOption | null>(null)
  const [curriculum, setCurriculum] = useState<ExtendedCurriculumDetails | null>(null)

  const { data: curriculumList = [], isFetching: curriculumsLoading } = useGetCurriculumOptionsQuery(
    { code: programmeCode },
    { skip: !programmeCode }
  )

  const chosenCurriculum: CurriculumOption | null =
    selectedCurriculum ??
    curriculumList.find(curriculum => new Date(curriculum.validFrom) <= new Date(`${year}-08-01`)) ??
    curriculumList[0] ??
    null

  const { data: curriculumData } = useGetCurriculumsQuery(
    {
      code: programmeCode,
      periodIds: chosenCurriculum?.periodIds,
    },
    { skip: curriculumsLoading || !chosenCurriculum?.periodIds }
  )

  useEffect(() => {
    if (curriculumData) {
      setCurriculum({ ...curriculumData, ...chosenCurriculum })
    }
  }, [curriculumData, chosenCurriculum])

  return [curriculum, curriculumList, setSelectedCurriculum]
}
