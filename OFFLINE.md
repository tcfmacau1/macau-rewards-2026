# 澳門消費連環賞：離線發佈

- index.html includes all app CSS, JavaScript and institution logos.
- sw.js atomically caches index.html, manifest.webmanifest and four icons.
- Each release MUST change sw.js VERSION, the HTML app-release meta and client RELEASE to the same new value, committed together with every changed asset.
- The worker checks the HTML marker before installation; a failed download leaves the old worker/cache intact.
- New workers wait for user confirmation. The app does not reload while the entry dialog is open.
- Never change the existing localStorage key or delete user records as part of a cache update.
- Service workers cache application assets only. Records remain in localStorage; users can export JSON for backup. No cross-device sync.
- Verify first online install, full offline relaunch, navigation and record save/reload, then a second-release waiting-worker update before release.
