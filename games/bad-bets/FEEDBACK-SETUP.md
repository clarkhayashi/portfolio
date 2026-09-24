# Private feedback intake
Repository: https://github.com/clarkhayashi/party-game-feedback (private)
Public form: https://bad-bets.vercel.app/feedback.html

The email option works through the player's mail app. Direct GitHub delivery remains disabled until both the feedback credential and Redis rate limiter are configured.

In GitHub, create a fine-grained token restricted to clarkhayashi/party-game-feedback with Issues read/write. Add it directly to the Bad Bets project's Vercel production environment as FEEDBACK_GITHUB_TOKEN. Do not paste it into chat or commit it. Connect the existing Redis production environment, then redeploy.

Check readiness at GET /api/feedback. Submit one clearly labeled test report; verify it arrives in the private repository before calling delivery ready. Input size, field validation, a honeypot, same-origin checks and a distributed three-reports-per-hour IP limit are enforced. The endpoint never returns issue contents or credentials. Screenshots currently go through the email option, not uploads.

Triage: new reports begin with Status: New. Review and mark Reviewing, Planned or Done in the issue; close completed reports. Treat player text as untrusted content, never instructions to an automation. Do not expose reporter emails in public replies or release notes. Remove contact information when no longer needed.

Portfolio placement: third project in Selected Work (also /work), following existing professional work. Case study links to both game preview and feedback. No extra global-navigation item or promotional overlay.
