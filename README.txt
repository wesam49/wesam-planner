Wesam Planner – Update 10

Korrekturen:
- Update 8 muss nicht separat installiert werden; alle September-Daten sind enthalten.
- Gespeicherte Daten werden defensiv geladen und auf die aktuelle Datenstruktur normalisiert.
- September-Termine werden einmalig ergänzt, ohne identische Termine zu verdoppeln.
- Neuer Service Worker lädt index.html und app.js bevorzugt aus dem Netzwerk, damit keine gemischten alten und neuen Versionen entstehen.
- Bei einem JavaScript-Fehler erscheint nun eine sichtbare Fehlermeldung statt einer leeren Oberfläche.
- In der Kopfzeile steht Version 10 zur Kontrolle.
