import React, { useState, useEffect } from 'react'
import { Header, Segment, Grid, Message, Button } from 'semantic-ui-react'
import './index.css'
import { useTitle } from '../../common/hooks'
import Postman from '../Postman'
import UpdateTopTeachers from './UpdateTopTeachers'

const SandboxContainer = () => {
  const [crash, setCrash] = useState(false)
  useTitle('Sandbox')

  useEffect(() => {
    if (crash) {
      throw new Error('Oo oo ah ah!')
    }
  }, [crash])

  return (
    <div className="container">
      <Header className="segmentTitle" content="Sandbox" size="large" />
      <Segment className="contentSegment">
        <Grid container columns={1} verticalAlign="middle" textAlign="center">
          <Grid.Row>
            <Grid.Column>
              <Segment basic>
                <Button fluid negative content="Chaos Monkey" icon="trash" onClick={() => setCrash(true)} />
                <Message
                  content={
                    <i>{'"I don\'t like sand. It\'s coarse and rough and irritating and it gets everywhere."'}</i>
                  }
                />
              </Segment>
              <Segment basic>
                <UpdateTopTeachers />
              </Segment>
              <Segment basic>
                <Postman />
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    </div>
  )
}

export default SandboxContainer
