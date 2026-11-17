const { ValidationError } = require("../errors");

const PARTS = ["params", "query", "body"];

/**
 * Validates and normalises request parts with zod schemas.
 * Parsed values replace the raw ones, so unknown fields are stripped
 * and handlers only ever see data that matches the schema.
 */
const validate = (schemas) => (req, res, next) => {
  const details = [];

  for (const part of PARTS) {
    const schema = schemas[part];
    if (!schema) {
      continue;
    }
    const result = schema.safeParse(req[part] ?? {});
    if (result.success) {
      req[part] = result.data;
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

  return details.length ? next(new ValidationError(details)) : next();
};

module.exports = { validate };
