import { isAbsolute, toASCII } from "@pektin/client";
import { variablesToValues } from "../lib";
import { Config, ValidateParams, ValidationResult } from "../types";

export const regex = {
  ip: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  legacyIp:
    /^(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,

  domainName:
    /^(?:[a-z0-9_](?:[a-z0-9-_]{0,61}[a-z0-9_]|[-]{2,}?)?\.)*[a-z0-9-_][a-z0-9-]{0,61}[a-z0-9]{1,61}[.]?$/,
  base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
};

export const validateDomain = (
  config: Config,
  input: string,
  params?: ValidateParams
): ValidationResult => {
  input = variablesToValues(config, input);
  const ogInput = input;
  input = input.replace(/\s+/g, "");
  input = toASCII(input);

  if (
    input === undefined ||
    input.length === 0 ||
    !input.toLowerCase().replace("*.", "").match(regex.domainName)
  ) {
    return { type: "error", message: "Invalid domain" };
  }

  if (input.indexOf("*") > -1 && input.indexOf("*") !== 0) {
    return {
      type: "error",
      message: "Wildcard records can only have a * in the beginning",
    };
  }

  if (input.startsWith(".")) {
    return {
      type: "error",
      message: "Name can't start with a dot (empty label)",
    };
  }
  if (params?.domainName) {
    params.domainName = toASCII(params.domainName);
    if (!input.endsWith(params.domainName) && !input.endsWith(params.domainName.slice(0, -1))) {
      return {
        type: "error",
        message: `Name must end in the current domain name ${params?.domainName}`,
      };
    } else if (
      input !== params.domainName &&
      input + "." !== params.domainName &&
      !input.endsWith("." + params.domainName) &&
      !(input + ".").endsWith("." + params.domainName)
    ) {
      return {
        type: "error",
        message: `Name must end in the current domain name ${params?.domainName} Subdomains must be seperated by a dot`,
      };
    }
  }
  if (!isAbsolute(input.replaceAll(" ", ""))) {
    return {
      type: "warning",
      message: "Domains should be absolute (end with a dot)",
    };
  }
  if (input.toLowerCase() !== input) {
    return {
      type: "warning",
      message: "Domains should only contain lower case chars",
    };
  }
  if (input !== toASCII(ogInput)) {
    return {
      type: "warning",
      message: "Field shouldn't contain whitespace",
    };
  }
  return { type: "ok" };
};

//TODO cant rightclick on auth field

export const validateIp = (config: Config, input: string, type?: "legacy"): ValidationResult => {
  input = variablesToValues(config, input);

  const ogInput = input;
  input = input.replaceAll(/\s+/g, "");

  if (type === "legacy") {
    if (input === undefined || input.length === 0 || !input.match(regex.legacyIp)) {
      return {
        type: "error",
        message: "Invalid legacy/V4 IP adress",
      };
    }
  } else if (input === undefined || input.length === 0 || !input.match(regex.ip)) {
    return { type: "error", message: "Invalid IP" };
  }
  if (input !== input.toLowerCase()) {
    return { type: "warning", message: "IPs should only contain lower case characters" };
  }
  if (input !== ogInput) {
    return {
      type: "warning",
      message: "Field shouldn't contain whitespace",
    };
  }
  return { type: "ok" };
};
