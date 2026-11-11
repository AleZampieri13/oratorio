/* Collegamento a Firebase.
   - CONFIG_VERO: il database della serata vera.
   - CONFIG_PROVA: un secondo progetto Firebase per le prove (vedi docs/GUIDA-GITHUB.md, punto 3.6).
     Finché è null, anche le prove usano il database vero.
   - SITI_VERI: gli indirizzi che usano il database vero. Tutti gli altri (link di prova di Netlify,
     computer) usano CONFIG_PROVA, se c'è. */
var CONFIG_VERO = {
  apiKey: "AIzaSyC6_LMS1TNnERJi1Lq_kjGQj0zTqJaA0cM",
  authDomain: "giovanichef-65d46.firebaseapp.com",
  databaseURL: "https://giovanichef-65d46-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "giovanichef-65d46",
  storageBucket: "giovanichef-65d46.firebasestorage.app",
  messagingSenderId: "964473093372",
  appId: "1:964473093372:web:7bf7edc80a7826cdc9eb79"
};
var CONFIG_PROVA = null;
var SITI_VERI = ["giovanichef.netlify.app", "giovanichef-65d46.web.app", "giovanichef-65d46.firebaseapp.com"];

var DB_PROVA = !!CONFIG_PROVA && SITI_VERI.indexOf(location.hostname) < 0;
var EMBEDDED_CONFIG = DB_PROVA ? CONFIG_PROVA : CONFIG_VERO;
if (DB_PROVA) document.title = "PROVA · " + document.title;
