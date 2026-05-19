# DengueSat — Manual Gate Checklist

> **Do these steps in order. Each blocks the next. Total time: ~45 minutes.**

---

## Step 1 — Rotate compromised API keys (CRITICAL)

The previous Claude key was pasted in a chat log. Treat as compromised.

| Key | Console URL | Action |
|-----|-------------|--------|
| Claude (Anthropic) | https://console.anthropic.com/settings/keys | Revoke `sk-ant-api03-<REDACTED>`. Generate new key. |
| OpenWeather | https://home.openweathermap.org/api_keys | Revoke old key. Generate new key. |
| Google Maps | https://console.cloud.google.com/apis/credentials | Revoke old key. Generate new restricted key. Enable: Places API, Directions API, Geocoding API. |

---

## Step 2 — Populate `denguesat-ciro/.env.local`

Open `denguesat-ciro/.env.local` (gitignored). Replace placeholders:

```
ANTHROPIC_API_KEY=sk-ant-api03-<NEW>
OPENWEATHER_API_KEY=<NEW>
GOOGLE_MAPS_API_KEY=<NEW>
FIREBASE_DATABASE_URL=https://denguesa-e0371-default-rtdb.firebaseio.com/

# Firebase Web SDK — from Firebase Console > Project Settings > Your apps > Web > Config
EXPO_PUBLIC_FIREBASE_API_KEY=<paste>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<paste>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<paste>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<paste>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<paste>
EXPO_PUBLIC_FIREBASE_APP_ID=<paste>
```

---

## Step 3 — Deploy Vercel Edge proxy

```powershell
npm install -g vercel
cd C:\Users\ibrah\Desktop\ai-seekho\denguesat-ciro\server
vercel login         # opens browser
vercel link          # create new project: denguesat-ciro-proxy
vercel env add ANTHROPIC_API_KEY        # paste new Claude key, all environments
vercel env add OPENWEATHER_API_KEY      # paste new OW key
vercel env add GOOGLE_MAPS_API_KEY      # paste new Maps key
vercel env add FIREBASE_DATABASE_URL    # paste RTDB URL
vercel deploy --prod
```

Copy the production URL printed (e.g. `https://denguesat-ciro-proxy.vercel.app`).

---

## Step 4 — Wire proxy URL into mobile

Edit `denguesat-ciro/.env`:

```
EXPO_PUBLIC_AGENT_PROXY_URL=https://denguesat-ciro-proxy.vercel.app
```

---

## Step 5 — Seed Firebase RTDB hospital data

Open Firebase Console → Realtime Database → Import JSON:

```json
{
  "hospitals": {
    "karachi": {
      "jinnah": { "name": "Jinnah Hospital", "lat": 24.8924, "lng": 67.0731, "totalBeds": 1200, "occupiedBeds": 1068, "platelets": 320, "dengueAdmissions24h": 47 },
      "civil":  { "name": "Civil Hospital",  "lat": 24.8607, "lng": 67.0011, "totalBeds": 900,  "occupiedBeds": 801,  "platelets": 240, "dengueAdmissions24h": 35 }
    },
    "lahore": {
      "mayo":   { "name": "Mayo Hospital",   "lat": 31.5832, "lng": 74.3245, "totalBeds": 1500, "occupiedBeds": 1290, "platelets": 410, "dengueAdmissions24h": 28 }
    },
    "peshawar": {
      "lady-reading": { "name": "Lady Reading Hospital", "lat": 34.0151, "lng": 71.5466, "totalBeds": 1100, "occupiedBeds": 880, "platelets": 280, "dengueAdmissions24h": 18 }
    },
    "islamabad": {
      "pims":  { "name": "PIMS", "lat": 33.6957, "lng": 73.0539, "totalBeds": 900, "occupiedBeds": 720, "platelets": 200, "dengueAdmissions24h": 12 }
    }
  }
}
```

Set rules to `{".read": true, ".write": false}` for read-only access from proxy.

---

## Step 6 — Smoke test proxy

