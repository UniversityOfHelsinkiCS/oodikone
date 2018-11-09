import React from 'react'
import { Grid, Card, Header, Table } from 'semantic-ui-react'
import { shape } from 'prop-types'
import SpiderGraph from './ProfileSpiderGraph'

const CourseGradeSpiders = ({ data }) => (
    <Grid centered textAlign="center">
        { Object.entries(data).map(([ grade, profile ]) => (
            <Grid.Row key={grade}>
                <Grid.Column width={6}>
                    <Table definition size="small">
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell content="Grade" width={4} textAlign="center" />
                                <Table.Cell content={grade.slice(0, -2)} />
                            </Table.Row>
                            { Object.entries(profile).map(([ key, value ]) => (
                                <Table.Row key={key}>
                                    <Table.Cell content={key} width={3} textAlign="center" />
                                    <Table.Cell content={value} />
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Grid.Column>
                <Grid.Column width={10}>
                    <SpiderGraph profile={profile} />                    
                </Grid.Column>
            </Grid.Row>
        ))}
    </Grid>
)


CourseGradeSpiders.propTypes = {
    data: shape({}).isRequired
}

export default CourseGradeSpiders
