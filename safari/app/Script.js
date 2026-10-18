// Called by ViewController.m once the page loads: show(platform, enabled, useSettingsInsteadOfPreferences).
function show(platform, enabled, useSettingsInsteadOfPreferences) {
  document.body.classList.add(`platform-${platform}`);
  if (platform === 'mac' && useSettingsInsteadOfPreferences === false) {
    document.querySelector('button.open-preferences').textContent = 'Quit and Open Safari Extensions Preferences…';
  }
  document.body.classList.toggle('state-on', enabled === true);
  document.body.classList.toggle('state-off', enabled === false);
}
document.querySelector('button.open-preferences').addEventListener('click', () => webkit.messageHandlers.controller.postMessage('open-preferences'));
