import React, { useEffect, useState } from 'react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/curriculum'
import { CurriculumOption, CurriculumDetails } from '@oodikone/shared/types'

type ExtendedCurriculumDetails = CurriculumDetails & { id: string; version: string[] }

export const useCurriculumState = (
  programmeCode: string,
  year: string
): [
  ExtendedCurriculumDetails | null,
  CurriculumOption[],
  React.Dispatch<React.SetStateAction<CurriculumOption | null>>,
] => {
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
      setCurriculum({ ...curriculumData, id: chosenCurriculum.id, version: chosenCurriculum.periodIds })
    }
  }, [curriculumData, chosenCurriculum])

  return [curriculum, curriculumList, setSelectedCurriculum]
}
