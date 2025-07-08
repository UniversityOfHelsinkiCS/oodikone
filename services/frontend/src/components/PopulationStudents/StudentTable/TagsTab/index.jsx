import CircularProgress from '@mui/material/CircularProgress'
import { Link } from 'react-router'
import { Tab } from 'semantic-ui-react'

import { TagList } from '@/components/TagList'
import { TagPopulation } from '@/components/TagPopulation'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'

export const TagsTab = ({ programme, combinedProgramme, students }) => {
  const correctCode = combinedProgramme ? `${programme}+${combinedProgramme}` : programme
  const { data: tags, isFetching } = useGetTagsByStudyTrackQuery(correctCode, { skip: !correctCode })

  if (isFetching) return <CircularProgress />

  return (
    <Tab.Pane>
      <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
        {!tags?.length && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              minHeight: '300px',
              paddingLeft: '10px',
              width: '100%',
            }}
          >
            <h3>
              No tags defined. You can define them{' '}
              <Link onClick={() => {}} to={`/study-programme/${correctCode}?tab=4`}>
                here
              </Link>
              .
            </h3>
          </div>
        )}
        {tags?.length > 0 && (
          <>
            <TagPopulation
              combinedProgramme={combinedProgramme}
              programme={programme}
              selectedStudents={students.map(student => student.studentNumber)}
              tags={tags}
            />
            <TagList
              combinedProgramme={combinedProgramme}
              programme={programme}
              selectedStudents={students}
              tags={tags}
            />
          </>
        )}
      </div>
    </Tab.Pane>
  )
}
