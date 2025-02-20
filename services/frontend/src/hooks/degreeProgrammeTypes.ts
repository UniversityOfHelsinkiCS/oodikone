import { useGetProgrammesQuery } from '@/redux/populations'

export const useDegreeProgrammeTypes = (programmeCodes: string[]) => {
  const { data: degreeProgrammes } = useGetProgrammesQuery()
  if (!degreeProgrammes) {
    return {} as Record<string, string | null>
  }

  return programmeCodes.reduce(
    (acc, programmeCode) => {
      acc[programmeCode] = degreeProgrammes[programmeCode]?.degreeProgrammeType ?? null
      return acc
    },
    {} as Record<string, string | null>
  )
}
