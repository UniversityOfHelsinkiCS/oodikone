import { List, Stack, Typography } from '@mui/material'

import { Section } from '@/components/material/Section'
import { Tag } from '@/shared/types'
import { TagItem } from './TagItem'

export const TagsSection = ({
  combinedProgramme,
  studyProgramme,
  studyTrack,
  tags,
}: {
  combinedProgramme: string
  studyProgramme: string
  studyTrack: string
  tags: Tag[]
}) => {
  return (
    <Section title="Tags">
      {tags.length === 0 ? (
        <Typography color="text.secondary">This study programme does not have any tags yet</Typography>
      ) : (
        <Stack gap={1}>
          <Typography>Tags associated with this study programme</Typography>
          <List>
            {tags.map(tag => (
              <TagItem
                combinedProgramme={combinedProgramme}
                key={tag.id}
                studyProgramme={studyProgramme}
                studyTrack={studyTrack}
                tag={tag}
              />
            ))}
          </List>
        </Stack>
      )}
    </Section>
  )
}
