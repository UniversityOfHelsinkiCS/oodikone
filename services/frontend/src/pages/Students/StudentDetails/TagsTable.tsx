import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { sortBy } from 'lodash'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Link } from '@/components/material/Link'
import { Section } from '@/components/material/Section'
import { StyledTable } from '@/components/material/StyledTable'
import { Name } from '@oodikone/shared/types'
import { StudentPageStudent } from '@oodikone/shared/types/studentData'

type Tag = {
  programme: {
    code: string
    name: Name
  }
  tags: {
    id: string
    tagName: string
    userId: string | null
  }[]
}

export const TagsTable = ({ student }: { student: StudentPageStudent }) => {
  const { getTextIn } = useLanguage()

  const tagData: Tag[] = []

  for (const tag of student.tags) {
    const tagsForProgramme = tagData.find(({ programme }) => programme.code === tag.programme?.code)
    const parsedTag = { userId: tag.tag.personal_user_id, tagName: tag.tag.tagname, id: tag.tagId }

    if (tagsForProgramme) {
      tagsForProgramme.tags.push(parsedTag)
    } else if (tag.programme) {
      tagData.push({ programme: tag.programme, tags: [parsedTag] })
    }
  }

  if (tagData.length === 0) {
    return null
  }

  return (
    <Section
      infoBoxContent="Personal tags have a purple background, while shared tags have a gray background. You can view or create tags by clicking the programme name."
      title="Tags"
    >
      <StyledTable showCellBorders>
        <TableHead>
          <TableRow>
            <TableCell>Programme</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Tags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tagData.map(({ programme, tags }) => (
            <TableRow key={programme.code}>
              <TableCell>
                <Link target="_blank" to={`/study-programme/${programme.code}?tab=4`}>
                  {getTextIn(programme.name)}
                </Link>
              </TableCell>
              <TableCell>{programme.code}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {sortBy(tags, 'tagName').map(tag => (
                    <Chip color={tag.userId ? 'secondary' : 'default'} key={tag.id} label={tag.tagName} />
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </Section>
  )
}
