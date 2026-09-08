Wesam Planner – Update 16.15

BUGFIX – Aufgaben verschwinden nach erneutem Öffnen:
- Ursache behoben: app.js hat beim ersten Rendern zusätzliche Datenfelder
  (Aufgaben und Einnahmen-Eingangsstatus) vor dem Laden der Erweiterungen entfernt.
- Aufgaben und Einnahmenstatus werden jetzt VOR app.js aus dem lokalen Speicher
  gesichert und danach wieder in den State übernommen.
- tasks-16.15.js wird vor der Cloud-Synchronisierung initialisiert.
- Bereits geplante, verschwundene Aufgaben werden automatisch aus Kalender-Terminen
  mit Notiz „Aufgabe: …“ wiederhergestellt.
- Dabei werden Titel, Datum, Uhrzeit-Verknüpfung und Dauer rekonstruiert.
  Kategorie/Priorität können nur erhalten bleiben, wenn sie noch lokal/in der Cloud
  vorhanden sind; aus einem Kalender-Termin allein sind sie nicht rekonstruierbar.
- Kategorienfarben und Datumssortierung aus 16.14 bleiben erhalten.

Enthält weiterhin alle bisherigen Funktionen.
