
export function validate(schema, location = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    res.locals.validated ??= {};
    res.locals.validated[location] = result.data;

    return next();
  };
}
