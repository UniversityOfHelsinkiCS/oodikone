import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Input, List, Label, Icon, Header, Confirm } from 'semantic-ui-react'
import { arrayOf, string, shape, func } from 'prop-types'

import { getTagsByStudytrackAction, createTagAction, deleteTagAction } from '../../../redux/tags'

const Tags = ({ createTag, deleteTag, getTagsByStudytrack, tags, studyprogramme }) => {
  const [tagname, setTagname] = useState('')
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    getTagsByStudytrack(studyprogramme)
  }, [])


  const open = () => setConfirm(true)

  const close = () => setConfirm(false)

  const handleDeleteTag = (event, tag) => {
    event.preventDefault()
    deleteTag(tag)
    setConfirm(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const newTag = {
      tagname,
      studytrack: studyprogramme
    }
    createTag(newTag)
    setTagname('')
  }

  const handleChange = ({ target }) => {
    setTagname(target.value)
  }

  const rows = tags.map(tag => (
    <List.Item key={tag.tag_id}>
      <List.Content>
        <Label>
          {tag.tagname} <Icon name="delete" link onClick={open} />
        </Label>
        <Confirm
          open={confirm}
          onCancel={close}
          onConfirm={event => handleDeleteTag(event, tag)}
          content={`Are you sure you want to delete tag "${tag.tagname}"? If you press confirm you will delete it from all students that have it. You and other users won't be able to use this tag again.`}
          cancelButton="Cancel"
          confirmButton="Confirm"
        />
      </List.Content>
    </List.Item >
  ))

  return (
    <List>
      <Input onChange={handleChange} value={tagname} />
      <Button onClick={handleSubmit}>add new tag</Button>
      <Header size="medium">Study programme tags</Header>
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
