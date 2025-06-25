import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { CurriculumPicker } from '@/components/material/CurriculumPicker'
import { Section } from '@/components/material/Section'

export const CurriculumSection = ({
  programmeCode,
  setCurriculum,
  year,
}: {
  programmeCode: string
  setCurriculum: (curriculum: any) => void
  year: string
}) => {
  return (
    <Section cypress="curriculum" title="Curriculum">
      <Stack alignItems="center" direction="row" gap={1}>
        <Typography>Select curriculum to edit:</Typography>
        <CurriculumPicker programmeCode={programmeCode} setCurriculum={setCurriculum} year={year} />
      </Stack>
    </Section>
  )
}
