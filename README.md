# Steam Refresh Token Generator

Simple Node.js script to generate a Steam refresh token (JWT) for your **own accounts** only.  
Compatible with ArchiSteamFarm (ASF), node-steam-user, steam.py, etc.

**Important:** For personal use only. Using it on someone else's account violates Steam rules.

## Quick Install

```bash
mkdir steam-token-gen && cd steam-token-gen
create the get_refresh_token.js
npm init -y
npm install steam-session
node get_refresh_token.js
