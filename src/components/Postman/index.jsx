import React, { Component } from 'react'
import { Input, Message, Button, Table } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { doGet } from '../../redux/postman'

class Postman extends Component {
    state={
      route: ''
    }
    doRequest = () => {
      this.props.doGet(this.state.route)
    }
    render() {
        const { postman } = this.props
        const tableData = Object.entries(postman).map(([ key, value ]) => ({ key, value }))
        return (
            <div>
                <Input
                    fluid
                    value={this.state.route}
                    onChange={(_, { value: route }) => this.setState({ route })}
                    placeholder="Make GET request to API"
                    action={
                        <Button
                            content="GET"
                            icon="send"
                            onClick={this.doRequest}
                        />
                    }
                />
                <Table
                  celled
                  tableData={tableData}
                  renderBodyRow={({ key, value }, i) => ({
                      key: i,
                      cells: [
                        key,
                        JSON.stringify(value)
                    ]})
                  }
                  headerRow={['Key', 'Value']}
                />
            </div>
        )
    }
}

const mapStateToProps = ({ postman }) => ({ postman })

export default connect(mapStateToProps, {
  doGet
})(Postman)