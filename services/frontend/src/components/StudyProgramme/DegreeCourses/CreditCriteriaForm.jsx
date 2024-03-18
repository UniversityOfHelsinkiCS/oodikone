import React, { useState } from 'react'
import { Container, Message, Form } from 'semantic-ui-react'

export const CreditCriteriaForm = ({ criteria, studyProgramme, addProgressCriteriaCredits }) => {
  const [creditsLimit1, setCreditsLimit1] = useState('')
  const [creditsLimit2, setCreditsLimit2] = useState('')
  const [creditsLimit3, setCreditsLimit3] = useState('')
  const [creditsLimit4, setCreditsLimit4] = useState('')
  const [creditsLimit5, setCreditsLimit5] = useState('')
  const [creditsLimit6, setCreditsLimit6] = useState('')

  const setCreditsLimitCriteria = () => {
    const credits = {
      year1: creditsLimit1 === '' ? criteria.credits.yearOne : creditsLimit1,
      year2: creditsLimit2 === '' ? criteria.credits.yearTwo : creditsLimit2,
      year3: creditsLimit3 === '' ? criteria.credits.yearThree : creditsLimit3,
      year4: creditsLimit4 === '' ? criteria.credits.yearFour : creditsLimit4,
      year5: creditsLimit5 === '' ? criteria.credits.yearFive : creditsLimit5,
      year6: creditsLimit6 === '' ? criteria.credits.yearSix : creditsLimit6,
    }
    addProgressCriteriaCredits({ programmeCode: studyProgramme, credits })
  }
  return (
    <Container>
      <Message style={{ fontSize: '16px' }}>
        <Message.Header>Change visibility of degree courses and select criteria for academic years</Message.Header>
        <p>
          Here you can change visibility of degree courses as and set course and credits criteria, for each year their
          own. Credits criteria is computed as follows: for the first academic year the credits are taken into account
          if they are completed during the first 12 months. For the second year, we take into account the completions
          during the first 24 months, for the third year the first 36 months.
        </p>
        <p>The progress of the students by these criteria will be shown in class statistics view.</p>
      </Message>
      <h5>Credit criteria</h5>
      <Form>
        <Form.Group widths="equal">
          <Form.Input
            fluid
            label={`First year (12 months) last set: ${criteria?.credits?.yearOne}`}
            onChange={event => setCreditsLimit1(event.target.value)}
            type="number"
          />
          <Form.Input
            fluid
            label={`Second year (24 months) last set: ${criteria?.credits?.yearTwo}`}
            onChange={event => setCreditsLimit2(event.target.value)}
            type="number"
          />
          <Form.Input
            fluid
            label={`Third year (36 months) last set: ${criteria?.credits?.yearThree}`}
            onChange={event => setCreditsLimit3(event.target.value)}
            type="number"
          />
        </Form.Group>
        {['MH30_001', 'MH30_003', 'KH90_001'].includes(studyProgramme) && (
          <Form.Group widths="equal">
            <Form.Input
              fluid
              label={`Fourth year (48 months) last set: ${criteria?.credits?.yearFour}`}
              onChange={event => setCreditsLimit4(event.target.value)}
              type="number"
            />
            <Form.Input
              fluid
              label={`Fifth year (60 months) last set: ${criteria?.credits?.yearFive}`}
              onChange={event => setCreditsLimit5(event.target.value)}
              type="number"
            />
            <Form.Input
              fluid
              label={`Sixth year (72 months) last set: ${criteria?.credits?.yearSix}`}
              onChange={event => setCreditsLimit6(event.target.value)}
              type="number"
            />
          </Form.Group>
        )}
        <Form.Button color="green" content="Save credit changes" onClick={setCreditsLimitCriteria} />
      </Form>
    </Container>
  )
}
