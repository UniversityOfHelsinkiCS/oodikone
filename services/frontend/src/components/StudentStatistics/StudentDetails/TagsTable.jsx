import React, { Fragment } from 'react'
import { shape, string } from 'prop-types'
import { Label, Header } from 'semantic-ui-react'
import { sortBy } from 'lodash'
import { getTextIn } from '../../../common'

import SortableTable from '../../SortableTable'

const TagsTable = ({ student, language }) => {
  if (!student) return null

  const data = Object.values(
    student.tags.reduce((acc, t) => {
      if (!acc[t.programme.code]) acc[t.programme.code] = { programme: t.programme, tags: [] }
      acc[t.tag.studytrack].tags.push(t)
      return acc
    }, {})
  )
  if (data.length === 0) return null
  return (
    <>
      <Header content="Tags" />
      <SortableTable
        data={data}
        columns={[
          {
            key: 'PROGRAMME',
            title: 'Programme',
            getRowVal: t => getTextIn(t.programme.name, language),
          },
          {
            key: 'CODE',
            title: 'Code',
            getRowVal: t => t.programme.code,
          },
          {
            key: 'TAGS',
            title: 'Tags',
            getRowVal: t => sortBy(t.tags.map(tt => tt.tag.tagname)).join(':'),
            getRowContent: t =>
              sortBy(t.tags, t => t.tag.tagname).map(t => (
                <Label key={t.tag.tag_id} content={t.tag.tagname} color={t.tag.personal_user_id ? 'purple' : null} />
              )),
          },
        ]}
      />
    </>
  )
}

TagsTable.propTypes = {
  student: shape({}).isRequired,
  language: string.isRequired,
}

export default TagsTable
