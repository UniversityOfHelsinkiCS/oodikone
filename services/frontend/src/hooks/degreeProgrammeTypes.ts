import { useGetProgrammesQuery } from '@/redux/populations'

export const useDegreeProgrammeTypes = (programmeCodes: string[]) => {
  const { data: degreeProgrammes } = useGetProgrammesQuery({})
  if (!degreeProgrammes) {
    return {}
  }

  return programmeCodes.reduce((acc, programmeCode) => {
    acc[programmeCode] = degreeProgrammes[programmeCode]?.degreeProgrammeType ?? null
    return acc
  }, {})
}
