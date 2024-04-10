import { OpenAIDetector } from "./openapi.js";
import { Detector, DetectorOptions } from "./types.js";

export const createDetector = ({
  model,
  token,
}: DetectorOptions = {}): Detector =>
  new OpenAIDetector({
    model,
    token,
  });
