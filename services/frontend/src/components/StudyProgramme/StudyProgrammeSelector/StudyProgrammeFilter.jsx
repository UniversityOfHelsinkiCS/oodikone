import React from 'react'
import { Form, FormField, FormInput } from 'semantic-ui-react'

export const StudyProgrammeFilter = ({ handleFilterChange, studyProgrammes }) => {
  if (studyProgrammes.length <= 10) return null

  return (
    <Form>
      <FormField>
        <label style={{ marginBottom: '10px' }}>Filter programmes</label>
        <FormInput
          onChange={event => handleFilterChange(event.target.value)}
          placeholder="Type here to filter study programmes"
        />
      </FormField>
    </Form>
  )
}
