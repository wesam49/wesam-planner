WESAM PLANNER – UPDATE 16.1

Firebase ist bereits im Paket eingetragen.

Vor dem ersten Test müssen noch zwei Einstellungen in Firebase geprüft werden:

1) AUTORISIERTE DOMAIN
Firebase Console > Authentication > Settings > Authorized domains
Füge hinzu: wesam49.github.io

2) FIRESTORE SECURITY RULES
Firebase Console > Firestore > Rules
Ersetze den Inhalt durch den Inhalt der Datei firestore.rules und klicke auf Publish.
Damit kann jeder angemeldete Benutzer ausschließlich seine eigenen Daten lesen und ändern.

ERSTE VERWENDUNG
- Lade index.html, app.js, cloud.js, firebase-config.js und sw.js in das GitHub-Repository hoch.
- Öffne: https://wesam49.github.io/wesam-planner/?v=16.1
- Auf dem Gerät mit den aktuellen Daten: Mit Google anmelden > Lokale Daten hochladen.
- Auf dem zweiten Gerät: Mit demselben Google-Konto anmelden > Cloud laden.
- Danach läuft die Synchronisierung automatisch.

BACKUP
Alte JSON-Backups bleiben kompatibel. Nach dem Import wird die Änderung bei aktiver Cloud-Synchronisierung automatisch hochgeladen.

HINWEIS
Bei Offline-Nutzung bleiben Änderungen lokal gespeichert und werden nach Wiederherstellung der Verbindung synchronisiert. Bei gleichzeitigen Änderungen auf zwei Geräten gilt die zuletzt gespeicherte Version.
