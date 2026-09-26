const express = require("express");

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

const MINECRAFT_HOST = "play.eclipseworld.pro";
const DISCORD_URL = "https://discord.gg/m3vDUP8Qb6";

app.use(express.static("public"));


// ==========================================
// ESTADO REAL DE MINECRAFT
// ==========================================

app.get("/api/status", async (req, res) => {
    try {
        const apiUrl =
            `https://api.mcsrvstat.us/3/${MINECRAFT_HOST}`;

        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "EclipseWorld-Web/1.0",
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                `API respondió HTTP ${response.status}`
            );
        }

        const data = await response.json();

        console.log(
            "Minecraft API:",
            JSON.stringify(data)
        );


        // ======================================
        // SERVIDOR ONLINE
        // ======================================

        if (data.online === true) {

            const onlinePlayers =
                data.players?.online ?? 0;

            const maxPlayers =
                data.players?.max ?? 0;


            let version =
                data.version ||
                data.protocol?.name ||
                "Minecraft";


            let motd = "";


            if (data.motd?.clean) {

                if (Array.isArray(data.motd.clean)) {
                    motd =
                        data.motd.clean.join(" ");
                } else {
                    motd =
                        data.motd.clean;
                }

            }


            res.json({

                online: true,

                host: MINECRAFT_HOST,

                players: {
                    online: onlinePlayers,
                    max: maxPlayers
                },

                version,

                motd,

                discord: DISCORD_URL,

                updatedAt:
                    new Date().toISOString()

            });

            return;
        }


        // ======================================
        // SERVIDOR OFFLINE
        // ======================================

        res.json({

            online: false,

            host: MINECRAFT_HOST,

            players: {
                online: 0,
                max: 0
            },

            version: "—",

            motd:
                "El servidor está offline.",

            discord: DISCORD_URL,

            updatedAt:
                new Date().toISOString()

        });

    } catch (error) {

        console.error(
            "Error consultando Minecraft:",
            error.message
        );


        res.json({

            online: false,

            host: MINECRAFT_HOST,

            players: {
                online: 0,
                max: 0
            },

            version: "—",

            motd:
                "No se ha podido consultar el servidor.",

            discord: DISCORD_URL,

            updatedAt:
                new Date().toISOString(),

            error:
                error.message

        });

    }
});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});


// ==========================================
// INFORMACIÓN DE DISCORD
// ==========================================

app.get("/api/config", (req, res) => {

    res.json({
        minecraft: MINECRAFT_HOST,
        discord: DISCORD_URL
    });

});


// ==========================================
// RUTAS DE LA WEB
// ==========================================
//
// No usamos app.get("*") porque Express 5
// da error con ese patrón.
//

app.use((req, res) => {

    res.sendFile(
        "index.html",
        {
            root: "public"
        }
    );

});


// ==========================================
// INICIAR
// ==========================================

app.listen(
    PORT,
    HOST,
    () => {

        console.log(
            `Eclipse World web iniciada en ${HOST}:${PORT}`
        );

        console.log(
            `Minecraft: ${MINECRAFT_HOST}`
        );

        console.log(
            `Discord: ${DISCORD_URL}`
        );

    }
);