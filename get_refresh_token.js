const { LoginSession, EAuthTokenPlatformType, EAuthSessionGuardType } = require('steam-session');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Steam Refresh Token Generator – mit E-Mail-Code-Unterstützung\n");

rl.question('Steam Benutzername: ', (accountName) => {
  rl.question('Passwort: ', async (password) => {
    console.log('\nLogin-Versuch startet... Warte auf Steam-Antwort.');

    const session = new LoginSession(EAuthTokenPlatformType.SteamClient); // Für ASF/Client-kompatiblen Token

    session.loginTimeout = 300000; // 5 Minuten Timeout

    try {
      const result = await session.startWithCredentials({
        accountName: accountName,
        password: password,
        persistence: 'permanent' // "Remember this device" → langer Refresh-Token
      });

      console.log('Login-Start abgeschlossen. Action required?', result.actionRequired);

      if (result.actionRequired) {
        const emailGuard = result.validActions.find(action => action.type === EAuthSessionGuardType.EmailCode);

        if (emailGuard) {
          const emailDomain = emailGuard.detail || 'unbekannt';
          console.log(`\nSteam hat einen Code per E-Mail an deine Adresse gesendet (endet auf @${emailDomain})`);
          console.log('→ Öffne dein E-Mail-Postfach (prüfe auch Spam/Ordner "Sicherheit")');
          console.log('→ Der Code ist 5-stellig (z. B. ABCDE)');

          rl.question('Gib den Steam Guard E-Mail-Code ein: ', async (code) => {
            if (!code.trim()) {
              console.log('Kein Code eingegeben → Abbruch.');
              rl.close();
              return;
            }

            try {
              await session.submitSteamGuardCode(code.trim());
              console.log('Code gesendet – warte auf Bestätigung...');
              // authenticated-Event sollte jetzt kommen
            } catch (submitErr) {
              console.error('Fehler beim Senden des Codes:', submitErr.message);
              rl.close();
            }
          });
        } else {
          console.log('Anderer Guard-Typ benötigt (z. B. App-Bestätigung). Prüfe Steam-App.');
          rl.close();
        }
      } else {
        console.log('Kein zusätzlicher Guard nötig – Token sollte gleich kommen.');
      }
    } catch (err) {
      console.error('Fehler beim Login-Start:', err.message);
      if (err.message.includes('RateLimitExceeded')) {
        console.log('Zu viele Versuche → Warte 10–30 Minuten.');
      }
      rl.close();
      return;
    }

    // Events für den Erfolg / Fehler
    session.on('authenticated', () => {
      console.log('\n=== ERFOLG ===');
      console.log('Dein Refresh Token (kopiere den gesamten String!):');
      console.log(session.refreshToken);
      console.log('\n→ Langer eyJ... String – nutzbar in ASF etc.');
      rl.close();
    });

    session.on('error', (err) => {
      console.error('Fehler während des Prozesses:', err.message);
      rl.close();
    });

    session.on('timeout', () => {
      console.log('Timeout – Code zu spät eingegeben oder nicht bestätigt.');
      rl.close();
    });
  });
});
