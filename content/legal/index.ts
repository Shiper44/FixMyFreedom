/**
 * TEXTOS LEGALES CENTRALIZADOS
 * ============================
 * Este es el ÚNICO lugar donde se definen los textos legales, avisos y
 * advertencias de la web, los correos y las notificaciones. Todos están
 * pendientes de revisión por un abogado: los textos entre corchetes [ ]
 * son datos que hay que completar.
 *
 * Si cambias DISCLAIMER_ACEPTACION.texto, cambia también su `version`:
 * cada aceptación se guarda con la versión del texto que el usuario vio.
 */

export const ESTADO_REVISION = "PENDIENTE DE REVISIÓN LEGAL";

/** Quién elabora las carteras modelo. Aparece en cada notificación de cambio. */
export const AUTOR = {
  nombre: "[NOMBRE DE LA ENTIDAD O AUTOR]",
  identificacion: "[NIF, DOMICILIO Y DATOS DE CONTACTO]",
  cualificacion: "[DESCRIPCIÓN BREVE DE LA CUALIFICACIÓN O EXPERIENCIA DEL AUTOR]",
};

/** Casilla obligatoria antes del pago. */
export const DISCLAIMER_ACEPTACION = {
  version: "2026-11-04.v1",
  texto:
    "Elijo esta cartera por decisión propia. Entiendo que es una cartera modelo genérica, no adaptada a mi situación personal, y que no constituye asesoramiento en materia de inversión.",
};

/** Avisos breves reutilizados en la web, los correos y las notificaciones. */
export const AVISOS = {
  noRegulada:
    "FixMyFreedom no es una empresa de servicios de inversión ni está registrada o supervisada por la CNMV. No presta asesoramiento en materia de inversión.",
  contenidoGenerico:
    "Contenido genérico: es el mismo para todas las personas suscritas a esta cartera y no tiene en cuenta la situación personal, los objetivos ni el perfil de nadie.",
  rentabilidadPasada:
    "Las rentabilidades pasadas no garantizan rentabilidades futuras. Invertir conlleva riesgo de pérdida, incluida la pérdida de todo el capital invertido.",
  rentabilidadSimulada:
    "Datos simulados: la cartera modelo todavía no tiene histórico real. Estas cifras se han calculado de forma retrospectiva con la composición actual y no reflejan resultados obtenidos por nadie. Las rentabilidades simuladas o pasadas no son un indicador fiable de resultados futuros.",
  conflictosInteres:
    "Conflictos de interés: [DECLARAR AQUÍ SI EL AUTOR O FIXMYFREEDOM TIENEN POSICIONES EN LOS INSTRUMENTOS MENCIONADOS, RELACIONES CON SUS EMISORES O CUALQUIER OTRO INTERÉS. SI NO LOS HAY, INDICARLO EXPRESAMENTE].",
  decisionPropia:
    "Cada persona decide por su cuenta si replica o no la cartera modelo, total o parcialmente, y es responsable de sus decisiones.",
};

export type SeccionLegal = { titulo: string; parrafos: string[] };
export type DocumentoLegal = { slug: string; titulo: string; secciones: SeccionLegal[] };

