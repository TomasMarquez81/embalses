/*const axios = require("axios");
const fs = require("fs");
const path = require("path");

const URL =
    "https://services-eu1.arcgis.com/RvnYk1PBUJ9rrAuT/ArcGIS/rest/services/Embalses_Total/FeatureServer/0/query";

const params = {
    f: "json",
    where: "1=1",
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: 5000,
};

async function descargarDatosEmbalses() {
    try {
        const response = await axios.get(URL, {
            params,
            headers: {
                Referer: "https://www.miteco.gob.es/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        // Guardar respuesta completa para análisis
        fs.writeFileSync(
            "api_raw_response.json",
            JSON.stringify(response.data, null, 2)
        );

        // Verificar estructura de campos
        if (response.data.features.length > 0) {
            const primerEmbalse = response.data.features[0].attributes;
            console.log("🔍 Estructura detectada del primer registro:");
            console.log(primerEmbalse);

            // Guardar estructura de campos
            fs.writeFileSync(
                "campos_detectados.json",
                JSON.stringify(Object.keys(primerEmbalse), null, 2)
            );
            console.log(
                "📄 Lista de campos disponibles guardada en campos_detectados.json"
            );
        }

        // Mapeo dinámico
        const datos = response.data.features.map((f) => {
            const attrs = f.attributes;
            return {
                nombre: attrs.NOMBRE || attls.nombre || "Desconocido",
                provincia:
                    attrs.PROVINCIA || attrs.provincia || "Sin provincia",
                comunidad:
                    attrs.COMUNIDAD ||
                    attrs.ccaa ||
                    attrs.comunidad_autonoma ||
                    "Sin CCAA",
                capacidad_total: attrs.CAPACIDAD || attrs.capacidad_total || -1,
                capacidad_actual: attrs.ACTUAL || attrs.capacidad_actual || -1,
                porcentaje: attrs.PORCENTAJE || attrs.porcentaje_lleno || 0,
                datos_crudos: attrs, // Para inspección posterior
            };
        });

        fs.writeFileSync(
            "embalses_mapeados.json",
            JSON.stringify(datos, null, 2)
        );
        console.log(
            "✅ Datos mapeados guardados (incluyen campos crudos para referencia)"
        );
    } catch (error) {
        console.error("Error:", error.message);
    }
}

descargarDatosEmbalses();
*/

const axios = require("axios");
const fs = require("fs");

const URL =
    "https://services-eu1.arcgis.com/RvnYk1PBUJ9rrAuT/ArcGIS/rest/services/Embalses_Total/FeatureServer/0/query";

const params = {
    f: "json",
    where: "fecha >= CURRENT_TIMESTAMP - INTERVAL '30' DAY", // Filtro de últimos 30 días
    outFields: "embalse_nombre,ambito_nombre,agua_total,agua_actual,fecha",
    orderByFields: "fecha DESC",
    returnGeometry: "false",
    resultRecordCount: 500,
};

async function obtenerDatosActualizados() {
    try {
        const response = await axios.get(URL, {
            params,
            headers: {
                Referer: "https://www.miteco.gob.es/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!response.data.features || response.data.features.length === 0) {
            throw new Error("No hay datos recientes");
        }

        const embalses = response.data.features.map((f) => ({
            nombre: f.attributes.embalse_nombre || "Desconocido",
            comunidad: f.attributes.ambito_nombre || "Sin CCAA",
            capacidad_total: f.attributes.agua_total ?? -1,
            capacidad_actual: f.attributes.agua_actual ?? -1,
            ultima_actualizacion: new Date(
                f.attributes.fecha
            ).toLocaleDateString(),
            porcentaje: calcularPorcentaje(
                f.attributes.agua_actual,
                f.attributes.agua_total
            ),
        }));

        fs.writeFileSync(
            "embalses_actualizados.json",
            JSON.stringify(embalses, null, 2)
        );
        console.log(`✅ ${embalses.length} embalses actualizados guardados`);
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("Detalles del error:", {
                status: error.response.status,
                data: error.response.data,
            });
        }
    }
}

function calcularPorcentaje(actual, total) {
    if (!actual || !total || total <= 0) return "0%";
    return `${((actual / total) * 100).toFixed(1)}%`;
}

obtenerDatosActualizados();
