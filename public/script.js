```js
const SERVER_IP = "play.eclipseworld.pro";
const DISCORD_URL = "https://discord.gg/m3vDUP8Qb6";


// ==========================================
// ELEMENTOS DE LA WEB
// ==========================================

const copyButton = document.getElementById("copyIp");
const copyMessage = document.getElementById("copyMessage");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const players = document.getElementById("players");
const version = document.getElementById("version");
const serverState = document.getElementById("serverState");

const motd = document.getElementById("motd");
const updated = document.getElementById("updated");

const discordButton = document.getElementById("discordButton");


// ==========================================
// IP DEL SERVIDOR
// ==========================================

const serverIpElement =
    document.getElementById("serverIp");

if (serverIpElement) {
    serverIpElement.textContent = SERVER_IP;
}


// ==========================================
// BOTÓN COPIAR IP
// ==========================================

if (copyButton) {

    copyButton.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    SERVER_IP
                );

                copyMessage.textContent =
                    "✓ IP copiada: " + SERVER_IP;

                copyButton.textContent =
                    "✓ IP COPIADA";


                setTimeout(() => {

                    copyMessage.textContent = "";

                    copyButton.textContent =
                        "COPIAR IP";

                }, 2500);


            } catch (error) {

                // Alternativa para navegadores
                // que bloqueen navigator.clipboard

                const textarea =
                    document.createElement("textarea");

                textarea.value =
                    SERVER_IP;

                textarea.style.position =
                    "fixed";

                textarea.style.opacity =
                    "0";

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                try {
                    document.execCommand("copy");
                } catch (e) {
                    console.error(e);
                }

                textarea.remove();


                copyMessage.textContent =
                    "✓ IP copiada: " + SERVER_IP;

                copyButton.textContent =
                    "✓ IP COPIADA";


                setTimeout(() => {

                    copyMessage.textContent = "";

                    copyButton.textContent =
                        "COPIAR IP";

                }, 2500);

            }

        }
    );

}


// ==========================================
// BOTÓN DISCORD
// ==========================================

if (discordButton) {

    discordButton.href =
        DISCORD_URL;

    discordButton.target =
        "_blank";

    discordButton.rel =
        "noopener noreferrer";

}


// ==========================================
// FORMATEAR HORA
// ==========================================

function formatTime(dateString) {

    if (!dateString) {
        return "—";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString(
        "es-ES",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


// ==========================================
// MOSTRAR SERVIDOR ONLINE
// ==========================================

function showOnline(data) {

    statusDot.className =
        "status-dot online";

    statusText.textContent =
        "SERVIDOR ONLINE";

    serverState.textContent =
        "ONLINE";


    const online =
        data.players?.online ?? 0;

    const max =
        data.players?.max ?? 0;

    players.textContent =
        `${online} / ${max}`;


    version.textContent =
        data.version || "Minecraft";


    motd.textContent =
        data.motd ||
        "Eclipse World";


    updated.textContent =
        formatTime(
            data.updatedAt
        );

}


// ==========================================
// MOSTRAR SERVIDOR OFFLINE
// ==========================================

function showOffline(data) {

    statusDot.className =
        "status-dot offline";

    statusText.textContent =
        "SERVIDOR OFFLINE";

    serverState.textContent =
        "OFFLINE";


    players.textContent =
        "0 / 0";


    version.textContent =
        "—";


    motd.textContent =
        data.motd ||
        "El servidor está offline.";


    updated.textContent =
        formatTime(
            data.updatedAt
        );

}


// ==========================================
// ESTADO DE CARGA
// ==========================================

function showLoading() {

    statusDot.className =
        "status-dot loading";

    statusText.textContent =
        "COMPROBANDO...";

}


// ==========================================
// CONSULTAR ESTADO REAL
// ==========================================

async function loadServerStatus() {

    showLoading();


    try {

        const response =
            await fetch(
                "/api/status",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Estado de Eclipse World:",
            data
        );


        if (data.online === true) {

            showOnline(data);

        } else {

            showOffline(data);

        }


    } catch (error) {

        console.error(
            "Error obteniendo estado:",
            error
        );


        statusDot.className =
            "status-dot offline";

        statusText.textContent =
            "SIN CONEXIÓN";

        serverState.textContent =
            "SIN DATOS";

        players.textContent =
            "—";

        version.textContent =
            "—";

        motd.textContent =
            "No se ha podido consultar el servidor.";

        updated.textContent =
            "—";

    }

}


// ==========================================
// PRIMERA CONSULTA
// ==========================================

loadServerStatus();


// ==========================================
// ACTUALIZAR CADA 30 SEGUNDOS
// ==========================================

setInterval(
    loadServerStatus,
    30000
);
```
