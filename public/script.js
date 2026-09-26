const SERVER_IP = "play.eclipseworld.pro";
const DISCORD_URL = "https://discord.gg/m3vDUP8Qb6";

const $ = (id) => document.getElementById(id);


// ==============================
// ELEMENTOS
// ==============================

const statusDot = $("statusDot");
const statusText = $("statusText");

const serverIp = $("serverIp");
const heroIp = $("heroIp");

const players = $("players");
const version = $("version");
const serverState = $("serverState");
const motd = $("motd");
const updated = $("updated");

const discordButton = $("discordButton");

const copyIp = $("copyIp");
const heroCopy = $("heroCopy");
const heroCopySmall = $("heroCopySmall");

const toast = $("toast");


// ==============================
// CONFIGURACIÓN
// ==============================

if (serverIp) {
    serverIp.textContent = SERVER_IP;
}

if (heroIp) {
    heroIp.textContent = SERVER_IP;
}

if (discordButton) {
    discordButton.href = DISCORD_URL;
}


// ==============================
// COPIAR IP
// ==============================

async function copyServerIp() {

    try {

        if (navigator.clipboard && window.isSecureContext) {

            await navigator.clipboard.writeText(SERVER_IP);

        } else {

            const input = document.createElement("input");

            input.value = SERVER_IP;

            document.body.appendChild(input);

            input.select();

            document.execCommand("copy");

            input.remove();
        }

        showToast();

    } catch (error) {

        console.error("Error copiando IP:", error);

    }
}


function showToast() {

    if (!toast) return;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);
}


if (copyIp) {
    copyIp.addEventListener("click", copyServerIp);
}

if (heroCopy) {
    heroCopy.addEventListener("click", copyServerIp);
}

if (heroCopySmall) {
    heroCopySmall.addEventListener("click", copyServerIp);
}


// ==============================
// HORA
// ==============================

function formatTime(dateString) {

    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


// ==============================
// ESTADO CARGANDO
// ==============================

function showLoading() {

    if (statusDot) {
        statusDot.className = "status-dot loading";
    }

    if (statusText) {
        statusText.textContent = "COMPROBANDO...";
    }

    if (players) {
        players.textContent = "—";
    }

    if (version) {
        version.textContent = "—";
    }

    if (serverState) {
        serverState.textContent = "CONSULTANDO";
    }

    if (motd) {
        motd.textContent = "Consultando información...";
    }
}


// ==============================
// SERVIDOR ONLINE
// ==============================

function showOnline(data) {

    if (statusDot) {
        statusDot.className = "status-dot online";
    }

    if (statusText) {
        statusText.textContent = "● LIVE";
    }

    if (players) {

        const online = data.players?.online ?? 0;
        const max = data.players?.max ?? 0;

        players.textContent = `${online}/${max}`;
    }

    if (version) {
        version.textContent =
            data.version ||
            data.protocol?.name ||
            "Minecraft";
    }

    if (serverState) {
        serverState.textContent = "ONLINE";
    }

    if (motd) {

        motd.textContent =
            data.motd ||
            "Eclipse World";

    }

    if (updated) {
        updated.textContent = formatTime(data.updatedAt);
    }

    // Cambiar todos los indicadores LIVE
    document
        .querySelectorAll(".server-online .status-dot")
        .forEach(dot => {

            dot.className = "status-dot online";

        });
}


// ==============================
// SERVIDOR OFFLINE
// ==============================

function showOffline(data = {}) {

    if (statusDot) {
        statusDot.className = "status-dot offline";
    }

    if (statusText) {
        statusText.textContent = "● OFFLINE";
    }

    if (players) {
        players.textContent = "0/0";
    }

    if (version) {
        version.textContent = data.version || "—";
    }

    if (serverState) {
        serverState.textContent = "OFFLINE";
    }

    if (motd) {
        motd.textContent = "El servidor está actualmente apagado.";
    }

    if (updated) {
        updated.textContent = formatTime(data.updatedAt);
    }

    document
        .querySelectorAll(".server-online .status-dot")
        .forEach(dot => {

            dot.className = "status-dot offline";

        });
}


// ==============================
// ERROR
// ==============================

function showError() {

    if (statusDot) {
        statusDot.className = "status-dot offline";
    }

    if (statusText) {
        statusText.textContent = "● ERROR";
    }

    if (players) {
        players.textContent = "—";
    }

    if (version) {
        version.textContent = "—";
    }

    if (serverState) {
        serverState.textContent = "SIN DATOS";
    }

    if (motd) {
        motd.textContent =
            "No se pudo consultar el estado del servidor.";
    }

    document
        .querySelectorAll(".server-online .status-dot")
        .forEach(dot => {

            dot.className = "status-dot offline";

        });
}


// ==============================
// CONSULTAR SERVIDOR
// ==============================

async function loadServerStatus() {

    try {

        showLoading();

        const response = await fetch(
            `/api/status?t=${Date.now()}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data = await response.json();

        console.log(
            "Eclipse World — estado:",
            data
        );

        if (data.online === true) {

            showOnline(data);

        } else {

            showOffline(data);

        }

    } catch (error) {

        console.error(
            "Eclipse World — error:",
            error
        );

        showError();
    }
}


// ==============================
// ANIMACIÓN AL HACER SCROLL
// ==============================

const observer = new IntersectionObserver(
    (entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

            }

        });

    },
    {
        threshold: 0.12
    }
);


document
    .querySelectorAll(
        ".feature-card, .server-card, .community-card"
    )
    .forEach(element => {

        element.classList.add("scroll-hidden");

        observer.observe(element);

    });


// ==============================
// INICIO
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadServerStatus();

        // Actualizar cada 30 segundos
        setInterval(
            loadServerStatus,
            30000
        );

    }
);
