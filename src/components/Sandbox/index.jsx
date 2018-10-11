import React, { Component } from 'react'
import { Header, Segment, Grid, Message } from 'semantic-ui-react'
import sharedStyles from '../../styles/shared'
import style from './index.css'

class SandboxContainer extends Component {
    state={}

    render() {
      return (
        <div className={style.container}>
          <Header className={sharedStyles.segmentTitle} content="Sandbox" size="large" />
          <Segment className={sharedStyles.contentSegment}>
            <Grid container columns={1} verticalAlign="middle" textAlign="center">
              <Grid.Row>
                <Message
                  compact
                  content={(<i>{'"I don\'t like sand. It\'s coarse and rough and irritating and it gets everywhere."'}</i>)}
                />
              </Grid.Row>
            </Grid>
          </Segment>
        </div>
      )
    }
}

export default SandboxContainer
