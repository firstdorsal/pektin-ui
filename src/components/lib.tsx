import { ReactNode } from "react";
import * as t from "./types";
import Dexie from "dexie";
// import foreignApis
import PektinBackup from "./foreignApis/PektinBackup";
import PowerDns from "./foreignApis/PowerDns";
import Wanderlust from "./foreignApis/Wanderlust";
import * as pektinApi from "./apis/pektin";
import * as txt from "./apis/txtRecords";
import { getPektinRecursorEndpoint } from "@pektin/client";

import punycode from "punycode";

const f = fetch;
export const defaultSearchMatch = {
  name: false,
  type: false,
  values: [],
};

export const defaultMeta = {
  selected: false,
  expanded: false,
  changed: {} as t.FieldValidity,
  anyChanged: false,
  searchMatch: defaultSearchMatch,
  anySearchMatch: false,
};

export type RealData = pektinApi.RedisEntry;

export const regex = {
  ip: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  legacyIp:
    /^(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,

  domainName:
    /^(?:[a-z0-9_](?:[a-z0-9-_]{0,61}[a-z0-9_]|[-]{2,}?)?\.)*[a-z0-9-_][a-z0-9-]{0,61}[a-z0-9]{1,61}[.]?$/,
};

export const loadToluol = async () => {
  return await import("@pektin/toluol-wasm");
};

export const toluolBodge = (rawAnswer: string): t.DisplayRecord | false => {
  if (!rawAnswer) return false;

  rawAnswer = rawAnswer.replaceAll("\t", "");
  if (rawAnswer.indexOf("Answer Section:\n") < 0) return false;
  rawAnswer = rawAnswer.substring(rawAnswer.indexOf("Answer Section:\n") + 16);
  const answerLines = rawAnswer.split("\n");

  const line0 = answerLines[0].split("  ", 5);
  let name = line0[0];
  //if (!isSupportedType(line0[3])) return false;
  let type = line0[3] as t.RRType;

  const values = answerLines.map((line) => {
    const bananenSplit = line.split("  ", 5);

    return { ttl: parseInt(bananenSplit[1]), ...textToRRValue(bananenSplit[4], type) };
  });
  //@ts-ignore
  //if (type === "NSEC") values.map((v) => console.log(v));

  return { name, type, values };
};

const textToRRValue = (val: string, recordType: t.RRType) => {
  const t = val.split(" ");
  switch (recordType) {
    case "SOA":
      return {
        mname: t[0],
        rname: t[1],
      };
    case "MX":
      return {
        preference: parseInt(t[0]),
        exchange: t[1],
      };
    case "SRV":
      return {
        priority: parseInt(t[0]),
        weight: parseInt(t[1]),
        port: parseInt(t[2]),
        target: t[3],
      };

    case "CAA":
      return {
        flag: parseInt(t[0]),
        tag: t[1] as "issue" | "issuewild" | "iodef",
        caaValue: t[2].replaceAll('"', ""),
      };

    case "TLSA":
      return {
        usage: parseInt(t[0]) as 0 | 1 | 2 | 3,
        selector: parseInt(t[1]) as 0 | 1,
        matching_type: parseInt(t[2]) as 0 | 1 | 2,
        data: t[3],
      };

    default:
      return { value: val };
  }
};

export const dohQuery = async (
  dohQuery: t.DOHQuery,
  config: t.Config,
  toluol: any,
  httpMethod?: "post" | "get"
) => {
  if (!config.pektin || !config.recursorAuth) return false;

  const resolver = getPektinRecursorEndpoint(config.pektin);
  const post = async (q: Uint8Array) => {
    const res = await f(`${resolver}/dns-query`, {
      headers: {
        "content-type": "application/dns-message",
        Authorization: config.recursorAuth || "",
      },
      credentials: "omit",
      method: "POST",
      body: q,
    });
    return new Uint8Array(await res.arrayBuffer());
  };

  const get = async (q: Uint8Array) => {
    const s = Buffer.from(q).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

    const res = await f(`${resolver}/dns-query?dns=${s.replace(/=/g, "")}`, {
      headers: {
        accept: "application/dns-message",
        Authorization: config.recursorAuth || "",
      },
      credentials: "omit",
    });
    return new Uint8Array(await res.arrayBuffer());
  };
  //toluol.init_panic_hook();
  try {
    const query = toluol.new_query(absoluteName(dohQuery.name).slice(0, -1), dohQuery.type);
    const res = httpMethod === "post" ? await post(query) : await get(query);
    return toluol.parse_answer(res);
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const variablesToValues = (config: t.Config, input: string) => {
  if (!config?.local?.replaceVariables) return input;
  const variables = config?.local?.variables;
  if (!variables) return input;

  if (!input) return "";
  for (let i = 0; i < variables.length; i++) {
    input = input.replaceAll(`$${variables[i].key}`, variables[i].value);
  }
  return input;
};

export const valuesToVariables = (config: t.Config, input: string) => {
  if (!config?.local?.replaceVariables) return input;
  const variables = config?.local?.variables;
  if (!variables) return input;

  if (!input) return "";
  for (let i = 0; i < variables.length; i++) {
    input = input.replaceAll(variables[i].value, `$${variables[i].key}`);
  }
  return input;
};

export const jsTemp = (config: t.Config, records: t.DisplayRecord[]) => {
  return pektinApi.jsTemp(config, records);
};

export const isSupportedRecord = (record: t.DisplayRecord) => {
  if (supportedRecords.indexOf(record.type) > -1) return true;
  return false;
};
export const isSupportedType = (type: string) => {
  if (supportedRecords.indexOf(type) > -1) return true;
  return false;
};

export const getDomains = (config: t.Config, format = "pektin") => {
  return pektinApi.getDomains(config);
};

export const getAllRecords = (config: t.Config, domainName: string, format = "pektin") => {
  return pektinApi.getAllZoneRecords(config, domainName);
};

export const getRecords = (config: t.Config, records: t.DisplayRecord[], format = "pektin") => {
  return pektinApi.getRecords(config, records);
};

export const setRecords = (config: t.Config, records: t.DisplayRecord[], format = "pektin") => {
  return pektinApi.setRecords(config, records);
};
export const deleteRecords = (config: t.Config, records: t.DisplayRecord[], format = "pektin") => {
  return pektinApi.deleteRecords(config, records);
};

export const addDomain = (config: t.Config, record: t.DisplayRecord, format = "pektin") => {
  return pektinApi.addDomain(config, [record]);
};

export const toRealRecord = (
  config: t.Config,
  dData: t.DisplayRecord,
  format = "pektin"
): RealData => {
  if (format === "something") {
    return pektinApi.toRealRecord(config, dData);
  } else {
    return pektinApi.toRealRecord(config, dData);
  }
};

export const toDisplayRecord = (
  config: t.Config,
  rData: RealData,
  format = "pektin"
): t.DisplayRecord => {
  if (format === "something") {
    return pektinApi.toDisplayRecord(config, rData);
  } else {
    return pektinApi.toDisplayRecord(config, rData);
  }
};

interface DbConfig {
  key: "localConfig";
  value: any;
}
export class PektinUiDb extends Dexie {
  config: Dexie.Table<DbConfig>;

  constructor() {
    super("pektin-ui");
    this.version(1).stores({
      localConfig: "key, value",
    });
    this.config = this.table("localConfig");
  }
}
const defaultVaultAuth: t.VaultAuth = {
  endpoint: "",
  token: "",
};

const defaultLocalConfig: t.LocalConfig = {
  defaultActiveTab: 0,
  codeStyle: "dracula",
  variables: [],
  synesthesia: false,
  replaceVariables: true,
  helper: true,
};

export const defaulConfig: t.Config = {
  vaultAuth: defaultVaultAuth,
  recursorAuth: null,
  foreignApis: [
    {
      name: "Wanderlust",
      class: Wanderlust,
      description:
        "Wanderlust imports a single domain per import with NSEC zone walking. To resolve the records, DNS queries are sent through Google or Cloudflare.",
    },
    { name: "Pektin Backup", class: PektinBackup, description: "" },
    { name: "PowerDNS", class: PowerDns, description: "" },
  ],
  local: defaultLocalConfig,
  pektin: undefined,
};

export const absoluteName = (name: string) => {
  if (!name?.length) return "";
  name = name.replaceAll(/\s+/g, "");
  if (name[name.length - 1] !== ".") return name + ".";
  return name;
};

export const isAbsolute = (name: string): boolean => name[name.length - 1] === ".";

export const displayRecordToBind = (
  rec0: t.DisplayRecord,
  onlyValues: boolean = false
): ReactNode => {
  if (!rec0 || !rec0.values) return "";
  if (rec0.type === "SOA") {
    const soa = rec0.values[0] as t.SOA;
    if (onlyValues) return `${soa.mname} ${soa.rname}`;
    return `${absoluteName(rec0.name)} ${rec0.values[0].ttl ? rec0.values[0].ttl : ""} IN ${
      rec0.type
    } ${soa.mname} ${soa.rname} 0 0 0 0 0`;
  }
  return "Not Implemented for this record";
};

export const help: any = {
  auth: <div>helper text for auth</div>,
};

export const supportedRecords = [
  "A",
  "AAAA",
  "NS",
  "CNAME",
  "SOA",
  "MX",
  "TXT",
  "SRV",
  "CAA",
  "OPENPGPKEY",
  "TLSA",
];

export const unicodeToAscii = (input: string) => {
  return punycode.toASCII(input);
};

export const asciiToUnicode = (input: string) => {
  return punycode.toUnicode(input);
};

export const validateDomain = (
  config: t.Config,
  input: string,
  params?: t.ValidateParams
): t.ValidationResult => {
  input = variablesToValues(config, input);
  const ogInput = input;
  input = input.replace(/\s+/g, "");
  input = unicodeToAscii(input);

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
    params.domainName = unicodeToAscii(params.domainName);
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
  if (input !== unicodeToAscii(ogInput)) {
    return {
      type: "warning",
      message: "Field shouldn't contain whitespace",
    };
  }
  return { type: "ok" };
};

export const validateIp = (
  config: t.Config,
  input: string,
  type?: "legacy"
): t.ValidationResult => {
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

export const rrTemplates: any = {
  AAAA: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "1:see:bad:c0de",
        name: "ip",
        inputType: "text",
        width: 12,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateIp(config, field);
        },
      },
    },
    color: [43, 255, 0],
    complex: false,
  },
  A: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "127.0.0.1",
        name: "legacy ip",
        inputType: "text",
        width: 12,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateIp(config, field, "legacy");
        },
      },
    },
    color: [82, 51, 18],
    complex: false,
  },
  NS: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "ns1.example.com.",
        inputType: "text",
        name: "nameserver",
        width: 12,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateDomain(config, field);
        },
      },
    },
    color: [29, 117, 0],
    complex: false,
  },
  CNAME: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "example.com.",
        inputType: "text",
        name: "canonical name",
        width: 12,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateDomain(config, field);
        },
      },
    },
    color: [255, 0, 0],
    complex: false,
  },
  PTR: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "example.com.",
        inputType: "text",
        name: "pointer",
        width: 12,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateDomain(config, field);
        },
      },
    },
    color: [255, 122, 0],
    complex: false,
  },
  SOA: {
    sortBy: "mname",
    template: {
      mname: "",
      rname: "hostmaster.",
      serial: 0,
      refresh: 0,
      retry: 0,
      expire: 0,
      minimum: 0,
      ttl: 3600,
    },
    fields: {
      mname: {
        placeholder: "ns1.example.com.",
        helperText: "The domain's primary name server",
        name: "primary nameserver",
        inputType: "text",
        width: 6,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateDomain(config, field);
        },
      },
      rname: {
        placeholder: "hostmaster.example.com.",
        helperText: "The hostmaster's email, the @ is replaced with a dot",
        inputType: "text",
        name: "hostmaster contact",
        width: 6,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          const dv = validateDomain(config, field);
          if (dv.type !== "ok") return dv;
          if (field.indexOf("@") > -1) {
            return {
              type: "warning",
              message: "The @ symbol should be replaced with a dot",
            };
          }
          return { type: "ok" };
        },
      },
    },
    color: [255, 145, 0],
    info: (
      <div>
        <p>
          The "Start Of Authority" record is the most important one, as it defines the existence of
          the zone.
        </p>
        <br />
        <p>
          The numbers like "serial", "expire" etc. are omitted because they are only used for sync
          between main and subordinate DNS servers. Pektin does not use these mechanisms, as it's
          data is synced using Redis replication.
        </p>
      </div>
    ),
    complex: true,
  },
  MX: {
    sortBy: "exchange",
    template: {
      preference: 10,
      exchange: "",
      ttl: 3600,
    },
    fields: {
      preference: {
        placeholder: "10",
        inputType: "number",
        name: "preference",
        width: 3,
        min: 0,
      },
      exchange: {
        placeholder: "mx.example.com.",
        inputType: "text",
        name: "mail exchange",
        width: 9,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          if (field === ".") return { type: "ok" };
          return validateDomain(config, field);
        },
      },
    },
    color: [29, 94, 224],
    info: (
      <div>
        <p>The "Mail Exchange" record points to the location of a mail server.</p>
        <br />
        <p>
          The preference indicates the order that a sender should try to deliver its mail to. <br />{" "}
          A lower preference value indicates a higher priority.
        </p>
        <br />
        <p>
          Have a look at{" "}
          <a href="https://datatracker.ietf.org/doc/html/rfc5321#section-5.1" rel="noreferrer">
            RFC 5321
          </a>{" "}
          for more information.
        </p>
      </div>
    ),
    complex: true,
  },
  TXT: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "this is some text",
        inputType: "text",
        name: "text",
        width: 12,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          field = variablesToValues(config, field);
          if (field.startsWith(txt.txtRecords.SPF1.identifier)) {
            return txt.txtRecords.SPF1.validate(config, field);
          }
          if (field.startsWith(txt.txtRecords.DKIM1.identifier)) {
            return txt.txtRecords.DKIM1.validate(field);
          }
          return { type: "ok" };
        },
      },
    },
    color: [140, 140, 140],
    info: (
      <div>
        <p>The "Text" record is a flexible record that can contain pretty much anything.</p>
        <br />
        <p>There are many "sub types" of TXT records like spf, dkim, dmarc etc.</p>
        <br />
        <p>
          See{" "}
          <a href="https://datatracker.ietf.org/doc/html/rfc1464" target="_blank" rel="noreferrer">
            RFC 1464
          </a>{" "}
          for more information about the TXT record and{" "}
          <a href="https://datatracker.ietf.org/doc/html/rfc7208" target="_blank" rel="noreferrer">
            RFC 7208
          </a>{" "}
          for more information about the TXT-SPF record.
        </p>
      </div>
    ),
    complex: false,
  },
  SRV: {
    sortBy: "target",
    template: {
      priority: 1,
      weight: 1,
      port: 443,
      target: "",
      ttl: 3600,
    },
    fields: {
      priority: {
        placeholder: 1,
        inputType: "number",
        name: "priority",
        width: 2,
        min: 0,
      },
      weight: {
        placeholder: 1,
        name: "weight",
        inputType: "number",
        width: 2,
        min: 0,
      },
      port: {
        placeholder: 443,
        name: "port",
        inputType: "number",
        width: 2,
        min: 0,
        max: 65535,
      },
      target: {
        placeholder: "mx.example.com.",
        name: "target domain",
        inputType: "text",
        width: 6,
        absolute: true,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          return validateDomain(config, field);
        },
      },
    },
    color: [149, 61, 196],
    complex: true,
  },
  CAA: {
    sortBy: "caaValue",
    template: {
      flag: 0,
      tag: "issue",
      caaValue: "letsencrypt.org",
      ttl: 3600,
    },
    fields: {
      tag: {
        placeholder: "issue",
        inputType: "text",
        name: "tag",
        width: 6,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          if (
            field.toLowerCase().indexOf("issue") > -1 ||
            field.toLowerCase().indexOf("issuewild") > -1 ||
            field.toLowerCase().indexOf("iodef") > -1
          ) {
            if (field === field.toLowerCase()) {
              return {
                type: "ok",
              };
            }
            return {
              type: "warning",
              message: "Tags should only contain lowercase characters",
            };
          }
          return {
            type: "error",
            message: `Tag must contain one of: issue, issuewild, iodef)`,
          };
        },
      },
      caaValue: {
        placeholder: "letsencrypt.org",
        name: "value",
        inputType: "text",
        width: 6,
        validate: (config: t.Config, field: string, val: t.CAA): t.ValidationResult => {
          if (val.tag === "iodef") {
            if (
              field.indexOf("https://") === -1 &&
              field.indexOf("http://") === -1 &&
              field.indexOf("mailto:") === -1
            ) {
              return {
                type: "error",
                message: `iodef tags must contain a protocol: https://, http://, mailto:)`,
              };
            }
          }
          if (isAbsolute(field)) {
            return {
              type: "warning",
              message: `CAA values should NOT be absolute names (NOT end with a dot)`,
            };
          }
          return validateDomain(config, field + ".");
        },
      },
    },
    color: [212, 11, 165],
    complex: true,
    /* check for quotes in verification*/
  },
  OPENPGPKEY: {
    sortBy: "value",
    template: {
      value: "",
      ttl: 3600,
    },
    fields: {
      value: {
        placeholder: "99020d046104063e...",
        name: "public key",
        inputType: "text",
        width: 12,
      },
    },
    color: [145, 0, 7],
    complex: false,
  },
  TLSA: {
    sortBy: "data",
    template: {
      usage: 3,
      selector: 1,
      matching_type: 1,
      data: "",
      ttl: 3600,
    },
    fields: {
      usage: {
        placeholder: 3,
        name: "usage",
        inputType: "number",
        width: 2,
        min: 0,
        max: 3,
      },
      selector: {
        placeholder: 1,
        name: "selector",
        inputType: "number",
        width: 2,
        min: 0,
        max: 1,
      },
      matching_type: {
        placeholder: 1,
        name: "matching",
        inputType: "number",
        width: 2,
        min: 0,
        max: 2,
      },
      data: {
        placeholder: "50c1ab1e11feb0a75",
        name: "data",
        inputType: "text",
        width: 6,
      },
    },
    color: [255, 217, 0],
    complex: true,
  },
};