export const DOCUMENTOS: DocumentoLegal[] = [
  {
    slug: "aviso-legal",
    titulo: "Aviso legal",
    secciones: [
      {
        titulo: "Titular de la web",
        parrafos: [
          `Titular: ${AUTOR.nombre}. Identificación: ${AUTOR.identificacion}.`,
          "[DATOS REGISTRALES, CORREO DE CONTACTO Y DEMÁS INFORMACIÓN EXIGIDA POR LA LEY 34/2002 (LSSI)].",
        ],
      },
      {
        titulo: "Naturaleza del servicio",
        parrafos: [
          "FixMyFreedom publica tres carteras modelo genéricas y avisa a sus suscriptores cuando la composición de una cartera modelo cambia.",
          AVISOS.noRegulada,
          AVISOS.contenidoGenerico,
          AVISOS.decisionPropia,
        ],
      },
      {
        titulo: "Propiedad intelectual",
        parrafos: ["[CONDICIONES DE USO DE LOS CONTENIDOS, MARCAS Y LOGOTIPOS]."],
      },
    ],
  },
  {
    slug: "riesgos",
    titulo: "Advertencia de riesgos",
    secciones: [
      {
        titulo: "Riesgos de invertir",
        parrafos: [
          AVISOS.rentabilidadPasada,
          "El nivel de riesgo de cada cartera se expresa en una escala de 1 (menor) a 7 (mayor). Un nivel bajo no significa que la inversión esté libre de riesgo.",
          "[RIESGOS ESPECÍFICOS POR CLASE DE ACTIVO: RENTA VARIABLE, RENTA FIJA, MATERIAS PRIMAS, DIVISA, LIQUIDEZ...].",
        ],
      },
      {
        titulo: "Rentabilidad mostrada",
        parrafos: [AVISOS.rentabilidadSimulada],
      },
      { titulo: "Conflictos de interés", parrafos: [AVISOS.conflictosInteres] },
    ],
  },
  {
    slug: "condiciones",
    titulo: "Condiciones de suscripción",
    secciones: [
      {
        titulo: "Objeto",
        parrafos: [
          "La suscripción da acceso a la composición completa de una cartera modelo, a su histórico de cambios y a los avisos cuando cambia. Cada cartera se contrata y se cancela por separado.",
        ],
      },
      {
        titulo: "Precio y pago",
        parrafos: [
          "Cartera Conservadora: 1 € al mes. Cartera Moderada: 2,50 € al mes. Cartera Dinámica: 4 € al mes. [IMPUESTOS INCLUIDOS O NO].",
          "El pago se gestiona a través de Stripe. La suscripción se renueva cada mes hasta que se cancela.",
        ],
      },
      {
        titulo: "Cancelación y desistimiento",
        parrafos: ["[CONDICIONES DE CANCELACIÓN, REEMBOLSOS Y DERECHO DE DESISTIMIENTO DE 14 DÍAS]."],
      },
      {
        titulo: "Aceptación previa al pago",
        parrafos: [`Antes de pagar, la persona marca esta casilla: «${DISCLAIMER_ACEPTACION.texto}»`],
      },
    ],
  },
  {
    slug: "privacidad",
    titulo: "Política de privacidad",
    secciones: [
      {
        titulo: "Datos que tratamos",
        parrafos: [
          "Nombre, correo electrónico, carteras suscritas, canales de aviso elegidos (y, si se activan, teléfono de WhatsApp o usuario de Telegram), datos de pago gestionados por Stripe y registro de aceptación del aviso previo al pago.",
          "No pedimos ni guardamos datos sobre tu situación financiera, edad, ingresos, objetivos ni perfil de riesgo.",
        ],
      },
      {
        titulo: "Responsable, finalidad, base legal y conservación",
        parrafos: ["[RESPONSABLE, FINALIDADES, BASES DE LEGITIMACIÓN, PLAZOS DE CONSERVACIÓN, ENCARGADOS (STRIPE, PROVEEDOR DE CORREO, WHATSAPP, TELEGRAM) Y TRANSFERENCIAS INTERNACIONALES]."],
      },
      { titulo: "Tus derechos", parrafos: ["[CÓMO EJERCER LOS DERECHOS DEL RGPD Y RECLAMAR ANTE LA AEPD]."] },
    ],
  },
  {
    slug: "cookies",
    titulo: "Política de cookies",
    secciones: [{ titulo: "Cookies que usamos", parrafos: ["[LISTADO DE COOKIES TÉCNICAS DE SESIÓN Y, EN SU CASO, DE TERCEROS]."] }],
  },
];

export function documentoLegal(slug: string): DocumentoLegal | undefined {
  return DOCUMENTOS.find((d) => d.slug === slug);
}
