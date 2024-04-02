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

const accessMessageSubject =
  'Käyttöoikeutesi Oodikoneeseen on päivitetty – Your privileges in Oodikone have been updated'
const accessMessageText = `Sinulle on annettu oikeudet käyttää <a href="https://oodikone.helsinki.fi">Oodikonetta</a> tai käyttöoikeutesi Oodikoneeseen on päivitetty.<br/>\n
Jotta muutokset astuvat voimaan, saatat joutua kirjautumaan ulos ja takaisin sisään.<br/>\n
HUOM! Jos automaattinen uloskirjautuminen kaikista palveluista ei onnistunut kirjautuessasi ulos Oodikoneesta, voit kirjautua ulos jokaisesta palvelusta yksitellen tai sulkea kaikki selainikkunasi.<br/>\n
Jos olet määritellyt selaimen palauttamaan edellisen istuntosi käynnistyksen yhteydessä, saatat joutua selainikkunoiden sulkemisen lisäksi poistamaan myös listattujen palvelujen evästeet.<br/>\n
Katso ohjeet selaimen välimuistin tyhjentämiseksi: <a href="https://helpdesk.it.helsinki.fi/help/1002">https://helpdesk.it.helsinki.fi/help/1002</a><br/><br/>\n
You've been authorized to use <a href="https://oodikone.helsinki.fi">Oodikone</a> or your privileges in Oodikone have changed.<br/>\n
You may need to log out and back in before your changes take place.<br/>\n
NOTE! If the automatic logging out from all services was not successful when logging out of oodikone, you can log out one by one or close all of your browser windows.<br/>\n
If you have defined your browser to restore your previous session in connection with starting the browser, logging out may also require deleting the cookies of the listed services in addition to closing the browser windows.<br/>\n
See the instructions for clearing the browser cache: <a href="https://helpdesk.it.helsinki.fi/en/help/1002">https://helpdesk.it.helsinki.fi/en/help/1002</a><br/>\n`

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
