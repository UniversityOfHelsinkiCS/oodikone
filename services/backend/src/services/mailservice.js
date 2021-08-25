const axios = require('axios')

const inProduction = process.env.NODE_ENV === 'production'
const pateToken = process.env.PATE_API_TOKEN || ''

const pateClient = axios.create({
  baseURL: 'https://pate.toska.cs.helsinki.fi',
  params: {
    token: pateToken,
  },
})

const sendEmail = async (options = {}) => {
  if (!inProduction) {
    console.log('Skipped sending email in non-production environment', options)
    return null
  }

  if (!pateToken) {
    console.log('Skipped sending email since pate token was not available', options)
    return null
  }

  const { data } = await pateClient.post('/', options)

  return data
}

const sendFeedbackToToska = ({ feedbackContent, userId, userEmail, userFullName }) => {
  const userDetails = `Sent by ${userFullName}, userid: ${userId}, email: ${userEmail}`
  const text = [feedbackContent, userDetails].join('<br />')
  return sendEmail({
    template: {
      from: 'Oodikone Robot',
    },
    emails: [
      {
        to: 'Toska <grp-toska@helsinki.fi>',
        replyTo: userEmail,
        subject: `Oodikone feedback from ${userFullName}`,
        text,
      },
    ],
    settings: {
      hideToska: true,
      disableToska: true,
      color: 'orange',
      header: 'Sent by Oodikone',
      dryrun: false,
    },
  })
}

const sendNotificationAboutNewUser = ({ userId, userFullName }) =>
  sendEmail({
    template: {
      from: 'Oodikone Robot',
    },
    emails: [
      {
        to: 'Toska <grp-toska@helsinki.fi>',
        subject: 'New user in Oodikone ✔',
        text: `${userFullName} (${userId}) just logged into Oodikone for the first time!`,
      },
    ],
    settings: {
      hideToska: true,
      disableToska: true,
      color: 'orange',
      header: 'Sent by Oodikone',
      dryrun: false,
    },
  })

const nodemailer = require('nodemailer')

// NB! Store the account object values somewhere if you want
// to re-use the same account for future mail deliveries

// Create a SMTP transporter object
const transporter = nodemailer.createTransport(
  {
    from: 'Oodikone Robot <noreply@helsinki.fi>',
    host: `${process.env.SMTP}`,
    port: 587,
    secure: false, // false -> TLS, true -> SSL
    logger: false,
    debug: false, // include SMTP traffic in the logs
  },
  {
    from: 'Oodikone Robot <noreply@helsinki.fi>',
  }
)

const message2 = email => {
  return {
    to: [email, 'grp-toska@helsinki.fi'],
    replyTo: 'Toska <grp-toska@helsinki.fi>',
    subject: 'Authorized in oodikone',
    text: "You've been authorized to use oodikone.",
    html: `<p>You've been authorized to use <a href="https://oodikone.cs.helsinki.fi">oodikone</a> or 
    your privileges in <a href="https://oodikone.cs.helsinki.fi">oodikone</a> have changed.</p>
    <p>You may need to log out and back in before your changes take place.</p>
    <p>NOTE! If the automatic logging out from all services was not successful when
    logging out of oodikone, you can log out one by one or close all of your browser windows.</p>
    <p>If you have defined your browser to restore your previous session in connection
    with starting the browser, logging out may also require deleting the cookies
    of the listed services in addition to closing the browser windows.</p>
    <p>See the instructions for clearing the browser cache: <a href="https://helpdesk.it.helsinki.fi/en/help/1002">
    https://helpdesk.it.helsinki.fi/en/help/1002</a></p>
    <br />
    <hr />
    <br />
    <p>Helsingin Yliopisto, TOSKA.</p>
    <p>grp-toska@helsinki.fi</p>
    <p>Pietari Kalmin katu 5, Exactum BK113</p>
    <img style="max-width: 13.5%;height: auto;" src="https://i.imgur.com/tnNDAJk.png" /> `,
  }
}

module.exports = { transporter, message2, sendFeedbackToToska, sendNotificationAboutNewUser }
