# PhishOFF Plasmo Extension

A plasmo extension with two main features: Ensuring the url you are visiting is safe and providing detection for Phishing in your emails.

## Running Locally

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Set Up Environment File**:
   Create a `.env` file:

   ```
    PLASMO_PUBLIC_VIRUSTOTAL_API_KEY=
    API_URL=
   ```

3. **Run the Extension**:

   ```bash
   bun run dev
   ```

4. **Open Browser and load appropriate development build**:
   - For chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.
   - Open chrome://extensions/ and enable "Developer mode".
   - Click on "Load unpacked" and select the `build/chrome-mv3-dev` inside this extension directory under /build.
   - The extension should now be loaded and you can start testing it.

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission! -->
