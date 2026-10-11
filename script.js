"use strict";

// Questions : modifie ou ajoute les tiennes ici
const QUESTIONS = [
    { q: "Quelle balise HTML5 contient le contenu principal d'une page ?",
      options: ["<main>", "<content>", "<center>", "<principal>"], bonne: 0,
      explication: "<main> désigne le contenu principal, utilisé une seule fois par page." },
    { q: "Quelle déclaration CSS active Flexbox sur un conteneur ?",
      options: ["display: flex;", "flex: container;", "position: flex;", "layout: flexbox;"], bonne: 0,
      explication: "display: flex transforme le conteneur en boîte flexible." },
    { q: "Quelle unité CSS dépend de la taille de police de l'élément racine ?",
      options: ["px", "rem", "vh", "%"], bonne: 1,
      explication: "1rem vaut la taille de police de l'élément html." },
    { q: "Quelle règle applique des styles aux écrans de 600px ou moins ?",
      options: ["@media (max-width: 600px)", "@screen (small)", "@responsive 600px", "@media (min-width: 600px)"], bonne: 0,
      explication: "max-width cible les écrans jusqu'à la largeur indiquée." },
    { q: "Quel attribut décrit une image pour les lecteurs d'écran ?",
      options: ["title", "src", "alt", "name"], bonne: 2,
      explication: "L'attribut alt remplace l'image quand elle ne peut pas être vue." },
    { q: "Quelle déclaration CSS crée une grille ?",
      options: ["display: table;", "display: grid;", "grid: on;", "layout: grid;"], bonne: 1,
      explication: "display: grid active la mise en page en grille." },
    { q: "Quelle méthode JavaScript sélectionne un élément par son id ?",
      options: ["document.getElementById()", "document.findId()", "window.selectId()", "document.id()"], bonne: 0,
      explication: "getElementById renvoie l'élément dont l'id correspond." },
    { q: "Quel outil vérifie que ton code HTML est valide ?",
      options: ["Le compilateur Java", "Le validateur W3C", "Le terminal Git", "L'inspecteur réseau"], bonne: 1,
      explication: "Le validateur W3C (validator.w3.org) signale les erreurs de syntaxe." }
];

const $ = (id) => document.getElementById(id);
const ecrans = { accueil: $("accueil"), quiz: $("quiz"), resultat: $("resultat") };

let questions = [];
let index = 0;
let score = 0;
let repondu = false;

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

function demarrer() {
    questions = melanger(QUESTIONS);
    index = 0;
    score = 0;
    montrer("quiz");
    afficherQuestion();
}

function afficherQuestion() {
    const courante = questions[index];
    repondu = false;

    $("compteur").textContent = `Question ${index + 1} sur ${questions.length}`;
    $("score-live").textContent = `Score : ${score}`;
    $("remplissage").style.width = `${(index / questions.length) * 100}%`;
    document.querySelector(".barre").setAttribute("aria-valuenow", String(index));
    $("question").textContent = courante.q;
    $("retour").textContent = "";
    $("retour").className = "retour";
    $("suivante").hidden = true;
    $("suivante").textContent = index === questions.length - 1 ? "Voir mon score" : "Question suivante";

    const liste = $("reponses");
    liste.innerHTML = "";
    melanger(courante.options.map((texte, i) => ({ texte, juste: i === courante.bonne })))
        .forEach((option) => {
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

    $("question").focus();
}

function repondre(bouton, courante) {
    if (repondu) return;
    repondu = true;

    const juste = bouton.dataset.juste === "true";
    if (juste) score++;

    document.querySelectorAll(".reponse").forEach((b) => {
        b.classList.add("verrouille");
        if (b.dataset.juste === "true") b.classList.add("juste");
    });
    if (!juste) bouton.classList.add("faux");

    const bonneReponse = courante.options[courante.bonne];
    $("retour").className = `retour ${juste ? "ok" : "ko"}`;
    $("retour").textContent = juste
        ? `Bonne réponse ! ${courante.explication}`
        : `Raté. La bonne réponse était : ${bonneReponse}. ${courante.explication}`;
    $("score-live").textContent = `Score : ${score}`;
    $("suivante").hidden = false;
    $("suivante").focus();
}

function suivante() {
    index++;
    if (index < questions.length) afficherQuestion();
    else terminer();
}

function terminer() {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    montrer("resultat");
    $("score-final").textContent = `${score} / ${total}`;
    $("cercle").style.setProperty("--pct", `${pct}%`);

    let message = "À retravailler : relis le cours et retente ta chance.";
    if (pct === 100) message = "Parfait, tu maîtrises les bases du web !";
    else if (pct >= 75) message = "Très bien, il ne manque presque rien.";
    else if (pct >= 50) message = "Pas mal, encore un petit effort.";
    $("message").textContent = message;
    $("titre-resultat").focus();
}

$("commencer").addEventListener("click", demarrer);
$("suivante").addEventListener("click", suivante);
$("rejouer").addEventListener("click", demarrer);
