import React, { Component } from 'react'
import { Header, Segment, Grid, Message, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, bool, oneOfType, shape, string } from 'prop-types'
import sharedStyles from '../../styles/shared'
import style from './index.css'
import { pingOodiLearn } from '../../redux/sandbox'
import Postman from '../Postman'
import UpdateTopTeachers from './UpdateTopTeachers'

class SandboxContainer extends Component {
    state={
      crash: false
    }

    render() {
      if (this.state.crash) {
        throw new Error('Oo oo ah ah!')
      }
      return (
        <div className={style.container}>
          <Header className={sharedStyles.segmentTitle} content="Sandbox" size="large" />
          <Segment className={sharedStyles.contentSegment}>
            <Grid container columns={1} verticalAlign="middle" textAlign="center">
              <Grid.Row>
                <Grid.Column>
                  <Segment basic>
                    <Button fluid negative content="Chaos Monkey" icon="trash" onClick={() => this.setState({ crash: true })} />
                    <Message
                      content={(<i>{'"I don\'t like sand. It\'s coarse and rough and irritating and it gets everywhere."'}</i>)}
                    />
                  </Segment>
                  <Segment basic loading={this.props.pending}>
                    <Button primary fluid content="Ping OodiLearn" icon="student" onClick={this.props.pingOodiLearn} />
                    <Message error={this.props.error} content={this.props.error ? 'Error.' : this.props.data} />
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
}

SandboxContainer.propTypes = {
  pingOodiLearn: func.isRequired,
  error: bool.isRequired,
  pending: bool.isRequired,
  data: oneOfType([string, shape({})])
}

SandboxContainer.defaultProps = {
  data: undefined
}

const mapStateToProps = ({ sandbox }) => ({
  pending: sandbox.pending,
  error: sandbox.error,
  data: sandbox.data
})

export default connect(mapStateToProps, { pingOodiLearn })(SandboxContainer)
