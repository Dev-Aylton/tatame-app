const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const protectedReferences = [
  { table: "vinculos", key: "aluno_id", columns: ["aluno_id", "professor_id"] },
  { table: "pedidos_vinculo", key: "id", columns: ["aluno_id", "professor_id"] },
  { table: "instrutores_professor", key: "instrutor_id", columns: ["instrutor_id", "professor_id"] },
  { table: "conversas_professor", key: "id", columns: ["professor_id", "participante_id"] },
  { table: "feedbacks", key: "id", columns: ["professor_id", "aluno_id"] },
  { table: "metas", key: "id", columns: ["professor_id", "aluno_id"] },
  { table: "notas_privadas", key: "id", columns: ["professor_id", "aluno_id"] },
  { table: "aulas_delegadas", key: "instrutor_id", columns: ["instrutor_id", "professor_id"] },
  { table: "regras_cobranca", key: "id", columns: ["professor_id", "aluno_id"] },
  { table: "cobrancas_mensais", key: "id", columns: ["professor_id", "aluno_id"] },
  { table: "graduacoes", key: "id", columns: ["professor_id", "aluno_id"] }
];

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function authorizationHeaders(apiKey: string, bearer: string, extra: Record<string, string> = {}) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${bearer}`,
    Accept: "application/json",
    ...extra
  };
}

async function requestJson(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    return null;
  }

  let body: unknown = null;
  if (response.status !== 204) {
    try {
      body = await response.json();
    } catch {
      if (response.ok) return null;
    }
  }
  return { response, body };
}

async function requestWithoutBody(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}

async function hasProtectedReference(
  baseUrl: string,
  serviceRoleKey: string,
  reference: typeof protectedReferences[number],
  userId: string
) {
  const query = new URLSearchParams({
    select: reference.key,
    limit: "1",
    or: `(${reference.columns.map((column) => `${column}.eq.${userId}`).join(",")})`
  });
  const result = await requestJson(`${baseUrl}/rest/v1/${reference.table}?${query}`, {
    headers: authorizationHeaders(serviceRoleKey, serviceRoleKey)
  });
  if (!result || !result.response.ok || !Array.isArray(result.body)) return null;
  return result.body.length > 0;
}

async function removeProfilePhoto(
  baseUrl: string,
  serviceRoleKey: string,
  userId: string,
  table: string,
  column: string,
  bucket: string
) {
  const query = new URLSearchParams({
    select: "caminho_storage",
    [column]: `eq.${userId}`,
    limit: "1"
  });
  const photoResult = await requestJson(`${baseUrl}/rest/v1/${table}?${query}`, {
    headers: authorizationHeaders(serviceRoleKey, serviceRoleKey)
  });
  if (!photoResult || !photoResult.response.ok || !Array.isArray(photoResult.body)) return false;

  const photo = photoResult.body[0];
  if (photo !== undefined) {
    if (!isRecord(photo) || photo.caminho_storage !== `${userId}/foto`) return false;
    const objectUrl = `${baseUrl}/storage/v1/object/${bucket}/${userId}/foto`;
    const storageResponse = await requestWithoutBody(objectUrl, {
      method: "DELETE",
      headers: authorizationHeaders(serviceRoleKey, serviceRoleKey)
    });
    if (!storageResponse || (!storageResponse.ok && storageResponse.status !== 404)) return false;
  }

  const deleteQuery = new URLSearchParams({ [column]: `eq.${userId}` });
  const deleteResult = await requestJson(`${baseUrl}/rest/v1/${table}?${deleteQuery}`, {
    method: "DELETE",
    headers: authorizationHeaders(serviceRoleKey, serviceRoleKey, { Prefer: "return=minimal" })
  });
  return Boolean(deleteResult && deleteResult.response.ok);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return jsonResponse({ code: "method_not_allowed" }, 405);

  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseUrl || !publicKey || !serviceRoleKey) {
    return jsonResponse({ code: "server_not_configured" }, 503);
  }

  const match = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return jsonResponse({ code: "unauthenticated" }, 401);

  const authResult = await requestJson(`${baseUrl}/auth/v1/user`, {
    headers: authorizationHeaders(publicKey, match[1])
  });
  if (!authResult) return jsonResponse({ code: "service_unavailable" }, 503);
  if (!authResult.response.ok) return jsonResponse({ code: "unauthenticated" }, 401);
  if (!isRecord(authResult.body) || typeof authResult.body.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authResult.body.id)) {
    return jsonResponse({ code: "unauthenticated" }, 401);
  }
  const userId = authResult.body.id;

  const profileQuery = new URLSearchParams({ select: "papel", id: `eq.${userId}`, limit: "1" });
  const profileResult = await requestJson(`${baseUrl}/rest/v1/perfis?${profileQuery}`, {
    headers: authorizationHeaders(serviceRoleKey, serviceRoleKey)
  });
  if (!profileResult || !profileResult.response.ok || !Array.isArray(profileResult.body)) {
    return jsonResponse({ code: "service_unavailable" }, 503);
  }
  const profile = profileResult.body[0];
  if (!isRecord(profile) || !["aluno", "instrutor"].includes(String(profile.papel))) {
    return jsonResponse({ code: "role_not_allowed" }, 403);
  }

  const references = await Promise.all(protectedReferences.map((reference) =>
    hasProtectedReference(baseUrl, serviceRoleKey, reference, userId)
  ));
  if (references.some((result) => result === null)) {
    return jsonResponse({ code: "service_unavailable" }, 503);
  }
  if (references.some(Boolean)) return jsonResponse({ code: "protected_records" }, 409);

  const profilePhotoRemoved = await removeProfilePhoto(
    baseUrl,
    serviceRoleKey,
    userId,
    "perfis_fotos",
    "perfil_id",
    "perfis"
  );
  const professorPhotoRemoved = await removeProfilePhoto(
    baseUrl,
    serviceRoleKey,
    userId,
    "professores_fotos",
    "professor_id",
    "professores"
  );
  if (!profilePhotoRemoved || !professorPhotoRemoved) {
    return jsonResponse({ code: "cleanup_failed" }, 503);
  }

  const consentQuery = new URLSearchParams({ perfil_id: `eq.${userId}` });
  const consentResult = await requestJson(`${baseUrl}/rest/v1/consentimentos?${consentQuery}`, {
    method: "DELETE",
    headers: authorizationHeaders(serviceRoleKey, serviceRoleKey, { Prefer: "return=minimal" })
  });
  if (!consentResult || !consentResult.response.ok) {
    return jsonResponse({ code: "cleanup_failed" }, 503);
  }

  const deleteResult = await requestJson(
    `${baseUrl}/auth/v1/admin/users/${userId}?should_soft_delete=false`,
    {
      method: "DELETE",
      headers: authorizationHeaders(serviceRoleKey, serviceRoleKey)
    }
  );
  if (!deleteResult || !deleteResult.response.ok) {
    const errorCode = isRecord(deleteResult?.body) ? deleteResult.body.code : null;
    if (errorCode === "23503" || deleteResult?.response.status === 409) {
      return jsonResponse({ code: "protected_records" }, 409);
    }
    return jsonResponse({ code: "deletion_failed" }, 503);
  }

  return jsonResponse({ deleted: true });
});
