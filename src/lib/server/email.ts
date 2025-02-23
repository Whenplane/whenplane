
export async function sendEmail(endpoint: string, options: SmtpRequest) {
  await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(options)
  })
}


export type SmtpRequest = {
  key: string,

  host: string,
  port: number,
  username: string,
  password: string,

  from?: string,
  to: string,
  subject?: string,
  body: string
}


export const EMAIL_FOOTER = `
  <br>
  <br>
  <span style="opacity: 0.8; font-size: 0.8em;">
    Whenplane is not affiliated with Linus Tech Tips, Linus Media Group, Floatplane, or any related organizations.<br>
    If you are receiving too many unrequested emails from Whenplane,
    feel free to reach out to <a href="mailto:support@whenplane.com">support@whenplane.com</a> to have your address blacklisted.
  </span>
`

export const VERIFICATION_EMAIL = email_template(`
            <img src="https://whenplane.com/wan-ios-logo.png" style="width: 10em; height: auto; border-radius: 3em;"><br>
            <br>
            <h1>Verify your email</h1>
            <p>
              Hello, {USERNAME}!<br>
              If you are receiving this email, it is because your email has been used
              to create an account on <a href="https://whenplane.com">Whenplane</a>.<br>
              <br>
              If this was you, please click the following link to verify your email.<br>
              <br>
              This link is only valid for 20 minutes.
            </p>
            <a href="{VERIFICATION_LINK}" class="btn variant-glass-primary">Verify Email</a><br>
            <p>
              If you are unable to click the above button, copy this link into a new tab: {VERIFICATION_LINK}<br>
            </p>
            <br>
            <p>
              <b>If this was not you</b> then you can safely ignore this email.
            </p>
            <p>
              If you would like to disallow registrations using your email,
              please reach out to <a href="mailto:support@whenplane.com">support@whenplane.com</a>.
            </p>
`);

export const PASSWORD_RESET_EMAIL = email_template(`
            <img src="https://whenplane.com/wan-ios-logo.png" style="width: 10em; height: auto; border-radius: 3em;"><br>
            <br>
            <h1>Reset your password</h1>
            <p>
              Hello, {USERNAME}!<br>
              You are receiving this email because a password reset was requested for your email.<br>
              <br>
              If you did not request this, you can safely ignore this email.<br>
              <br>
              To continue, click the following link.<br>
              <br>
              This link is only valid for 20 minutes.
            </p>
            <a href="{RESET_LINK}" class="btn variant-glass-primary">Reset Password</a><br>
            <p>
              If you are unable to click the above button, copy this link into a new tab: {RESET_LINK}<br>
            </p>
            <p>
              <b>If this was not you</b> then you can safely ignore this email.
            </p>
            <p>
              If password resets are being requested for your email too often,
              please reach out to <a href="mailto:support@whenplane.com">support@whenplane.com</a>.
            </p>
`);

function email_template(body: string) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <style>
        h1 {
            margin: 0 0 0.5rem;
        }
        h2 {
            margin-bottom: 0.5rem;
        }

        body {
            color: white;
            font-size: 0.9em;
            background-color: rgb(21 23 31);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            padding: 1em;
            
        }

        a {
            text-decoration-line: underline;
            color: rgb(212, 22, 60);
        }

        .content {
            margin-top: 0.2em;
            margin-bottom: 0.8em;
        }

        img {
            height: 5em;
        }

        .text-center {
            text-align: center;
        }

        .disabled {
            opacity: 60%;
        }
        
        .limit {
            max-width: 800px;
        }
        
        .btn {
          font-size: 1rem;
          line-height: 1.5rem;
          padding: 9px 1.25rem;
          white-space: nowrap;
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
          border-radius: 24px;
          
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
        }
        
        .variant-glass-primary {
          background-color: rgb(212 22 60 / 0.2);
          -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
        }
        .variant-glass-primary:hover {
          -webkit-backdrop-filter: blur(16px) brightness(1.15);
          backdrop-filter: blur(16px) brightness(1.15);
        }
    </style>
  </head>
    <body style="color: white; background-color: rgb(21 23 31); padding: 1em;">
        <div class="content limit">
            ${body}<br>
            ${EMAIL_FOOTER}
        </div>

    </body>
</html>
`
}