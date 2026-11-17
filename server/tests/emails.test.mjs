import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const templates = require("../dist/mail/templates");
const { escapeHtml } = require("../dist/utils/html");

const payload = `<img src=x onerror="alert('x')">`;

describe("email templates", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  it.each([
    ["welcome", { username: payload, appUrl: "http://localhost:3000" }],
    ["adminNewSignup", { email: "a@example.com", username: payload }],
    [
      "adminSupportRequest",
      { email: "a@example.com", type: "problem", message: payload },
    ],
    ["adminTelegramConnected", { email: "a@example.com", username: payload, chatId: 1 }],
    [
      "adminMonitoringSettings",
      { email: "a", username: "b", settings: { note: payload } },
    ],
  ])("%s does not inject user input as HTML", (name, data) => {
    const { html } = templates[name](data);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
