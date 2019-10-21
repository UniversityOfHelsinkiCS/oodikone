import React, { Component } from 'react'
import { Header, Segment, Grid, Message, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { bool, oneOfType, shape, string } from 'prop-types'
import './index.css'
import Postman from '../Postman'
import UpdateTopTeachers from './UpdateTopTeachers'

class SandboxContainer extends Component {
  state = {
    crash: false
  }

  render() {
    if (this.state.crash) {
      throw new Error('Oo oo ah ah!')
    }
    return (
      <div className="container">
        <Header className="segmentTitle" content="Sandbox" size="large" />
        <Segment className="contentSegment">
          <Grid container columns={1} verticalAlign="middle" textAlign="center">
            <Grid.Row>
              <Grid.Column>
                <Segment basic>
                  <Button
                    fluid
                    negative
                    content="Chaos Monkey"
                    icon="trash"
                    onClick={() => this.setState({ crash: true })}
                  />
                  <Message
                    content={
                      <i>{'"I don\'t like sand. It\'s coarse and rough and irritating and it gets everywhere."'}</i>
                    }
                  />
                </Segment>
                <Segment basic loading={this.props.pending}>
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

export default connect(mapStateToProps)(SandboxContainer)
