import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Input, List } from 'semantic-ui-react'
import { arrayOf, string, shape, func } from 'prop-types'

import { getTagsByStudytrackAction, createTagAction, deleteTagAction } from '../../../redux/tags'

const Tags = ({ createTag, deleteTag, getTagsByStudytrack, tags, studyprogramme }) => {
  const [tagname, setTagname] = useState('')

  useEffect(() => {
    getTagsByStudytrack(studyprogramme)
  }, [])

  const handleDeleteTag = (tag) => {
    deleteTag(tag)
    getTagsByStudytrack(studyprogramme)
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
    getTagsByStudytrack(studyprogramme)
  }

  const handleChange = ({ target }) => {
    setTagname(target.value)
  }

  const rows = tags.map(tag => (
    <List.Item divided verticalAlign="middle" key={tag.tag_id}>
      <List.Content>
        <List.Header>Tag name</List.Header>
        {tag.tagname} {deleteButton(tag)}
      </List.Content>
    </List.Item >
  ))

  return (
    <List>
      <Input onChange={handleChange} value={tagname} />
      <Button onClick={handleSubmit}>add new tag</Button>
      {rows}
    </List>
  )
}

const mapStateToProps = ({ tags }) => ({
  tags: tags.data
})

Tags.propTypes = {
  getTagsByStudytrack: func.isRequired,
  createTag: func.isRequired,
  deleteTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studyprogramme: string.isRequired
}

export default withRouter(connect(mapStateToProps, { createTag: createTagAction, deleteTag: deleteTagAction, getTagsByStudytrack: getTagsByStudytrackAction })(Tags))
