import { StatusCodes, getReasonPhrase } from "http-status-codes";

type SymbolicStatusKeys = {
  [K in keyof typeof StatusCodes]: (typeof StatusCodes)[K] extends number
    ? K
    : never;
}[keyof typeof StatusCodes];

type StatusPhrases = {
  [key in SymbolicStatusKeys]: string;
};

const StatusPhrases: StatusPhrases = Object.keys(StatusCodes)
  .filter(
    (key): key is SymbolicStatusKeys =>
      typeof key === "string" &&
      typeof StatusCodes[key as keyof typeof StatusCodes] === "number",
  )
  .reduce((acc, key) => {
    const code = StatusCodes[key as keyof typeof StatusCodes] as number;
    acc[key] = getReasonPhrase(code);
    return acc;
  }, {} as StatusPhrases);

export { StatusCodes, StatusPhrases };
