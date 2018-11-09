import React from 'react'
import { Table } from 'semantic-ui-react'
import { shape } from 'prop-types'

const ProfileTable = ({ profile }) => (
    <Table definition size="small">
        <Table.Body>
            { Object.entries(profile).map(([ key, value ]) => (
                <Table.Row key={key}>
                    <Table.Cell content={key} width={3} textAlign="center" />
                    <Table.Cell content={value} />
                </Table.Row>
            ))}
        </Table.Body>
    </Table>
)

ProfileTable.propTypes = {
    profile: shape({}).isRequired
}

export default ProfileTable