export const codeStyles = [
  "a11yDark",
  "a11yLight",
  "agate",
  "anOldHope",
  "androidstudio",
  "arduinoLight",
  "arta",
  "ascetic",
  "atelierCaveDark",
  "atelierCaveLight",
  "atelierDuneDark",
  "atelierDuneLight",
  "atelierEstuaryDark",
  "atelierEstuaryLight",
  "atelierForestDark",
  "atelierForestLight",
  "atelierHeathDark",
  "atelierHeathLight",
  "atelierLakesideDark",
  "atelierLakesideLight",
  "atelierPlateauDark",
  "atelierPlateauLight",
  "atelierSavannaDark",
  "atelierSavannaLight",
  "atelierSeasideDark",
  "atelierSeasideLight",
  "atelierSulphurpoolDark",
  "atelierSulphurpoolLight",
  "atomOneDarkReasonable",
  "atomOneDark",
  "atomOneLight",
  "brownPaper",
  "codepenEmbed",
  "colorBrewer",
  "darcula",
  "dark",
  "defaultStyle",
  "docco",
  "dracula",
  "far",
  "foundation",
  "githubGist",
  "github",
  "gml",
  "googlecode",
  "gradientDark",
  "grayscale",
  "gruvboxDark",
  "gruvboxLight",
  "hopscotch",
  "hybrid",
  "idea",
  "irBlack",
  "isblEditorDark",
  "isblEditorLight",
  "kimbieDark",
  "kimbieLight",
  "lightfair",
  "lioshi",
  "magula",
  "monoBlue",
  "monokaiSublime",
  "monokai",
  "nightOwl",
  "nnfxDark",
  "nnfx",
  "nord",
  "obsidian",
  "ocean",
  "paraisoDark",
  "paraisoLight",
  "pojoaque",
  "purebasic",
  "qtcreatorDark",
  "qtcreatorLight",
  "railscasts",
  "rainbow",
  "routeros",
  "schoolBook",
  "shadesOfPurple",
  "solarizedDark",
  "solarizedLight",
  "srcery",
  "sunburst",
  "tomorrowNightBlue",
  "tomorrowNightBright",
  "tomorrowNightEighties",
  "tomorrowNight",
  "tomorrow",
  "vs",
  "vs2015",
  "xcode",
  "xt256",
  "zenburn",
];
