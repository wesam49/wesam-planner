Wesam Planner – Update 16.10

Neue Funktionen:
1. Einnahmen-Eingangsstatus (nur organisatorisch)
   - Ausstehend
   - Teilweise erhalten
   - Erhalten
   - Optionales Eingangsdatum
   - Funktioniert bei automatischen Einnahmen (VMT, Bib, Brunner, Zusatzjob)
     und bei manuellen Einnahmen.
   - Anzeige: Erwartet / Erhalten / Noch offen.
   - Diese Statuswerte verändern KEINE Finanzberechnung.

2. Klare optische Trennung
   - Einnahmen und Ausgaben sind jetzt jeweils in einem eigenen,
     dünnen dunklen Rahmen mit abgerundeten Ecken.

Zusätzlich:
- VMT-Regeltext korrigiert:
  bis Auszahlungsmonat September 2026 = 15 €/Std.,
  ab Auszahlungsmonat Oktober 2026 = 16 €/Std.
- Service-Worker-Cache auf 16.10 erhöht.

Upload:
Diese Dateien in das Hauptverzeichnis des GitHub-Repositories hochladen.
index.html und sw.js ersetzen; patch-16.10.js neu hinzufügen.
Die übrigen vorhandenen Dateien (app.js, cloud.js usw.) NICHT löschen.
