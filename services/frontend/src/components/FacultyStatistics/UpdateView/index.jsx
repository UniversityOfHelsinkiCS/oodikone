import React, { useState } from 'react'
import { Button, Icon, Loader } from 'semantic-ui-react'
import { useUpdateFacultyBasicViewQuery } from '../../../redux/facultyStats'

const getStatusIcon = stats => {
  if (stats.isLoading) return <Loader active />
  if (stats.isSuccess) return <Icon name="check" color="green" />
  if (stats.isError) return <Icon name="close" color="red" />
  return ''
}

const UpdateView = ({ faculty }) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const basicTabStats = useUpdateFacultyBasicViewQuery({ id: faculty }, { skip: skipBasic })

  return (
    <div className="update-view">
      <div className="button-container">
        <h4>Update data on Basic information -view</h4>
        <p>
          <i>(For large faculties this can take a couple of minutes)</i>
        </p>
        <Button disabled={basicTabStats.isLoading} color="blue" onClick={() => setSkipBasic(false)}>
          Update
        </Button>
        {getStatusIcon(basicTabStats)}
      </div>
    </div>
  )
}

export default UpdateView
