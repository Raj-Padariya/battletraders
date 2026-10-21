/** URL prefix of the panel area (routes live under app/(panel)/app). Every in-panel href and asset path needs it. */
export const BASE_PATH = "/app";

/** Public file → URL with basePath, e.g. asset("/assets/img/battel-logo.svg"). */
export const asset = (path: string): string => BASE_PATH + path;
