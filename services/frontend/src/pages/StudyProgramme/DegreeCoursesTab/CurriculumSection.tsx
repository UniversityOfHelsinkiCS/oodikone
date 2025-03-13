import { Stack, Typography } from '@mui/material'

import { CurriculumPicker } from '@/components/material/CurriculumPicker'
import { Section } from '@/components/material/Section'

export const CurriculumSection = ({
  programmeCodes,
  setCurriculum,
  year,
}: {
  programmeCodes: string[]
  setCurriculum: (curriculum: any) => void
  year: string
}) => {
  return (
    <Section title="Curriculum">
      <Stack alignItems="center" direction="row" gap={1}>
        <Typography>Select curriculum to edit:</Typography>
        <CurriculumPicker programmeCodes={programmeCodes} setCurriculum={setCurriculum} year={year} />
      </Stack>
    </Section>
  )
}
