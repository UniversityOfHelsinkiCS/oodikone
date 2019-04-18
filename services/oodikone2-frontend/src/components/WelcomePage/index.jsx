import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Header, Image, Divider } from 'semantic-ui-react'
import { images } from '../../common'

class WelcomePage extends Component { //eslint-disable-line

  render() {
    return (
      <div>
        <Container text style={{ paddingTop: 50 }}>
          <Header as="h1" textAlign="center">oodikone</Header>
          <h3 style={{ textAlign: 'center' }}>
            a tool for explorative research on student data
          </h3>
          <Divider section />
          <h4>
            Population Statistics
          </h4>
          <p>
            Query a student population specified by starting year and studyright.
            Oodikone will give you study statistics and visualizations of the population,
            which you can interactively filter and explore.
          </p>
          <Divider section />

          <h4>
            Student Statistics
          </h4>
          <p>
            Shows detailed information and visualizations of a queried student.
          </p>
          <Divider section />

          <h4>
            Course Statistics
          </h4>
          <p>
            Shows student results of a course over specified years.
          </p>
          <Divider section />

          <h4>
            Trouble? Questions? Suggestions? Need access rights?
          </h4>
          <p>
            Contact team Oodikone by email: grp-toska@helsinki.fi
          </p>
          <Divider section />

          {/* <h4>
            Settings
          </h4>
          <p>
            Here you can modify settings of oodikone.
             For example you can create custom course code correspondences.
          </p>
          <Divider section /> */}

        </Container>
        <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
      </div>
    )
  }
}
export default connect()(WelcomePage)
