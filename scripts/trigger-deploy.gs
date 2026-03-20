/**
 * Meetinghouse Bulletin — Auto Deploy Trigger (GitHub Pages)
 *
 * Paste this script into your Google Sheet's Apps Script editor to
 * automatically trigger a site rebuild whenever the ward data is edited.
 *
 * ── SETUP ─────────────────────────────────────────────────────────────────────
 *
 * 1. In your Google Sheet, open Extensions → Apps Script
 * 2. Paste this entire file and click Save (disk icon)
 * 3. Create a GitHub Personal Access Token (PAT):
 *      a. github.com → Settings → Developer settings
 *         → Personal access tokens → Fine-grained tokens → Generate new token
 *      b. Set expiration as needed
 *      c. Under Repository access, select your bulletin repo
 *      d. Under Permissions → Repository permissions:
 *           Actions: Read and write
 *      e. Generate and copy the token
 * 4. Store your credentials in Script Properties (run this once):
 *      a. Edit setCredentials() below — fill in your token, username, and repo name
 *      b. In the toolbar, select "setCredentials" from the function dropdown
 *      c. Click Run — you'll be asked to authorise the script
 *      d. Check the Execution Log to confirm "Credentials saved"
 * 5. Add the edit trigger:
 *      a. Click the clock icon (Triggers) in the left sidebar
 *      b. Click "+ Add Trigger" (bottom right)
 *      c. Choose function: onSheetEdit
 *      d. Event source: From spreadsheet
 *      e. Event type: On edit
 *      f. Click Save
 * 6. Enable GitHub Pages in your repo:
 *      a. Repo → Settings → Pages
 *      b. Source: GitHub Actions
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
 * Sends a repository_dispatch event to GitHub Actions, which triggers
 * the deploy workflow. Can also be run manually to test.
 */
function triggerDeploy() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const owner = props.getProperty('GITHUB_OWNER');
  const repo  = props.getProperty('GITHUB_REPO');

  if (!token || !owner || !repo) {
    Logger.log('ERROR: Missing credentials. Run setCredentials() first.');
    return;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ event_type: 'sheet-update' }),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    // GitHub returns 204 No Content on success
    if (code === 204) {
      Logger.log('Deploy triggered successfully.');
    } else {
      Logger.log(`Unexpected response: HTTP ${code} — ${response.getContentText()}`);
    }
  } catch (err) {
    Logger.log('Deploy trigger failed: ' + err);
  }
}


/**
 * Run this once to securely store your GitHub credentials in Script Properties.
 * Fill in the three values below, then run this function.
 */
function setCredentials() {
  const token = 'PASTE_YOUR_GITHUB_PAT_HERE';
  const owner = 'YOUR_GITHUB_USERNAME';
  const repo  = 'YOUR_REPO_NAME';

  if (token === 'PASTE_YOUR_GITHUB_PAT_HERE') {
    Logger.log('Please fill in your token, username, and repo name before running.');
    return;
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('GITHUB_TOKEN', token);
  props.setProperty('GITHUB_OWNER', owner);
  props.setProperty('GITHUB_REPO',  repo);
  Logger.log('Credentials saved to Script Properties.');
}


/**
 * Test the deploy trigger manually without editing the sheet.
 */
function testDeploy() {
  triggerDeploy();
}
