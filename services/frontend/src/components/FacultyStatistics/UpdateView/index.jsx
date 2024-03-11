import React, { useState } from 'react'
import { Button, Icon, Loader } from 'semantic-ui-react'

import { useUpdateFacultyBasicViewQuery, useUpdateFacultyProgressViewQuery } from '@/redux/facultyStats'

const getStatusIcon = stats => {
  if (stats.isLoading) return <Loader active />
  if (stats.isSuccess) return <Icon color="green" name="check" />
  if (stats.isError) return <Icon color="red" name="close" />
  return ''
}

export const UpdateView = ({ faculty }) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const [skipCredits, setSkipCredits] = useState(true)
  const [skipThesis, setSkipThesis] = useState(true)
  const [skipProgressTab, setSkipProgressTab] = useState(true)
  const basicBasicTabStats = useUpdateFacultyBasicViewQuery({ id: faculty, statsType: 'STUDENT' }, { skip: skipBasic })

  const creditsBasicTabStats = useUpdateFacultyBasicViewQuery(
    { id: faculty, statsType: 'CREDITS' },
    { skip: skipCredits }
  )
  const thesisBasicTabStats = useUpdateFacultyBasicViewQuery({ id: faculty, statsType: 'THESIS' }, { skip: skipThesis })
  const progressViewStats = useUpdateFacultyProgressViewQuery({ id: faculty }, { skip: skipProgressTab })
  return (
    <div className="update-view">
      <div className="button-container">
        <h3>Update data in Basic information -tab</h3>
        <p>
          <i>(For large faculties updates can take a couple of minutes)</i>
        </p>
        <h4>Update students data on Basic information -view</h4>
        <Button color="blue" disabled={basicBasicTabStats.isLoading} onClick={() => setSkipBasic(false)}>
          Update
        </Button>
        {getStatusIcon(basicBasicTabStats)}
        <h4>Update credits data on Basic information -view</h4>
        <Button color="blue" disabled={creditsBasicTabStats.isLoading} onClick={() => setSkipCredits(false)}>
          Update
        </Button>
        {getStatusIcon(creditsBasicTabStats)}
        <h4>Update thesiswriters data on Basic information -view</h4>
        <Button color="blue" disabled={thesisBasicTabStats.isLoading} onClick={() => setSkipThesis(false)}>
          Update
        </Button>
        {getStatusIcon(thesisBasicTabStats)}
        <h3>Update data in Progress and student populations -tab</h3>
        <Button color="blue" disabled={progressViewStats.isLoading} onClick={() => setSkipProgressTab(false)}>
          Update
        </Button>
        {getStatusIcon(progressViewStats)}
      </div>
    </div>
  )
}
