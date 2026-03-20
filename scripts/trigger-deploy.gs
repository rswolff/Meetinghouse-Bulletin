/**
 * Meetinghouse Bulletin — Auto Deploy Trigger
 *
 * Paste this script into your Google Sheet's Apps Script editor to
 * automatically trigger a site rebuild whenever the ward data is edited.
 *
 * ── SETUP ─────────────────────────────────────────────────────────────────────
 *
 * 1. In your Google Sheet, open Extensions → Apps Script
 * 2. Paste this entire file and click Save (disk icon)
 * 3. Store your deploy webhook URL (run this once):
 *      a. Edit the setWebhookUrl() function below — replace the placeholder
 *         with your actual webhook URL
 *      b. In the toolbar, select "setWebhookUrl" from the function dropdown
 *      c. Click Run — you'll be asked to authorise the script
 *      d. Check the Execution Log to confirm "Webhook URL saved"
 * 4. Add the edit trigger:
 *      a. Click the clock icon (Triggers) in the left sidebar
 *      b. Click "+ Add Trigger" (bottom right)
 *      c. Choose function: onSheetEdit
 *      d. Event source: From spreadsheet
 *      e. Event type: On edit
 *      f. Click Save
 *
 * ── GETTING YOUR DEPLOY WEBHOOK URL ──────────────────────────────────────────
 *
 * Cloudflare Pages:
 *   Dashboard → Your project → Settings → Build & Deployments
 *   → Deploy Hooks → Add deploy hook → Copy the URL
 *
 * Netlify:
 *   Site dashboard → Site configuration → Build & deploy
 *   → Build hooks → Add build hook → Copy the URL
 *
 * Vercel:
 *   Project Settings → Git → Deploy Hooks → Create Hook → Copy the URL
 */


/**
 * Triggered automatically on every cell edit.
 * Only fires a rebuild if the edit was on the first sheet (the ward data).
 */
function onSheetEdit(e) {
  if (e.source.getActiveSheet().getIndex() !== 1) return;
  triggerDeploy();
}


/**
 * Sends a POST request to the stored deploy webhook URL.
 * Can also be run manually from the Apps Script editor to test.
 */
function triggerDeploy() {
  const webhookUrl = PropertiesService.getScriptProperties()
    .getProperty('DEPLOY_WEBHOOK_URL');

  if (!webhookUrl) {
    Logger.log('ERROR: DEPLOY_WEBHOOK_URL not set.');
    Logger.log('Run setWebhookUrl() first — see setup instructions at the top of this file.');
    return;
  }

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'POST',
      muteHttpExceptions: true,
    });
    Logger.log('Deploy triggered — HTTP ' + response.getResponseCode());
  } catch (err) {
    Logger.log('Deploy trigger failed: ' + err);
  }
}


/**
 * Run this once to securely store your deploy webhook URL.
 * Replace the placeholder below with your actual URL, then run this function.
 */
function setWebhookUrl() {
  const url = 'PASTE_YOUR_DEPLOY_WEBHOOK_URL_HERE';

  if (url === 'PASTE_YOUR_DEPLOY_WEBHOOK_URL_HERE') {
    Logger.log('Please replace the placeholder URL in setWebhookUrl() before running.');
    return;
  }

  PropertiesService.getScriptProperties().setProperty('DEPLOY_WEBHOOK_URL', url);
  Logger.log('Webhook URL saved to Script Properties.');
}
