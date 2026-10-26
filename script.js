"use strict";

// ===== Réglages du jeu =====
const DUREE = 15;          // secondes par question
const POINTS_MAX = 100;    // points pour une réponse immédiate
const PENALITE = 5;        // points perdus par seconde écoulée
const POINTS_MIN = 25;     // minimum pour une bonne réponse
const CLE_SCORES = "quiz-meilleurs-scores";

// ===== Questions : "qcm" (4 choix) ou "vf" (Vrai/Faux) =====
const QUESTIONS = [
    { type: "qcm", q: "Quelle balise HTML5 contient le contenu principal d'une page ?",
      options: ["<main>", "<content>", "<center>", "<principal>"], bonne: 0,
      explication: "<main> désigne le contenu principal, utilisé une seule fois par page." },
    { type: "qcm", q: "Quelle déclaration CSS active Flexbox sur un conteneur ?",
      options: ["display: flex;", "flex: container;", "position: flex;", "layout: flexbox;"], bonne: 0,
      explication: "display: flex transforme le conteneur en boîte flexible." },
    { type: "qcm", q: "Quelle unité CSS dépend de la taille de police de l'élément racine ?",
      options: ["px", "rem", "vh", "%"], bonne: 1,
      explication: "1rem vaut la taille de police de l'élément html." },
    { type: "qcm", q: "Quelle règle applique des styles aux écrans de 600px ou moins ?",
      options: ["@media (max-width: 600px)", "@screen (small)", "@responsive 600px", "@media (min-width: 600px)"], bonne: 0,
      explication: "max-width cible les écrans jusqu'à la largeur indiquée." },
    { type: "qcm", q: "Quel attribut décrit une image pour les lecteurs d'écran ?",
      options: ["title", "src", "alt", "name"], bonne: 2,
      explication: "L'attribut alt remplace l'image quand elle ne peut pas être vue." },
    { type: "qcm", q: "Quelle déclaration CSS crée une grille ?",
      options: ["display: table;", "display: grid;", "grid: on;", "layout: grid;"], bonne: 1,
      explication: "display: grid active la mise en page en grille." },
    { type: "qcm", q: "Quelle méthode JavaScript sélectionne un élément par son id ?",
      options: ["document.getElementById()", "document.findId()", "window.selectId()", "document.id()"], bonne: 0,
      explication: "getElementById renvoie l'élément dont l'id correspond." },
    { type: "qcm", q: "Quel outil vérifie que ton code HTML est valide ?",
      options: ["Le compilateur Java", "Le validateur W3C", "Le terminal Git", "L'inspecteur réseau"], bonne: 1,
      explication: "Le validateur W3C (validator.w3.org) signale les erreurs de syntaxe." },
    { type: "vf", q: "Vrai ou faux : Java et JavaScript sont le même langage.",
      options: ["Vrai", "Faux"], bonne: 1,
      explication: "Ce sont deux langages différents, malgré la ressemblance des noms." },
    { type: "vf", q: "Vrai ou faux : la balise <div> a un sens sémantique précis.",
      options: ["Vrai", "Faux"], bonne: 1,
      explication: "<div> est un conteneur neutre, contrairement à <main> ou <header>." }
];

const $ = (id) => document.getElementById(id);
const ecrans = { accueil: $("accueil"), quiz: $("quiz"), resultat: $("resultat") };

let questions = [];
let index = 0;
let score = 0;
let bonnes = 0;
let repondu = false;
let minuteur = null;
let debut = 0;

function melanger(tableau) {
    const copie = [...tableau];
    for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
}

function montrer(nom) {
    Object.entries(ecrans).forEach(([cle, el]) => { el.hidden = cle !== nom; });
}

// Relance l'animation d'entrée (transition entre les questions)
function animer() {
    [$("question"), $("reponses")].forEach((el) => {
        el.classList.remove("anim");
        void el.offsetWidth;
        el.classList.add("anim");
    });
}

// ===== Chronomètre =====
function majChrono(reste) {
    $("chrono").textContent = `⏱ ${Math.ceil(reste)} s`;
    $("chrono-remplissage").style.width = `${(reste / DUREE) * 100}%`;
    $("chrono-barre").classList.toggle("urgent", reste <= 5);
}

function arreterChrono() {
    clearInterval(minuteur);
    minuteur = null;
}

function lancerChrono(courante) {
    arreterChrono();
    debut = performance.now();
    majChrono(DUREE);
    minuteur = setInterval(() => {
        const reste = Math.max(0, DUREE - (performance.now() - debut) / 1000);
        majChrono(reste);
        if (reste <= 0) repondre(null, courante);   // temps écoulé
    }, 100);
}

// ===== Meilleurs scores (localStorage) =====
function lireScores() {
    try { return JSON.parse(localStorage.getItem(CLE_SCORES)) || []; } catch (e) { return []; }
}

function ecrireScores(liste) {
    try { localStorage.setItem(CLE_SCORES, JSON.stringify(liste)); } catch (e) { /* stockage indisponible */ }
}

