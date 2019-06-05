const nodemailer = require('nodemailer')



// NB! Store the account object values somewhere if you want
// to re-use the same account for future mail deliveries

// Create a SMTP transporter object
const transporter = nodemailer.createTransport(
  {

    from: 'Oodikone Robot <noreply@helsinki.fi>',
    host: `${process.env.SMTP}`,
    port: 587,
    secure: false // false -> TLS, true -> SSL
    ,
    logger: false,
    debug: false // include SMTP traffic in the logs
  },
  {

    from: 'Oodikone Robot <noreply@helsinki.fi>'
  }
)

const message1 = user => {
  return ({
    to: 'Toska <grp-toska@helsinki.fi>',
    subject: 'New user in Oodikone ✔',
    text: `${user} just logged into oodikone for the first time!`,
    html: `<p>${user} just logged into oodikone for the first time! </p><br />
          <img src="cid:toskalogoustcid"/>`,
    attachments: [
      {
        filename: 'toska.png',
        path: `${process.cwd()}/assets/toska.png`,
        cid: 'toskalogoustcid'
      }
    ]
  })
}
const message2 = email => {
  return ({
    to: email,
    subject: 'Authorized in oodikone',
    text: 'You\'ve been authorized to use oodikone.',
    html: `<p>You've been authorized to use <a href="https://oodikone.cs.helsinki.fi">oodikone.</a></p>
    <p>You may need to log out of oodikone before you can log in to oodikone.</p>
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
    <p>Pietari Kalmin katu 5, Exactum B333</p>
    <img style="max-width: 13.5%;height: auto;" src="https://i.imgur.com/tnNDAJk.png" /> `,
  })
}
const feedback = (content, user, email, full_name) => {
  return ({
    to: 'Toska <grp-toska@helsinki.fi>',
    replyTo: email,
    subject: `New message from Oodikone feedback`,
    text: `New message from user ${user}`,
    html: `${content}
    <p>sent by ${full_name}, userid: ${user}, email: ${email}</p>
    <img src="cid:toskalogoustcid"/>`,
    attachments: [
      {
        filename: 'toska.png',
        path: `${process.cwd()}/assets/toska.png`,
        cid: 'toskalogoustcid'
      }
    ]
  })
}

module.exports = { transporter, message1, message2, feedback }
