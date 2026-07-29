WESAM PLANNER UPDATE 16.0 – FIREBASE EINRICHTUNG

1. Öffne https://console.firebase.google.com und erstelle ein Projekt.
2. Füge eine Web-App hinzu.
3. Kopiere die firebaseConfig-Werte in firebase-config.js.
4. Aktiviere Authentication > Sign-in method > Google.
5. Füge unter Authentication > Settings > Authorized domains hinzu:
   wesam49.github.io
6. Erstelle Firestore Database.
7. Verwende diese Firestore-Regeln:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

8. Lade alle Dateien dieses Updates in dein GitHub-Repository hoch.
9. Öffne: https://wesam49.github.io/wesam-planner/?v=16.0
10. Melde dich zuerst auf dem Gerät an, auf dem deine aktuellen Daten liegen, und wähle „Lokale Daten hochladen“.
11. Melde dich danach auf iPhone/iPad mit demselben Google-Konto an und wähle „Cloud laden“.

Alte JSON-Backups bleiben kompatibel und können weiterhin importiert werden.
