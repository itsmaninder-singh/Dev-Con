const isPlainObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);

const sanitizeInPlace = (obj) => {
  if (!isPlainObject(obj)) return obj;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (isPlainObject(value)) {
      sanitizeInPlace(value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => sanitizeInPlace(item));
    }
  }
  return obj;
};

const mongoSanitizeMiddleware = (req, res, next) => {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.params);
  sanitizeInPlace(req.query);
  next();
};

export { mongoSanitizeMiddleware };
