# Dev-Con Frontend

Login/Register frontend for the Dev-Con backend — React + Vite.

## Setup

```bash
npm install
cp .env.example .env   # fill in API URL + Google/GitHub OAuth client IDs
npm run dev
```

## Structure

```
src/
  main.jsx                    # entry point
  App.jsx                     # routes + global Noise/CustomCursor
  index.css                   # design tokens (colors, fonts)
  lib/api.js                  # axios client wired to /auth/* backend routes
  context/AuthContext.jsx     # session state (user, access token)
  pages/
    Login.jsx
    Register.jsx
    GithubCallback.jsx        # handles GitHub OAuth redirect
  components/
    AuthLayout.jsx             # shared shell: background, navbar, card frame
    FormField.jsx
    OAuthButtons.jsx           # Google Identity + GitHub OAuth buttons
    effects/
      Antigravity.jsx          # particle background (placeholder — replace with your real one)
      SpecularButton.jsx       # shine/glow CTA button (placeholder — replace with your real one)
      MagicBento.jsx           # spotlight/tilt/glow card (placeholder — replace with your real one)
      ShinyText.jsx            # React Bits — metallic sheen text
      DecryptedText.jsx        # React Bits — scramble-reveal text
      ClickSpark.jsx           # React Bits — click particle burst
      Magnet.jsx                # React Bits — magnetic hover pull
      StarBorder.jsx            # React Bits — rotating glow border
      Noise.jsx                 # React Bits — film grain overlay
      CustomCursor.jsx          # React Bits — dot + ring cursor
```

## Replacing the placeholder effects

`Antigravity`, `SpecularButton`, and `MagicBento` are stand-in implementations
matching the prop signatures you shared. Drop your real component files in at
the same paths and nothing else in the app needs to change.

## Backend contract

- `POST /auth/register` → `{ name, username, email, password, phoneNumber }`
- `POST /auth/login` → `{ identifier, password }`
- `POST /auth/google` → `{ idToken }`
- `POST /auth/github` → `{ code }`
- Response: `{ statusCode, message, data: { user, accessToken } }`, refresh
  token set as an httpOnly cookie.
