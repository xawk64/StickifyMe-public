import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError, type ValidationIssue } from "../../errors";

type Part = "params" | "query" | "body";

export type RequestSchemas = Partial<Record<Part, ZodType>>;

const PARTS: Part[] = ["params", "query", "body"];

/**
 * Validates and normalises request parts with zod schemas.
 * Parsed values replace the raw ones, so unknown fields are stripped
 * and handlers only ever see data that matches the schema.
 */
export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req, _res, next) => {
    const details: ValidationIssue[] = [];

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) {
        continue;
      }
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        // Express 4 exposes query/params/body as plain writable properties
        (req as unknown as Record<Part, unknown>)[part] = result.data;
      } else {
        details.push(
          ...result.error.issues.map((issue) => ({
            location: part,
            path: issue.path.join("."),
            message: issue.message,
          })),
        );
      }
    }

    if (details.length) {
      next(new ValidationError(details));
      return;
    }
    next();
  };
