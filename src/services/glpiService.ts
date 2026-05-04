type GlpiSessionResponse = {
  session_token?: string;
};

type GlpiTicketResponse = {
  id?: number;
};

type GlpiFollowupResponse = {
  id?: number;
  message?: string;
};

type TicketNotificationInput = {
  ticketNumber: string;
  message: string;
};

function getGlpiConfig() {
  const apiUrl = process.env.GLPI_API_URL?.trim();
  const userToken = process.env.GLPI_USER_TOKEN?.trim();
  const appToken = process.env.GLPI_APP_TOKEN?.trim();

  return {
    apiUrl,
    userToken,
    appToken,
    requestTypeId: Number(process.env.GLPI_REQUEST_TYPE_ID ?? 1),
    isPrivate: (process.env.GLPI_FOLLOWUP_PRIVATE ?? "false").toLowerCase() === "true" ? 1 : 0,
  };
}

function ensureGlpiConfigured() {
  const config = getGlpiConfig();

  if (!config.apiUrl || !config.userToken) {
    throw new Error("GLPI API is not configured");
  }

  return {
    ...config,
    apiUrl: config.apiUrl,
    userToken: config.userToken,
  };
}

function buildHeaders(sessionToken?: string) {
  const config = ensureGlpiConfigured();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.appToken) {
    headers["App-Token"] = config.appToken;
  }

  if (sessionToken) {
    headers["Session-Token"] = sessionToken;
  } else {
    headers.Authorization = `user_token ${config.userToken}`;
  }

  return headers;
}

async function glpiFetch<T>(
  path: string,
  init: RequestInit,
  sessionToken?: string,
): Promise<T> {
  const config = ensureGlpiConfigured();
  const baseUrl = config.apiUrl.endsWith("/") ? config.apiUrl : `${config.apiUrl}/`;
  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    headers: {
      ...buildHeaders(sessionToken),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const objectPayload =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null;
    const message = Array.isArray(payload)
      ? payload.join(" - ")
      : typeof objectPayload?.message === "string"
        ? objectPayload.message
        : typeof objectPayload?.["1"] === "string"
          ? objectPayload["1"]
          : `GLPI request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

async function initGlpiSession() {
  const payload = await glpiFetch<GlpiSessionResponse>("initSession?session_write=true", {
    method: "GET",
  });

  if (!payload.session_token) {
    throw new Error("Unable to start GLPI session");
  }

  return payload.session_token;
}

async function killGlpiSession(sessionToken: string) {
  try {
    await glpiFetch("killSession", { method: "GET" }, sessionToken);
  } catch {
    // Ignore session cleanup failures.
  }
}

async function withGlpiSession<T>(callback: (sessionToken: string) => Promise<T>) {
  const sessionToken = await initGlpiSession();

  try {
    return await callback(sessionToken);
  } finally {
    await killGlpiSession(sessionToken);
  }
}

export async function verifyTicket(ticketNumber: string) {
  return withGlpiSession(async (sessionToken) => {
    const payload = await glpiFetch<GlpiTicketResponse>(
      `Ticket/${encodeURIComponent(ticketNumber)}`,
      { method: "GET" },
      sessionToken,
    );

    return {
      ok: payload.id === Number(ticketNumber),
      message: payload.id ? "Ticket valid" : "Ticket not found",
    };
  });
}

export async function postTicketFollowup(input: TicketNotificationInput) {
  const config = ensureGlpiConfigured();

  return withGlpiSession(async (sessionToken) => {
    return glpiFetch<GlpiFollowupResponse>(
      `Ticket/${encodeURIComponent(input.ticketNumber)}/ITILFollowup`,
      {
        method: "POST",
        body: JSON.stringify({
          input: {
            tickets_id: Number(input.ticketNumber),
            is_private: config.isPrivate,
            requesttypes_id: config.requestTypeId,
            content: input.message,
          },
        }),
      },
      sessionToken,
    );
  });
}
