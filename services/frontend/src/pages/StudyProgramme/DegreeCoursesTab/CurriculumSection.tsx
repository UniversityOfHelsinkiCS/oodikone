import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { CurriculumPicker } from '@/components/material/CurriculumPicker'
import { Section } from '@/components/material/Section'

export const CurriculumSection = ({ curriculum, curriculumList, setCurriculum }) => {
  return (
    <Section cypress="curriculum" title="Curriculum">
      <Stack alignItems="center" direction="row" gap={1}>
        <Typography>Select curriculum to edit:</Typography>
        <CurriculumPicker curriculum={curriculum} curriculumList={curriculumList} setCurriculum={setCurriculum} />
      </Stack>
    </Section>
  )
}
