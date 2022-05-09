import { ReactNode } from "react";
import * as t from "./types";
import Dexie from "dexie";
// import foreignApis
import PektinBackup from "./foreignApis/PektinBackup";
import PowerDns from "./foreignApis/PowerDns";
import Wanderlust from "./foreignApis/Wanderlust";
import * as txt from "./validators/txtRecords";
import { absoluteName, ApiRecord, CAARecord, isAbsolute } from "@pektin/client";
import { cloneDeep } from "lodash";
import { PektinRRType } from "@pektin/client";
import { regex, validateDomain, validateIp } from "./validators/common";

export const defaultSearchMatch = {
  name: false,
  ttl: false,
  rr_type: false,
  rr_set: [],
};

export const defaultMeta = {
  selected: false,
  expanded: false,
  changed: {} as t.FieldValidity,
  anyChanged: false,
  searchMatch: defaultSearchMatch,
  anySearchMatch: false,
};

export const loadToluol = async () => {
  return await import("@pektin/toluol-wasm-bundler");
};

export const toPektinApiRecord = (config: t.Config, displayRecord: t.DisplayRecord): ApiRecord => {
  const apiRecord = cloneDeep(displayRecord) as ApiRecord;

  switch (displayRecord.rr_type) {
    case PektinRRType.SOA:
      apiRecord.rr_set = displayRecord.rr_set.map((rr) => {
        return {
          mname: rr.mname,
          rname: rr.rname,
          serial: 0,
          refresh: 0,
          retry: 0,
          expire: 0,
          minimum: 0,
        };
      });
      break;
    case PektinRRType.CAA:
      apiRecord.rr_set = displayRecord.rr_set.map((rr) => {
        return {
          value: rr.caaValue,
          tag: rr.tag,
          issuer_critical: true,
        };
      });
      break;

    default:
      break;
  }

  return apiRecord;
};

export const toUiRecord = (config: t.Config, apiRecord: ApiRecord): t.DisplayRecord => {
  const displayRecord = cloneDeep(apiRecord) as t.DisplayRecord;

  switch (apiRecord.rr_type) {
    case PektinRRType.SOA:
      displayRecord.rr_set = apiRecord.rr_set.map((rr) => {
        return {
          mname: rr.mname,
          rname: rr.rname,
        };
      });
      break;
    case PektinRRType.CAA:
      displayRecord.rr_set = apiRecord.rr_set.map((rr) => {
        return {
          caaValue: rr.value,
          tag: rr.tag,
          issuer_critical: true,
        };
      });
      break;

    default:
      break;
  }
  return displayRecord;
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
  tntAuth: null,
  foreignApis: [
    {
      name: "Wanderlust",
      class: Wanderlust,
      description: (
        <div>
          Wanderlust imports a single domain per import with NSEC zone walking using the Pektin dns
          client tnt. Due to issues with the Content-Security-Policy this may not work with older
          browsers.{" "}
          <a href="https://github.com/w3c/webappsec-csp/pull/293" className="url" rel="norefferer">
            More
          </a>
        </div>
      ),
    },
    { name: "Pektin Backup", class: PektinBackup, description: "" },
    { name: "PowerDNS", class: PowerDns, description: "" },
  ],
  local: defaultLocalConfig,
  pektin: undefined,
};

export const displayRecordToBind = (rec: ApiRecord, onlyValues: boolean = false): ReactNode => {
  if (!rec || !rec.rr_set) return "";
  if (rec.rr_type === "SOA") {
    const soa = rec.rr_set[0];
    if (onlyValues) return `${soa.mname} ${soa.rname}`;
    return `${absoluteName(rec.name)} ${rec.ttl ?? ""} IN ${rec.rr_type} ${soa.mname} ${
      soa.rname
    } 0 0 0 0 0`;
  }
  return "Not Implemented for this record";
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
  "DNSKEY",
] as const;

export const rrTemplates: any = {
  AAAA: {
    sortBy: "value",
    readonly: false,
    template: {
      value: "",
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
    readonly: false,
    template: {
      value: "",
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
    readonly: false,
    template: {
      value: "",
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
    readonly: false,
    template: {
      value: "",
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
  SOA: {
    sortBy: "mname",
    readonly: true,
    template: {
      mname: "",
      rname: "hostmaster.",
      serial: 0,
      refresh: 0,
      retry: 0,
      expire: 0,
      minimum: 0,
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
    readonly: false,
    template: {
      preference: 10,
      exchange: "",
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
    readonly: false,
    template: {
      value: "",
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
    readonly: false,
    template: {
      priority: 1,
      weight: 1,
      port: 443,
      target: "",
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
    readonly: false,
    template: {
      tag: "issue",
      caaValue: "letsencrypt.org",
    },
    fields: {
      tag: {
        placeholder: "issue",
        inputType: "text",
        name: "tag",
        width: 6,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          if (["issue", "issuewild", "iodef"].includes(field.toLowerCase())) {
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
        validate: (config: t.Config, field: string, val: CAARecord): t.ValidationResult => {
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
              message: `CAA values must NOT be absolute names (NOT end with a dot)`,
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
    readonly: false,
    template: {
      value: "",
    },
    fields: {
      value: {
        placeholder: "99020d046104063e...",
        name: "public key",
        inputType: "text",
        width: 12,
        validate: (config: t.Config, field: string): t.ValidationResult => {
          field = variablesToValues(config, field);

          if (!field.match(regex.base64)) {
            return {
              type: "error",
              message: `Invalid Base64`,
            };
          }
          return { type: "ok" };
        },
      },
    },
    color: [145, 0, 7],
    complex: false,
  },
  TLSA: {
    sortBy: "data",
    readonly: false,
    template: {
      usage: 3,
      selector: 1,
      matching: 1,
      data: "",
    },
    fields: {
      cert_usage: {
        placeholder: 3,
        name: "cert_usage",
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
      matching: {
        placeholder: 1,
        name: "matching",
        inputType: "number",
        width: 2,
        min: 0,
        max: 2,
      },
      cert_data: {
        placeholder: "50c1ab1e11feb0a75",
        name: "cert_data",
        inputType: "text",
        width: 6,
      },
    },
    color: [255, 217, 0],
    complex: true,
  },
} as const;

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
] as const;
