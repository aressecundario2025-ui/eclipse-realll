const SERVER_IP = "play.eclipseworld.pro";
const DISCORD_URL = "https://discord.gg/m3vDUP8Qb6";

const $ = (id) => document.getElementById(id);

// Elementos
const statusDot = $("statusDot");
const statusText = $("statusText");
const serverIp = $("serverIp");
const players = $("players");
const version = $("version");
const serverState = $("serverState");
const motd = $("motd");
const updated = $("updated");
const discordButton = $("discordButton");
const copyIp = $("copyIp");
const copyMessage = $("copyMessage");

// IP
if (serverIp) {
    serverIp.textContent = SERVER_IP;
}

// Discord
if (discordButton) {
    discordButton.href = DISCORD_URL;
    discordButton.target = "_blank";
    discordButton.rel = "noopener noreferrer";
}

// Copiar IP
function copiarIP() {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(SERVER_IP)
            .then(() => mostrarCopiado())
            .catch(() => copiarFallback());
    } else {
        copiarFallback();
    }
}

function copiarFallback() {
    const input = document.createElement("input");
    input.value = SERVER_IP;
    document.body.appendChild(input);
    input.select();

    try {
        document.execCommand("copy");
        mostrarCopiado();
    } catch (error) {
        console.error("No se pudo copiar la IP:", error);
    }

    input.remove();
}

function mostrarCopiado() {
    const botones = [copyIp, copyMessage];

    botones.forEach((boton) => {
        if (!boton) return;

        const textoOriginal = boton.textContent;
        boton.textContent = "✓ COPIADO";

        setTimeout(() => {
            boton.textContent = textoOriginal;
        }, 1500);
    });
}

if (copyIp) {
    copyIp.addEventListener("click", copiarIP);
}

if (copyMessage) {
    copyMessage.addEventListener("click", copiarIP);
}

// Hora de actualización
function formatTime(dateString) {
    if (!dateString) return "—";

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

// Estado cargando
function mostrarCargando() {
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
        serverState.textContent = "Consultando...";
    }

    if (motd) {
        motd.textContent = "Consultando información...";
    }
}

// Servidor online
function mostrarOnline(data) {
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
        version.textContent = data.version || "Desconocida";
    }

    if (serverState) {
        serverState.textContent = "ONLINE";
    }

    if (motd) {
        motd.textContent = data.motd || "Eclipse World";
    }

    if (updated) {
        updated.textContent = formatTime(data.updatedAt);
    }
}

// Servidor offline
function mostrarOffline(data = {}) {
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
        motd.textContent = "El servidor está apagado.";
    }

    if (updated) {
        updated.textContent = formatTime(data.updatedAt);
    }
}

// Obtener información real
async function loadServerStatus() {
    try {
        mostrarCargando();

        const response = await fetch("/api/status", {
            method: "GET",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Estado recibido:", data);

        if (data.online === true) {
            mostrarOnline(data);
        } else {
            mostrarOffline(data);
        }

    } catch (error) {
        console.error("Error obteniendo el estado:", error);

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
            motd.textContent = "No se pudo consultar el servidor.";
        }

        if (updated) {
            updated.textContent = "Error";
        }
    }
}

// Cargar al entrar
document.addEventListener("DOMContentLoaded", () => {
    loadServerStatus();

    // Actualizar cada 30 segundos
    setInterval(loadServerStatus, 30000);
});
