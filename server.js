const express = require("express");
const dns = require("dns").promises;
const net = require("net");

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

const MINECRAFT_HOST = "play.eclipseworld.pro";
const DEFAULT_PORT = 25565;

// Servir archivos de la carpeta public
app.use(express.static("public"));


// ================================
// RESOLVER DIRECCIÓN DE MINECRAFT
// ================================

async function resolveMinecraftAddress(host) {
    try {
        const srvRecords = await dns.resolveSrv(`_minecraft._tcp.${host}`);

        if (srvRecords && srvRecords.length > 0) {
            const record = srvRecords[0];

            return {
                host: record.name.endsWith(".")
                    ? record.name.slice(0, -1)
                    : record.name,
                port: record.port
            };
        }
    } catch (error) {
        // Si no existe SRV, usamos el puerto estándar.
    }

    return {
        host,
        port: DEFAULT_PORT
    };
}


// ================================
// MINECRAFT VARINT
// ================================

function encodeVarInt(value) {
    const bytes = [];

    while (true) {
        if ((value & ~0x7f) === 0) {
            bytes.push(value);
            break;
        }

        bytes.push((value & 0x7f) | 0x80);
        value >>>= 7;
    }

    return Buffer.from(bytes);
}


function readVarInt(buffer, offset = 0) {
    let numRead = 0;
    let result = 0;

    while (true) {
        if (offset + numRead >= buffer.length) {
            throw new Error("VarInt incompleto");
        }

        const byte = buffer[offset + numRead];

        result |= (byte & 0x7f) << (7 * numRead);

        numRead++;

        if (numRead > 5) {
            throw new Error("VarInt demasiado grande");
        }

        if ((byte & 0x80) === 0) {
            break;
        }
    }

    return {
        value: result,
        size: numRead
    };
}


// ================================
// MINECRAFT STRING
// ================================

function encodeString(value) {
    const data = Buffer.from(value, "utf8");

    return Buffer.concat([
        encodeVarInt(data.length),
        data
    ]);
}


// ================================
// HANDSHAKE
// ================================

function createHandshake(host, port) {

    // Versión de protocolo suficientemente moderna
    const protocolVersion = encodeVarInt(770);

    const serverAddress = encodeString(host);

    const serverPort = Buffer.alloc(2);

    serverPort.writeUInt16BE(port, 0);

    const nextState = encodeVarInt(1);

    const body = Buffer.concat([
        encodeVarInt(0x00),
        protocolVersion,
        serverAddress,
        serverPort,
        nextState
    ]);

    return Buffer.concat([
        encodeVarInt(body.length),
        body
    ]);
}


// ================================
// STATUS REQUEST
// ================================

function createStatusRequest() {
    return Buffer.from([
        0x01,
        0x00
    ]);
}


// ================================
// CONSULTA MINECRAFT
// ================================

function queryMinecraft(host, port, timeout = 6000) {

    return new Promise((resolve, reject) => {

        const socket = new net.Socket();

        let data = Buffer.alloc(0);

        let finished = false;


        function finish(error, result) {

            if (finished) {
                return;
            }

            finished = true;

            socket.destroy();

            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }


        socket.setTimeout(timeout);


        socket.on("timeout", () => {
            finish(new Error("Timeout"));
        });


        socket.on("error", (error) => {
            finish(error);
        });


        socket.on("data", (chunk) => {

            data = Buffer.concat([
                data,
                chunk
            ]);


            try {

                // Longitud del paquete
                const packetLengthInfo =
                    readVarInt(data, 0);

                const packetLength =
                    packetLengthInfo.value;

                const packetStart =
                    packetLengthInfo.size;


                if (
                    data.length <
                    packetStart + packetLength
                ) {
                    return;
                }


                const packet =
                    data.subarray(
                        packetStart,
                        packetStart + packetLength
                    );


                // ID del paquete
                const packetIdInfo =
                    readVarInt(packet, 0);


                if (packetIdInfo.value !== 0x00) {

                    finish(
                        new Error(
                            "Respuesta Minecraft inválida"
                        )
                    );

                    return;
                }


                // Longitud del JSON
                const jsonLengthInfo =
                    readVarInt(
                        packet,
                        packetIdInfo.size
                    );


                const jsonStart =
                    packetIdInfo.size +
                    jsonLengthInfo.size;


                const jsonEnd =
                    jsonStart +
                    jsonLengthInfo.value;


                if (
                    packet.length <
                    jsonEnd
                ) {
                    return;
                }


                const jsonString =
                    packet
                        .subarray(
                            jsonStart,
                            jsonEnd
                        )
                        .toString("utf8");


                const status =
                    JSON.parse(jsonString);


                finish(null, status);

            } catch (error) {

                finish(error);

            }

        });


        socket.connect(
            port,
            host,
            () => {

                try {

                    socket.write(
                        createHandshake(
                            host,
                            port
                        )
                    );

                    socket.write(
                        createStatusRequest()
                    );

                } catch (error) {

                    finish(error);

                }

            }
        );

    });
}


// ================================
// LIMPIAR TEXTO
// ================================

function cleanText(value) {

    if (!value) {
        return "";
    }


    if (typeof value === "string") {

        return value
            .replace(
                /§[0-9a-fklmnor]/gi,
                ""
            )
            .replace(
                /<[^>]*>/g,
                ""
            )
            .trim();

    }


    if (typeof value === "object") {

        let result = "";


        if (value.text) {
            result += value.text;
        }


        if (Array.isArray(value.extra)) {

            for (const item of value.extra) {

                result += cleanText(item);

            }

        }


        return result.trim();

    }


    return "";
}


// ================================
// API DEL ESTADO
// ================================

app.get("/api/status", async (req, res) => {

    try {

        const address =
            await resolveMinecraftAddress(
                MINECRAFT_HOST
            );


        const status =
            await queryMinecraft(
                address.host,
                address.port
            );


        const players =
            status.players || {};


        const onlinePlayers =
            Number(
                players.online || 0
            );


        const maxPlayers =
            Number(
                players.max || 0
            );


        let version =
            "Minecraft";


        if (
            status.version &&
            status.version.name
        ) {

            version =
                status.version.name;

        }


        const motd =
            cleanText(
                status.description
            );


        res.json({

            online: true,

            host: MINECRAFT_HOST,

            resolvedHost:
                address.host,

            port:
                address.port,

            players: {

                online:
                    onlinePlayers,

                max:
                    maxPlayers

            },

            version,

            motd,

            favicon:
                status.favicon || null,

            updatedAt:
                new Date().toISOString()

        });


    } catch (error) {

        console.error(
            "Minecraft status error:",
            error.message
        );


        res.json({

            online: false,

            host:
                MINECRAFT_HOST,

            players: {

                online: 0,

                max: 0

            },

            version:
                "—",

            motd:
                "Servidor no disponible",

            updatedAt:
                new Date().toISOString()

        });

    }

});


// ================================
// HEALTH CHECK PARA RENDER
// ================================

app.get("/health", (req, res) => {

    res.status(200).send("OK");

});


// ================================
// RUTA PRINCIPAL
// ================================
//
// Importante:
// No usamos app.get("*") porque Express 5
// genera un error con ese patrón.
//
// app.use() funciona correctamente.
//

app.use((req, res) => {

    res.sendFile(
        "index.html",
        {
            root: "public"
        }
    );

});


// ================================
// INICIAR SERVIDOR
// ================================

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

    }
);