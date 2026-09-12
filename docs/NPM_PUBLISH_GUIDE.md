# 📦 NPM Publishing & CI/CD Release Guide | रिलीज गाइड

Is guide me bataya gaya hai ki kaise aap **NPM credentials** GitHub repository me add karenge aur **Git tag** push karte hi aapka TypeScript SDK NPM par live ho jayega aur Android APK GitHub Release me automatically attach ho jayegi.

---

## 🔑 Step 1: NPM Access Token Kaise Generate Karein

1. [npmjs.com](https://www.npmjs.com/) par login karein.
2. Apni profile icon par click karein aur **Access Tokens** select karein.
3. **Generate New Token** ➔ **Classic Token** ya **Granular Access Token** select karein:
   - **Type**: `Automation` (CI/CD environments ke liye recommended, isme 2FA prompt bypass rehta hai).
   - **Package**: `notifypush-client` (ya all packages).
   - **Permissions**: `Read and Write`.
4. Generated Token ko copy kar lijiye (yeh dobara nahi dikhega).

> **Note**: Package ka official public name **`notifypush-client`** hai, jo bina kisi organization setup ke direct publish ho jata hai.

---

## 🔐 Step 2: GitHub Repository Secrets me Token Add Karein

1. Apne GitHub repository par jayein:  
   `https://github.com/SudhirDevOps1/notify-push`
2. **Settings** tab par click karein.
3. Left sidebar me **Secrets and variables** ➔ **Actions** par click karein.
4. **New repository secret** button par click karein:
   - **Name**: `NPM_TOKEN`
   - **Secret**: Paste aapka NPM automation token jo step 1 me mila tha.
5. **Add secret** par click karke save kar dein.

---

## 🚀 Step 3: Naya Version Tag Push Karke Live Karein

Jab bhi aap chahein ki naya version live ho:

```bash
# 1. Version tag banayein (e.g., v1.0.0, v1.0.1)
git tag v1.0.0

# 2. Tag ko GitHub par push karein
git push origin v1.0.0
```

### ⚡ Automatic Pipeline Actions:
Jaise hi aap tag push karenge, `.github/workflows/release.yml` automatic start hoga:
1. ✅ **Android App Build**: Tests run karega aur `NotifyPush-debug.apk` compile karega.
2. ✅ **TypeScript SDK Build**: `sdk/typescript` me compile karega (`tsc`).
3. ✅ **NPM Live Publish**: Agar `NPM_TOKEN` secret set hai, toh `notifypush-client` npm registry par **live publish** ho jayega!
4. ✅ **GitHub Release**: Automatic release create karke usme `NotifyPush-debug.apk` attach kar dega jisse users direct download kar sakein!

---

## 🔘 Step 4: Manual Run (Bina Tag ke UI se Trigger karna)

Agar aapko tag push nahi karna aur manual trigger karna hai:
1. GitHub repo me **Actions** tab par jayein.
2. Left menu me **"Release & Publish SDKs"** select karein.
3. **Run workflow** dropdown par click karein aur tag name specify karke run kar dein!