function afficherScores() {
    const liste = lireScores();
    document.querySelectorAll(".classement").forEach((ol) => {
        ol.innerHTML = "";
        if (liste.length === 0) {
            const li = document.createElement("li");
            li.className = "vide";
            li.textContent = "Aucun score pour l'instant.";
            ol.appendChild(li);
            return;
        }
        liste.forEach((s) => {
            const li = document.createElement("li");
            const nom = document.createElement("span");
            const pts = document.createElement("span");
            nom.textContent = `${s.nom} (${s.date})`;   // textContent : pas d'injection de code
            pts.textContent = `${s.score} pts`;
            li.append(nom, pts);
            ol.appendChild(li);
        });
    });
}

function enregistrerScore() {
    const scores = lireScores();
    const record = score > 0 && (scores.length === 0 || score > scores[0].score);
    scores.push({
        nom: $("pseudo").value.trim() || "Anonyme",
        score,
        date: new Date().toLocaleDateString("fr-FR")
    });
    scores.sort((a, b) => b.score - a.score);
    ecrireScores(scores.slice(0, 5));
    afficherScores();
    return record;
}

// ===== Déroulement du quiz =====
function demarrer() {
    arreterChrono();
    questions = melanger(QUESTIONS);
    index = 0;
    score = 0;
    bonnes = 0;
    document.querySelector(".barre").setAttribute("aria-valuemax", String(questions.length));
    montrer("quiz");
    afficherQuestion();
}

function afficherQuestion() {
    const courante = questions[index];
    repondu = false;

    $("compteur").textContent = `Question ${index + 1} sur ${questions.length}`;
    $("score-live").textContent = `Score : ${score} pts`;
    $("remplissage").style.width = `${(index / questions.length) * 100}%`;
    document.querySelector(".barre").setAttribute("aria-valuenow", String(index));
    $("question").textContent = courante.q;
    $("retour").textContent = "";
    $("retour").className = "retour";
    $("suivante").hidden = true;
    $("suivante").textContent = index === questions.length - 1 ? "Voir mon score" : "Question suivante";

    // Vrai/Faux : on garde l'ordre ; QCM : on mélange les choix
    const options = courante.options.map((texte, i) => ({ texte, juste: i === courante.bonne }));
    const affichees = courante.type === "vf" ? options : melanger(options);

    const liste = $("reponses");
    liste.innerHTML = "";
    affichees.forEach((option) => {
        const li = document.createElement("li");
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "reponse";
        bouton.textContent = option.texte;
        bouton.dataset.juste = String(option.juste);
        bouton.addEventListener("click", () => repondre(bouton, courante));
        li.appendChild(bouton);
        liste.appendChild(li);
    });

    animer();
    $("question").focus();
    lancerChrono(courante);
}

// bouton === null : le temps est écoulé sans réponse
function repondre(bouton, courante) {
    if (repondu) return;
    repondu = true;
    arreterChrono();

    const ecoule = Math.floor((performance.now() - debut) / 1000);
    const tempsEcoule = bouton === null;
    const juste = !tempsEcoule && bouton.dataset.juste === "true";

    // Score avec pénalité de temps : -5 points par seconde, minimum 25
    const gain = juste ? Math.max(POINTS_MIN, POINTS_MAX - PENALITE * ecoule) : 0;
    if (juste) { score += gain; bonnes++; }

    document.querySelectorAll(".reponse").forEach((b) => {
        b.classList.add("verrouille");
        if (b.dataset.juste === "true") b.classList.add("juste");
    });
    if (!juste && !tempsEcoule) bouton.classList.add("faux");

    const bonneReponse = courante.options[courante.bonne];
    let message;
    if (juste) message = `Bonne réponse ! +${gain} points. ${courante.explication}`;
    else if (tempsEcoule) message = `Temps écoulé ! La bonne réponse était : ${bonneReponse}. ${courante.explication}`;
    else message = `Raté, +0 point. La bonne réponse était : ${bonneReponse}. ${courante.explication}`;

    $("retour").className = `retour ${juste ? "ok" : "ko"}`;
    $("retour").textContent = message;
    $("score-live").textContent = `Score : ${score} pts`;
    $("suivante").hidden = false;
    $("suivante").focus();
}

function suivante() {
    index++;
    if (index < questions.length) afficherQuestion();
    else terminer();
}

function terminer() {
    arreterChrono();
    const total = questions.length;
    const maximum = total * POINTS_MAX;
    const pct = Math.round((score / maximum) * 100);
    const record = enregistrerScore();

    montrer("resultat");
    $("score-final").textContent = `${score} pts`;
    $("cercle").style.setProperty("--pct", `${pct}%`);
    $("detail").textContent = `${bonnes} bonne${bonnes > 1 ? "s" : ""} réponse${bonnes > 1 ? "s" : ""} sur ${total} · maximum ${maximum} pts`;

    let message = "À retravailler : relis le cours et retente ta chance.";
    if (pct >= 90) message = "Parfait, tu maîtrises les bases du web, et vite !";
    else if (pct >= 70) message = "Très bien, il ne manque presque rien.";
    else if (pct >= 40) message = "Pas mal, encore un petit effort.";
    if (record) message += " Nouveau record !";
    $("message").textContent = message;
    $("titre-resultat").focus();
}

$("commencer").addEventListener("click", demarrer);
$("suivante").addEventListener("click", suivante);
$("rejouer").addEventListener("click", demarrer);
$("effacer").addEventListener("click", () => { ecrireScores([]); afficherScores(); });
afficherScores();
