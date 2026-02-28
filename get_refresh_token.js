const { LoginSession, EAuthTokenPlatformType, EAuthSessionGuardType } = require('steam-session');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Steam Refresh Token Generator\n");

rl.question('Steam Benutzername: ', (accountName) => {
  rl.question('Passwort: ', async (password) => {
    console.log('\nTrying to login - waiting for answer');

    const session = new LoginSession(EAuthTokenPlatformType.SteamClient);

    session.loginTimeout = 300000;

    try {
      const result = await session.startWithCredentials({
        accountName: accountName,
        password: password,
        persistence: 'permanent'
      });

      console.log('Login started. Action required?', result.actionRequired);

      if (result.actionRequired) {
        const emailGuard = result.validActions.find(action => action.type === EAuthSessionGuardType.EmailCode);

        if (emailGuard) {
          const emailDomain = emailGuard.detail || 'unbekannt';
          console.log(`\nSteam sent you a code to your mail (ends with: @${emailDomain})`);

          rl.question('Enter Steam Guard Code: ', async (code) => {
            if (!code.trim()) {
              console.log('You did not provide a code. Abort.');
              rl.close();
              return;
            }

            try {
              await session.submitSteamGuardCode(code.trim());
              console.log('Code sent. waiting for anser...');
              // authenticated-Event sollte jetzt kommen
            } catch (submitErr) {
              console.error('Error sending the code:', submitErr.message);
              rl.close();
            }
          });
        } else {
          console.log('Wrond guard type.');
          rl.close();
        }
      } else {
        console.log('Token should be coming...');
      }
    } catch (err) {
      console.error('Error at login start:', err.message);
      if (err.message.includes('RateLimitExceeded')) {
        console.log('Too many tries → wait 10–30 minutes.');
      }
      rl.close();
      return;
    }

    // Events für den Erfolg / Fehler
    session.on('authenticated', () => {
      console.log('\n=== SUCCESS ===');
      console.log('Your token is:');
      console.log(session.refreshToken);
      rl.close();
    });

    session.on('error', (err) => {
      console.error('Error:', err.message);
      rl.close();
    });

    session.on('timeout', () => {
      console.log('Timeout.');
      rl.close();
    });
  });
});
