// @ts-nocheck
import * as t from "../types";
import * as l from "../lib";

import { cloneDeep } from "lodash";
const f = fetch;

const defaultPektinApiEndpoint = "http://127.0.0.1:3001";
export const jsTemp = (config: t.Config, records: t.DisplayRecord[]) => {
  let endpoint = getDomainFromConfig(config);
  if (!endpoint) endpoint = defaultPektinApiEndpoint;
  return `const token = process.env.PEKTIN_API_TOKEN;
const endpoint="${endpoint}";
const res = await fetch(endpoint + "/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        token,
        records: 
                ${JSON.stringify(
                  records.map((record) => toPektinApiRecord(config, record)),
                  null,
                  "    "
                )}
    })
}).catch(e => {
    console.log(e);
});
console.log(res);`;
};

export const getDomainFromConfig = (config: t.Config): string => {
  if (!config?.pektin?.dev) return "no endpoint";
  if (config?.pektin?.dev === "local") return "127.0.0.1:3001";
  if (config?.pektin?.dev === "insecure-online") return `${config?.pektin?.insecureDevIp}:3001`;

  if (!config?.pektin?.apiSubDomain || !config?.pektin?.domain) return "";
  return config?.pektin?.apiSubDomain + "." + config?.pektin?.domain;
};

export const getTokenFromConfig = async (config: t.Config): Promise<string> => {
  const res = await vaultApi.getValue({ ...config.vaultAuth, key: "gss_token" });
  return res?.token;
};

export const getAuthFromConfig = async (config: t.Config): Promise<PektinApiAuth> => {
  return {
    token: await getTokenFromConfig(config),
    endpoint: getDomainFromConfig(config),
    dev: config?.pektin?.dev,
  };
};

export const toDisplayRecord = (config: t.Config, record: RedisEntry): t.DisplayRecord => {
  const [name, type]: [string, PektinRRTypes] = record.name.split(":");
  const { rr_set } = record;
  const display_values = rr_set.map((rr, i) => {
    if (type === "TXT") {
      return { value: l.valuesToVariables(config, rr.value.TXT), ttl: rr.ttl };
    } else if (type === "OPENPGPKEY") {
      return { value: l.valuesToVariables(config, rr.value.OPENPGPKEY), ttl: rr.ttl };
    } else if (type === "TLSA") {
      return {
        data: l.valuesToVariables(config, rr.value.TLSA.cert_data),
        usage: rr.value.TLSA.cert_usage,
        selector: rr.value.TLSA.selector,
        matching_type: rr.value.TLSA.matching,
        ttl: rr.ttl,
      };
    } else if (type === "A" || type === "AAAA" || type === "NS" || type === "CNAME") {
      return {
        value: l.valuesToVariables(config, rr.value[type]),
        ttl: rr.ttl,
      };
    } else if (type === "CAA") {
      const displayValue = { tag: l.valuesToVariables(config, rr.value[type].tag), ttl: rr.ttl };

      if (rr.value[type].tag === "issue" || rr.value[type].tag === "issuewild") {
        displayValue.caaValue = l.valuesToVariables(config, rr.value[type].value);
      } else if (displayValue.tag === "iodef") {
        displayValue.caaValue = l.valuesToVariables(config, rr.value[type].value);
      }
      displayValue.tag = displayValue.tag.toLowerCase();
      return displayValue;
    } else if (type === "SOA") {
      rr.value[type].mname = l.valuesToVariables(config, rr.value[type].mname);
      rr.value[type].rname = l.valuesToVariables(config, rr.value[type].rname);
      return { ttl: rr.ttl, ...rr.value[type] };
    } else if (type === "MX") {
      rr.value[type].exchange = l.valuesToVariables(config, rr.value[type].exchange);
      return {
        ttl: rr.ttl,
        ...rr.value[type],
      };
    } else if (type === "SRV") {
      rr.value[type].target = l.valuesToVariables(config, rr.value[type].target);
      return { ttl: rr.ttl, ...rr.value[type] };
    } else {
      console.log("MISSING TYPE", type);
      return false;
    }
  });

  return {
    name: l.valuesToVariables(config, name),
    type,
    values: display_values,
  };
};