```powershell
curl https://<your-vercel-url>/api/data/nasa?lat=24.86&lng=67.01
curl https://<your-vercel-url>/api/data/openweather?lat=24.86&lng=67.01
curl https://<your-vercel-url>/api/data/firebase?path=hospitals/karachi
curl https://<your-vercel-url>/api/synth/posts?district=Korangi&city=Karachi&n=4
```

All should return JSON. If `_cache.fromCache=false` on first call and `=true` on second within TTL, cache works.

---

## Step 7 — Build Android APK

```powershell
npm install -g eas-cli
cd C:\Users\ibrah\Desktop\ai-seekho\denguesat-ciro
eas login            # Expo account
eas build -p android --profile preview
```

Wait ~15min. CLI gives APK download URL. Install on Android device (enable "Install unknown apps").

---

## Step 8 — Run E2E smoke test on device

- Open app → Intel tab
- Pick province → city → district (e.g., Sindh → Karachi → Korangi)
- Tap "START SYSTEM SCAN"
- Watch Logs tab → traces stream live
- Wait ~20-30s for `master.done`
- Switch through tabs: Map (red zones), Sim (before/after), Alerts (Urdu+Eng voice playback), Recovery (PITB table + source health)
- Tap Citizen tab → AR Scanner sub-tab → capture photo → vision result appears
- Try scenario switch in Intel → "Dual Crisis" → re-run → trade-off visible

If anything crashes: check Vercel logs (`vercel logs --follow`) and proxy URL is set.

---

## Step 9 — Export Antigravity trace bundle

In running app → Logs tab → 📦 Export button → share to file system. Save to `denguesat-ciro/submission/antigravity-trace-bundle.json`.

---

## Step 10 — Record demo video (3-5 min)

Script at `denguesat-ciro/submission/demo-script.md`. Use:
- Windows: Built-in Xbox Game Bar (Win+G) → record screen
- Or OBS Studio (free)
- Or Android: Built-in screen recorder
- Edit to 3-5 min in DaVinci Resolve (free) or Clipchamp
- Save to `denguesat-ciro/submission/demo.mp4`

---

## Step 11 — Bundle for submission

```powershell
cd C:\Users\ibrah\Desktop\ai-seekho
mkdir submission
cp denguesat-ciro\submission\*.* submission\
cp <downloaded-APK-path> submission\denguesat-v1.0.apk
Compress-Archive -Path denguesat-ciro -DestinationPath submission\denguesat-source.zip -Force
# Manually exclude node_modules / .env* / .superpowers from zip before sharing
```

---

## Step 12 — Antigravity workspace bundle (rubric 25%)

- Open `C:\Users\ibrah\Desktop\ai-seekho\denguesat-ciro` in Google Antigravity IDE
- Run the multi-agent dev workflow inside Antigravity to generate parallel traces
- Export workspace bundle from Antigravity IDE settings
- Include in `submission/` folder as `antigravity-workspace.zip`

---

## Files to upload to hackathon portal

- [ ] `denguesat-v1.0.apk` — install file
- [ ] `demo.mp4` — 3-5 min video
- [ ] `denguesat-source.zip` — source code
- [ ] `antigravity-trace-bundle.json` — runtime traces
- [ ] `antigravity-workspace.zip` — Antigravity IDE export
- [ ] `README.md` — already in source
- [ ] `submission/README.md` — submission index

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| App can't reach proxy | Check `EXPO_PUBLIC_AGENT_PROXY_URL` in `.env`, rebuild APK |
| Claude calls 401 | Re-run `vercel env add ANTHROPIC_API_KEY`, redeploy |
| Maps proxy 403 | Enable APIs in Google Cloud Console (Places, Geocoding) |
| Firebase 404 | Seed data per Step 5; check read rules |
| Trace viewer empty | Open Vercel logs; likely SSE error or master crash |
| AR scanner permission denied | Grant camera permission in Android Settings |
| TTS silent | Install Pico TTS engine on Android, set ur-PK if available |

---

## Hackathon submission deadline

**2026-05-20**. Today's date in plan: 2026-05-15.
