import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Input } from 'semantic-ui-react'
import { arrayOf, string, shape, func } from 'prop-types'

import { getTagsAction, createTagAction, deleteTagAction } from '../../../redux/tags'

const Tags = ({ createTag, deleteTag, getTags, tags, studyprogramme }) => {
  const [tagname, setTagname] = useState('')

  useEffect(() => {
    getTags()
  }, [])

  const handleDeleteTag = (tag) => {
    deleteTag(tag)
    getTags()
  }

  const deleteButton = tag => (
    <Button onClick={() => handleDeleteTag(tag)}>
      Delete
    </Button>
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    const newTag = {
      tagname,
      studytrack: studyprogramme
    }
    createTag(newTag)
    setTagname('')
    getTags()
  }

  const handleChange = ({ target }) => {
    setTagname(target.value)
  }

  const rows = tags.map(tag => <div key={tag.tag_id}>tag: {tag.tagname}, studytrack: {tag.studytrack} {deleteButton(tag)}</div>)

  return (
    <div>
      <Input onChange={handleChange} value={tagname} />
      <Button onClick={handleSubmit}>submit me</Button>
      {rows}
    </div>
  )
}

const mapStateToProps = ({ tags }) => ({
  tags: tags.data
})

Tags.propTypes = {
  getTags: func.isRequired,
  createTag: func.isRequired,
  deleteTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studyprogramme: string.isRequired
}

export default withRouter(connect(mapStateToProps, { getTags: getTagsAction, createTag: createTagAction, deleteTag: deleteTagAction })(Tags))
