import { Link } from 'react-router'
import { Tab } from 'semantic-ui-react'

import { TagList } from '@/components/TagList'
import { TagPopulation } from '@/components/TagPopulation'

export const TagsTab = ({ combinedProgramme, mainProgramme, programmeForTagsLink, students, tags }) => {
  return (
    <Tab.Pane>
      <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
        {tags.length === 0 && (
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
              <Link onClick={() => {}} to={`/study-programme/${programmeForTagsLink}?p_m_tab=0&p_tab=4`}>
                here
              </Link>
              .
            </h3>
          </div>
        )}
        {tags.length > 0 && (
          <>
            <TagPopulation
              combinedProgramme={combinedProgramme}
              mainProgramme={mainProgramme}
              selectedStudents={students.map(student => student.studentNumber)}
              tags={tags}
            />
            <TagList combinedProgramme={combinedProgramme} mainProgramme={mainProgramme} selectedStudents={students} />
          </>
        )}
      </div>
    </Tab.Pane>
  )
}
