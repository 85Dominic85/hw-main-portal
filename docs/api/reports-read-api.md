# API de lectura de informes

API de solo lectura para que agentes y automatizaciones lean los informes del
portal. Autenticación por API key en cabecera, misma convención que MainOps y HSM.

## Qué expone

- Informes **publicados y borradores**. Los archivados no aparecen.
- Contenido **completo**, incluida la sección **Performance del equipo**
  (valoraciones de personas). Decisión del 2026-10-29: la clave da más acceso
  de lectura que una cuenta de admin, así que se trata como una contraseña.
- Nada de escritura: solo `GET`.

## Autenticación

```
X-API-Key: <REPORTS_READ_API_KEY>
```

| Respuesta | Cuándo |
| --- | --- |
| `503` | `REPORTS_READ_API_KEY` no está configurada o tiene menos de 32 caracteres. La API queda cerrada. |
| `401` | Falta la cabecera `X-API-Key`. |
| `403` | La clave no coincide. |

Todas las respuestas llevan `Cache-Control: private, no-store`.

## Endpoints

### `GET /api/external/reports`

Lista de informes, del más reciente al más antiguo (máx. 500).

Filtros opcionales: `?status=published|draft` y `?type=weekly|monthly|custom`.

```json
{
  "reports": [
    {
      "id": "…uuid…",
      "type": "weekly",
      "periodKey": "W40-2026",
      "periodLabel": "Semana 40 · 28 sept – 4 oct 2026",
      "title": "…",
      "status": "published",
      "globalStatus": "verde",
      "publishedAt": "2026-10-05T09:12:00.000Z",
      "updatedAt": "2026-10-05T09:12:00.000Z"
    }
  ]
}
```

### `GET /api/external/reports/{id}`

Un informe completo: los mismos campos que en la lista, más:

- `markdown`: el informe en Markdown, igual que el export del portal, con Performance. Es lo más cómodo para un agente.
- `content`: el contenido estructurado (JSON por secciones).
- `kpiSnapshot`: los KPIs congelados al publicar, o `null`.

Devuelve `404` si no existe, está archivado o el id no es un UUID.

## Uso

```bash
curl -s -H "X-API-Key: $REPORTS_READ_API_KEY" \
  https://hw-portal.qamarero.com/api/external/reports

curl -s -H "X-API-Key: $REPORTS_READ_API_KEY" \
  https://hw-portal.qamarero.com/api/external/reports/<id> | jq -r .markdown
```

## Alta, rotación y baja de la clave

1. Generar: `openssl rand -hex 32`.
2. Guardarla en Vercel como `REPORTS_READ_API_KEY` (Production) y en el gestor
   de secretos del agente. **Nunca** en el repo, en un chat ni en el prompt del agente.
3. Redeploy en Vercel para que la tome.
4. Rotar: generar otra, sustituirla en Vercel y en el agente, redeploy.
5. Cortar el acceso: borrar la variable en Vercel y redeploy (la API pasa a 503).

Cada llamada deja una línea `[external-api]` en los logs de Vercel
(endpoint, filtros o id), sin la clave.
