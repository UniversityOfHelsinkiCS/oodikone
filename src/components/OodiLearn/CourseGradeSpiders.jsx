import React, { Component } from 'react'
import { Grid, Card, Header, Table, Form, Dropdown } from 'semantic-ui-react'
import { shape } from 'prop-types'
import SpiderGraph from './ProfileSpiderGraph'
import ProfileTable from './ProfileTable'

class CourseGradeSpiders extends Component {
    state={
      selected: Object.keys(this.props.data)[0]
    }
    render() {
        const { selected } = this.state
        const profile = this.props.data[selected]
        const options = Object.keys(this.props.data)
            .map(grade => ({
                value: grade,
                text: grade.slice(0, -2)
            }))
        return (
            <Grid centered textAlign="center">
                <Grid.Row>
                    <Grid.Column width={6}>
                        <Form>
                            <Form.Group inline>
                                <Form.Field>
                                    <label>Grade</label>
                                    <Dropdown
                                        selection
                                        onChange={(e, { value: selected }) => this.setState({ selected })}
                                        options={options}
                                        value={selected}
                                    />
                                </Form.Field>
                            </Form.Group>
                        </Form>
                        <ProfileTable profile={profile} />
                    </Grid.Column>
                    <Grid.Column width={10}>
                        <SpiderGraph profile={profile} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}
CourseGradeSpiders.propTypes = {
    data: shape({}).isRequired
}

export default CourseGradeSpiders
