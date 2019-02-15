import React, { Component } from 'react'
import { Input, Button, Table } from 'semantic-ui-react'
import { shape } from 'prop-types'
import { connect } from 'react-redux'
import { doGet } from '../../redux/postman'

class Postman extends Component {
    state={
      route: ''
    }

    doRequest = () => {
      /* eslint-disable-next-line react/prop-types */
      this.props.doGet(this.state.route)
    }

    dataToConsole = () => {
      /* eslint-disable-next-line react/prop-types */
      console.log(this.props.postman.data)
    }

    render() {
      const { postman } = this.props
      const tableData = Object.entries(postman).map(([key, value]) => ({ key, value }))
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
                        {
                            width: 2,
                            textAlign: 'center',
                            content: key,
                            key: i
                        }, {
                            content: (
                              <pre
                                style={{
                                        overflow: 'auto',
                                        maxHeight: '25em',
                                        wordBreak: 'break-all',
                                        whiteSpace: 'pre-wrap'
                                    }}
                              >{JSON.stringify(value, null, 2)}
                              </pre>
                            ),
                            key: i + 1,
                            width: 14
                        }
                    ] })
                  }
            headerRow={[{
                        content: 'Key',
                        textAlign: 'center',
                        key: 'key'
                    }, {
                        content: 'Value',
                        textAlign: 'left',
                        key: 'value'
                    }]}
          />
          <Button fluid primary content="Data2Console" onClick={this.dataToConsole} />
        </div>
      )
    }
}

Postman.propTypes = {
  postman: shape({}).isRequired
}

const mapStateToProps = ({ postman }) => ({ postman })

export default connect(mapStateToProps, {
  doGet
})(Postman)
