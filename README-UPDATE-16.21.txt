Wesam Planner – Update 16.21

Fix Google-Anmeldung auf Chrome/Laptop:
- Desktop Chrome verwendet wieder einen direkt durch den Klick gestarteten Google-Popup-Login.
- Redirect bleibt als Fallback, wenn Chrome das Popup blockiert.
- Der Login-Button wird explizit klickbar gehalten (pointer-events, z-index, enabled).
- Firebase-Konfiguration ist im Update enthalten, damit ein fehlendes/stales firebase-config.js den Button nicht still deaktiviert.
- Bei Auth-Fehlern erscheint jetzt eine klare Meldung, z. B. bei nicht autorisierter Domain oder blockierten Popups.
- Service Worker aktualisiert Cloud-Dateien network-first.

Alle Funktionen aus 16.20 bleiben erhalten.
