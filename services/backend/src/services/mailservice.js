const axios = require('axios')
const { isProduction, pateToken } = require('../conf-backend')
const { ApplicationError } = require('../util/customErrors')

const pateClient = axios.create({
  baseURL: 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/pate/',
  params: {
    token: pateToken,
  },
})

const template = {
  from: 'Oodikone Robot',
}

const baseSettings = {
  color: 'orange',
  header: 'Sent by Oodikone',
  dryrun: false,
}

const sendEmail = async (options = {}) => {
  if (!isProduction) throw new ApplicationError('Email sending is disabled in development mode.')
  if (!pateToken) throw new ApplicationError('Email sending failed because pate token is missing.')
  return await pateClient.post('/', options)
}

const sendFeedbackToToska = async ({ feedbackContent, user }) => {
  const { name, userId, email } = user
  const userDetails = `Sent by ${name}, userid: ${userId}, email: ${email}`
  const text = [feedbackContent, userDetails].join('<br />')
  await sendEmail({
    template,
    emails: [
      {
        to: 'Toska <grp-toska@helsinki.fi>',
        replyTo: email,
        subject: `Oodikone feedback from ${name}`,
        text,
      },
    ],
    settings: {
      ...baseSettings,
      hideToska: true,
      disableToska: true,
    },
  })
}

const sendNotificationAboutNewUser = ({ userId, userFullName }) =>
  sendEmail({
    template,
    emails: [
      {
        to: 'Toska <grp-toska@helsinki.fi>',
        subject: 'New user in Oodikone ✔',
        text: `${userFullName} (${userId}) just logged into Oodikone for the first time!`,
      },
    ],
    settings: {
      ...baseSettings,
      hideToska: true,
      disableToska: true,
    },
  })

const accessMessageSubject = 'Authorized in Oodikone'
const accessMessageText = `<p>You've been authorized to use <a href="https://oodikone.cs.helsinki.fi">Oodikone</a> or your privileges in <a href="https://oodikone.cs.helsinki.fi">Oodikone</a> have changed.</p>
<p>You may need to log out and back in before your changes take place.</p>
<p>NOTE! If the automatic logging out from all services was not successful when logging out of oodikone, you can log out one by one or close all of your browser windows.</p>
<p>If you have defined your browser to restore your previous session in connection with starting the browser, logging out may also require deleting the cookies of the listed services in addition to closing the browser windows.</p>
<p>See the instructions for clearing the browser cache: <a href="https://helpdesk.it.helsinki.fi/en/help/1002">https://helpdesk.it.helsinki.fi/en/help/1002</a></p>`

const previewNotificationAboutAccessToUser = () => ({ accessMessageSubject, accessMessageText })

const sendNotificationAboutAccessToUser = userEmail =>
  sendEmail({
    template,
    emails: [
      {
        to: userEmail,
        replyTo: 'Toska <grp-toska@helsinki.fi>',
        subject: accessMessageSubject,
        text: accessMessageText,
      },
    ],
    settings: {
      ...baseSettings,
      hideToska: false,
      disableToska: false,
    },
  })

module.exports = {
  sendFeedbackToToska,
  sendNotificationAboutNewUser,
  sendNotificationAboutAccessToUser,
  previewNotificationAboutAccessToUser,
}
