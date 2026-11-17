import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { z } from "zod";
import { validate } from "../src/http/middlewares/validate";
import { ValidationError } from "../src/errors";

describe("validate middleware", () => {
  const schema = { body: z.object({ name: z.string().min(1) }) };

  it("replaces the body with parsed data and strips unknown fields", () => {
    const req = { body: { name: "x", isAdmin: true } };
    const next = vi.fn();

    validate(schema)(req as unknown as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "x" });
  });

  it("passes a ValidationError with issue details to next", () => {
    const next = vi.fn();

    validate(schema)({ body: { name: 1 } } as unknown as Request, {} as Response, next);

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.status).toBe(400);
    expect(error.details[0]).toMatchObject({ location: "body", path: "name" });
  });
});
