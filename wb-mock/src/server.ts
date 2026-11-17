// Mock of the Wildberries seller API used by the local docker compose stack.
// Serves fixtures and can inject 429 / 5xx / timeouts to show the client's retries.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  DEMO_API_KEY,
  WAREHOUSES,
  cards,
  coefficients,
  orders,
  statusOf,
} from "./fixtures.ts";
import { stickerPng } from "./png.ts";

type FailureMode = "429" | "500" | "503" | "timeout";

const config = {
  port: Number(process.env.PORT ?? 4010),
  /** Probability (0..1) that a request fails with one of the failure modes. */
  failureRate: Number(process.env.WB_MOCK_FAILURE_RATE ?? 0),
  failureModes: (process.env.WB_MOCK_FAILURE_MODES ?? "429,500,timeout")
    .split(",")
    .map((mode) => mode.trim())
    .filter(Boolean) as FailureMode[],
  latencyMs: Number(process.env.WB_MOCK_LATENCY_MS ?? 50),
  /** How long a "timeout" request hangs before answering. */
  timeoutMs: Number(process.env.WB_MOCK_TIMEOUT_MS ?? 30_000),
  coefficientsPeriodMs: Number(process.env.WB_MOCK_COEFFICIENTS_PERIOD_MS ?? 60_000),
};

const stats = { requests: 0, failures: { "429": 0, "500": 0, "503": 0, timeout: 0 } };

const log = (message: string) => console.log(`${new Date().toISOString()} ${message}`);

function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Returns true when the request was answered with an injected failure. */
async function injectFailure(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const forced = req.headers["x-mock-fail"] as FailureMode | undefined;
  const mode =
    forced ??
    (Math.random() < config.failureRate
      ? config.failureModes[Math.floor(Math.random() * config.failureModes.length)]
      : undefined);
  if (!mode) return false;
  stats.failures[mode] += 1;
  log(`INJECT ${mode} ${req.method} ${req.url}`);
  if (mode === "timeout") {
    await sleep(config.timeoutMs);
    if (!res.writableEnded) send(res, 504, { detail: "mock timeout" });
    return true;
  }
  if (mode === "429") {
    send(res, 429, { title: "too many requests" }, { "Retry-After": "1" });
    return true;
  }
  send(res, Number(mode), { title: "mock server error" });
  return true;
}

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://wb-mock");
  const path = url.pathname;

  // Control endpoints for demos: GET/POST /__mock/failures {"rate":0.5,"modes":["429"]}
  if (path === "/__mock/stats") return send(res, 200, { ...stats, config });
  if (path === "/__mock/failures" && req.method === "POST") {
    const body = await readJson(req);
    if (typeof body.rate === "number") config.failureRate = body.rate;
    if (Array.isArray(body.modes)) config.failureModes = body.modes as FailureMode[];
    log(
      `failure injection set to rate=${config.failureRate} modes=${config.failureModes.join(",")}`,
    );
    return send(res, 200, config);
  }
  if (path === "/health") return send(res, 200, { ok: true });

  stats.requests += 1;
  const key = req.headers.authorization;
  if (!key || key.startsWith("invalid")) {
    return send(res, 401, { title: "unauthorized", detail: "token is invalid" });
  }
  await sleep(config.latencyMs);
  if (await injectFailure(req, res)) return;

  // content-api
  if (path === "/ping")
    return send(res, 200, { TS: new Date().toISOString(), Status: "OK" });
  if (path === "/content/v2/get/cards/list" && req.method === "POST") {
    const body = (await readJson(req)) as {
      settings?: { filter?: { textSearch?: string } };
    };
    const search = body.settings?.filter?.textSearch ?? "";
    const found = cards.filter((card) => String(card.nmID) === search);
    return send(res, 200, { cards: found, cursor: { total: found.length } });
  }

  // marketplace-api
  if (path === "/api/v3/orders" && req.method === "GET") {
    const dateFrom = Number(url.searchParams.get("dateFrom") ?? 0) * 1000;
    const list = orders().filter((order) => Date.parse(order.createdAt) >= dateFrom);
    return send(res, 200, { next: 0, orders: list });
  }
  if (path === "/api/v3/orders/status" && req.method === "POST") {
    const { orders: ids = [] } = (await readJson(req)) as { orders?: number[] };
    return send(res, 200, {
      orders: ids.map((id) => ({
        id,
        supplierStatus: statusOf(id),
        wbStatus: "waiting",
      })),
    });
  }
  if (path === "/api/v3/orders/stickers" && req.method === "POST") {
    const { orders: ids = [] } = (await readJson(req)) as { orders?: number[] };
    return send(res, 200, {
      stickers: ids.map((orderId) => ({
        orderId,
        partA: 100_000 + (orderId % 900_000),
        partB: 1_000 + (orderId % 9_000),
        barcode: `*${orderId.toString(36)}`,
        file: stickerPng(orderId).toString("base64"),
      })),
    });
  }

  // supplies-api
  if (path === "/api/v1/warehouses") return send(res, 200, WAREHOUSES);
  if (path === "/api/v1/acceptance/coefficients") {
    const ids = (url.searchParams.get("warehouseIDs") ?? "")
      .split(",")
      .map(Number)
      .filter(Boolean);
    return send(res, 200, coefficients(ids, Date.now(), config.coefficientsPeriodMs));
  }

  return send(res, 404, { title: "not found" });
}

createServer((req, res) => {
  const started = Date.now();
  res.on("finish", () => {
    if (!req.url?.startsWith("/health")) {
      log(`${res.statusCode} ${req.method} ${req.url} ${Date.now() - started}ms`);
    }
  });
  route(req, res).catch((err: unknown) => {
    log(`ERROR ${String(err)}`);
    if (!res.headersSent) send(res, 500, { title: "mock crashed" });
  });
}).listen(config.port, () => {
  log(
    `WB API mock listening on :${config.port} (demo key: ${DEMO_API_KEY}, failure rate ${config.failureRate})`,
  );
});