export const toPektinApiRecord = (config: t.Config, record: t.DisplayRecord): RedisEntry => {
  record = cloneDeep(record);
  const rr_set: PektinRRset = record.values.map((rr, i) => {
    if (record.type === "A" || record.type === "AAAA") {
      return {
        ttl: rr.ttl,
        value: { [record.type]: l.variablesToValues(config, rr.value.replace(/\s+/g, "")) },
      };
    } else if (record.type === "NS" || record.type === "CNAME") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: l.absoluteName(
            l.variablesToValues(config, rr.value.replaceAll(/\s+/g, ""))
          ),
        },
      };
    } else if (record.type === "TXT") {
      return {
        ttl: rr.ttl,
        value: { [record.type]: rr.value },
      };
    } else if (record.type === "CAA") {
      if (rr.tag.toLowerCase() === "issue" || rr.tag.toLowerCase() === "issuewild") {
        return {
          ttl: rr.ttl,
          value: {
            [record.type]: {
              issuer_critical: true,
              tag: l.variablesToValues(config, rr.tag).toLowerCase(),
              value: l.variablesToValues(config, rr.caaValue.replaceAll(/\s+/g, "")),
            },
          },
        };
      } else if (rr.tag.toLowerCase() === "iodef") {
        return {
          ttl: rr.ttl,
          value: {
            [record.type]: {
              issuer_critical: true,
              tag: "iodef",
              value: l.variablesToValues(config, rr.caaValue.replaceAll(/\s+/g, "")),
            },
          },
        };
      } else {
        return false;
      }
    } else if (record.type === "OPENPGPKEY") {
      return { ttl: rr.ttl, value: { [record.type]: rr.value } };
    } else if (record.type === "TLSA") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            cert_usage: rr.usage,
            selector: rr.selector,
            matching: rr.matching_type,
            cert_data: rr.data,
          },
        },
      };
    } else if (record.type === "SOA") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            mname: l.absoluteName(l.variablesToValues(config, rr.mname.replaceAll(/\s+/g, ""))),
            rname: l.absoluteName(l.variablesToValues(config, rr.rname.replaceAll(/\s+/g, ""))),
            refresh: rr.refresh === undefined ? 0 : rr.refresh,
            retry: rr.retry === undefined ? 0 : rr.retry,
            serial: rr.serial === undefined ? 0 : rr.serial,
            expire: rr.expire === undefined ? 0 : rr.expire,
            minimum: rr.minimum === undefined ? 0 : rr.minimum,
          },
        },
      };
    } else if (record.type === "MX") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            exchange: l.absoluteName(
              l.variablesToValues(config, rr.exchange.replaceAll(/\s+/g, ""))
            ),
            preference: rr.preference === undefined ? 0 : rr.preference,
          },
        },
      };
    } else if (record.type === "SRV") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            priority: rr.priority === undefined ? 0 : rr.priority,
            weight: rr.weight === undefined ? 0 : rr.weight,
            port: rr.port === undefined ? 0 : rr.port,
            target:
              rr.target === undefined
                ? ""
                : l.absoluteName(l.variablesToValues(config, rr.target.replaceAll(/\s+/g, ""))),
          },
        },
      };
    } else {
      console.log("MISSING TYPE", record.type);
      return false;
    }
  });

  return {
    name: `${l
      .absoluteName(l.variablesToValues(config, record.name.replaceAll(/\s+/g, "")))
      .toLowerCase()}:${record.type}`,
    rr_set,
  };
};

export interface RedisEntry {
  name: string;
  rr_set: PektinRRset;
}

export type PektinRRset = Array<PektinResourceRecord>;

// a resource record with a ttl and the rr value
export interface PektinResourceRecord {
  ttl: number;
  value: PektinResourceRecordValue;
}

type PektinRRTypes =
  | "NEW"
  | "A"
  | "AAAA"
  | "NS"
  | "CNAME"
  | "SOA"
  | "MX"
  | "TXT"
  | "SRV"
  | "CAA"
  | "OPENPGPKEY"
  | "TLSA";

// the resource record value
type PektinResourceRecordValue =
  | A
  | AAAA
  | NS
  | CNAME
  | PTR
  | SOA
  | MX
  | TXT
  | SRV
  | CAA
  | OPENPGPKEY
  | TLSA;

interface A {
  [A: string]: string;
}
interface AAAA {
  [AAAA: string]: string;
}
interface NS {
  [NS: string]: string;
}
interface CNAME {
  [CNAME: string]: string;
}

interface SOA {
  [SOA: string]: SOAValue;
}
interface SOAValue {
  mname: string;
  rname: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimum: number;
}
interface MX {
  [MX: string]: MXValue;
}
interface MXValue {
  preference: number;
  exchange: string;
}
interface TXT {
  [TXT: string]: string;
}

interface SRV {
  [SRV: string]: SRVValue;
}
interface SRVValue {
  priority: number;
  weight: number;
  port: number;
  target: string;
}

interface CAA {
  [CAA: string]: CAAValue;
}
interface CAAValue {
  issuer_critical: boolean;
  tag: "Issue" | "IssueWild" | "Iodef";
  value: Issuer[] | Url;
}
interface Issuer {
  key: string;
  value: string;
}
type Url = `https://${string}` | `http://${string}` | `mailto:${string}`;

interface OPENPGPKEY {
  [OPENPGPKEY: string]: string;
}

interface TLSA {
  [TLSA: string]: TLSAValue;
}
interface TLSAValue {
  cert_usage: "CA" | "Service" | "TrustAnchor" | "DomainIssued";
  selector: "Full" | "Spki";
  matching: "Raw" | "Sha256" | "Sha512";
  cert_data: string;
}
