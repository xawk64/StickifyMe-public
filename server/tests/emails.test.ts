import { describe, expect, it } from "vitest";

import * as templates from "../src/mail/templates";
import { escapeHtml } from "../src/utils/html";

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
    const render = templates[name as keyof typeof templates] as (d: typeof data) => {
      html: string;
    };
    const { html } = render(data);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
