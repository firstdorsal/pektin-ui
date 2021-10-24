// @ts-nocheck
import * as t from "../types";
import * as l from "../lib";

import * as vaultApi from "./vault";
import { cloneDeep } from "lodash";
const f = fetch;

export interface PektinApiAuth {
  endpoint: string;
  token: string;
  dev?: string | false;
}
export interface GetRequestBody {
  keys: string[];
}
export interface SearchRequestBody {
  glob: string;
}
export interface SetRequestBody {
  records: RedisEntry[];
}
export interface DeleteRequestBody {
  keys: string[];
}
export interface GetZoneRecordsRequestBody {
  names: string[];
}

type RequestBody =
  | SetRequestBody
  | GetRequestBody
  | SearchRequestBody
  | DeleteRequestBody
  | GetZoneRecordsRequestBody;

type RequestType = "set" | "get" | "search" | "delete";

interface PektinResponse {
  error: boolean;
  data: any;
  message: string;
}

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
                  records.map((record) => toRealRecord(config, record)),
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

const request = async (
  config: t.Config,
  type: RequestType,
  body: RequestBody
): Promise<PektinResponse> => {
  const { token, endpoint, dev } = await getAuthFromConfig(config);
  const uri = dev ? "http://" + endpoint : "https://" + endpoint;
  const res = await f(`${uri}/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, token }),
  }).catch((e) => {
    e = e.toString();
    e = e.substring(e.indexOf(":") + 2);
    return { error: e };
  });
  if (res.error) return res;
  return await res.json().catch(() => ({ error: true, message: res.statusText, data: {} }));
};

export const getDomains = async (config: t.Config): Promise<string[]> => {
  const res = await request(config, "search", { glob: "*.:SOA" });
  if (!res.data || !Array.isArray(res.data)) return [];
  return res.data.map((e) => e.split(":")[0]);
};

export const getAllRecords = async (config: t.Config, domainName: string) => {
  const req = await request(config, "get-zone-records", { names: [l.absoluteName(domainName)] });
  const recordKeys = req.data[l.absoluteName(domainName)];
  if (!Array.isArray(recordKeys)) return [];

  const recordValues = (await request(config, "get", { keys: recordKeys })).data;

  const records: RedisEntry[] = [];
  recordKeys.forEach((e, i) => {
    records[i] = { name: e, ...recordValues[i] };
  });

  return records.map((record) => toDisplayRecord(config, record));
};

export const setRecords = async (config: t.Config, records: t.DisplayRecord[]) => {
  return await request(config, "set", {
    records: records.map((record) => toRealRecord(config, record)),
  });
};
export const getRecords = async (config: t.Config, records: t.DisplayRecord[]) => {
  const recordKeys = records.map((record) => toRealRecord(config, record).name);
  const recordValues = (await request(config, "get", { keys: recordKeys })).data;

  const newRecords: RedisEntry[] = [];
  recordKeys.forEach((e, i) => {
    newRecords[i] = { name: e, ...recordValues[i] };
  });
  return newRecords.map((record) => toDisplayRecord(config, record));
};

export const deleteRecords = async (config: t.Config, records: t.DisplayRecord[]) => {
  return await request(config, "delete", {
    keys: records.map((record) => toRealRecord(config, record)).map((e) => e.name),
  });
};

export const addDomain = async (config: t.Config, records: t.DisplayRecord[]) => {
  return await request(config, "set", {
    records: records.map((record) => toRealRecord(config, record)),
  });
};

export const toDisplayRecord = (config: t.Config, record: RedisEntry): t.DisplayRecord => {
  const [name, type]: [string, PektinRRTypes] = record.name.split(":");
  const { rr_set } = record;
  const display_values = rr_set.map((rr, i) => {
    if (type === "TXT") {
      const a = new Uint8Array(rr.value.TXT.txt_data[0]);
      return { value: l.valuesToVariables(config, Buffer.from(a).toString()), ttl: rr.ttl };
    } else if (type === "OPENPGPKEY") {
      const a = new Uint8Array(rr.value.OPENPGPKEY.public_key);
      return { value: l.valuesToVariables(config, Buffer.from(a).toString()), ttl: rr.ttl };
    } else if (type === "TLSA") {
      const cert_usage = ["CA", "Service", "TrustAnchor", "DomainIssued"];
      const selector = ["Full", "Spki"];
      const matching = ["Raw", "Sha256", "Sha512"];

      const a = new Uint8Array(rr.value.TLSA.cert_data);

      return {
        data: l.valuesToVariables(config, Buffer.from(a).toString()),
        usage: cert_usage.findIndex((e) => e === rr.value.TLSA.cert_usage) + 1,
        selector: selector.findIndex((e) => e === rr.value.TLSA.selector) + 1,
        matching_type: matching.findIndex((e) => e === rr.value.TLSA.matching) + 1,
        ttl: rr.ttl,
      };
    } else if (
      type === "A" ||
      type === "AAAA" ||
      type === "NS" ||
      type === "CNAME" ||
      type === "PTR"
    ) {
      return {
        value: l.valuesToVariables(config, rr.value[type]),
        ttl: rr.ttl,
      };
    } else if (type === "CAA") {
      const displayValue = { tag: l.valuesToVariables(config, rr.value[type].tag), ttl: rr.ttl };

      if (rr.value[type].tag === "Issue" || rr.value[type].tag === "IssueWild") {
        displayValue.caaValue = l.valuesToVariables(config, rr.value[type].value.Issuer[0]);
      } else if (displayValue.tag === "Iodef") {
        displayValue.caaValue = l.valuesToVariables(config, rr.value[type].value.Url);
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

export const toRealRecord = (config: t.Config, record: t.DisplayRecord): RedisEntry => {
  record = cloneDeep(record);
  const rr_set: PektinRRset = record.values.map((rr, i) => {
    if (record.type === "A" || record.type === "AAAA") {
      return {
        ttl: rr.ttl,
        value: { [record.type]: l.variablesToValues(config, rr.value.replace(/\s+/g, "")) },
      };
    } else if (record.type === "NS" || record.type === "CNAME" || record.type === "PTR") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: l.absoluteName(
            l.variablesToValues(config, rr.value.replaceAll(/\s+/g, ""))
          ),
        },
      };
    } else if (record.type === "TXT") {
      const buff = Buffer.from(l.variablesToValues(config, rr.value), "utf-8");
      return {
        ttl: rr.ttl,
        value: { [record.type]: { txt_data: [buff.toJSON().data] } },
      };
    } else if (record.type === "CAA") {
      if (rr.tag.toLowerCase() === "issue" || rr.tag.toLowerCase() === "issuewild") {
        return {
          ttl: rr.ttl,
          value: {
            [record.type]: {
              issuer_critical: true,
              tag:
                l.variablesToValues(config, rr.tag).toLowerCase() === "issue"
                  ? "Issue"
                  : "IssueWild",
              value: {
                Issuer: [l.variablesToValues(config, rr.caaValue.replaceAll(/\s+/g, "")), []],
              },
            },
          },
        };
      } else if (tag === "iodef") {
        return {
          ttl: rr.ttl,
          value: {
            [record.type]: {
              issuer_critical: true,
              tag: "Iodef",
              value: {
                Url: l.variablesToValues(config, rr.caaValue.replaceAll(/\s+/g, "")),
              },
            },
          },
        };
      } else {
        return false;
      }
    } else if (record.type === "OPENPGPKEY") {
      const buff = Buffer.from(l.variablesToValues(config, rr.value), "utf-8");
      return { ttl: rr.ttl, value: { [record.type]: { public_key: buff.toJSON().data } } };
    } else if (record.type === "TLSA") {
      const cert_usage = ["CA", "Service", "TrustAnchor", "DomainIssued"];
      const selector = ["Full", "Spki"];
      const matching = ["Raw", "Sha256", "Sha512"];

      const buff = Buffer.from(l.variablesToValues(config, rr.data), "utf-8");
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            cert_usage: cert_usage[rr.usage - 1],
            selector: selector[rr.selector - 1],
            matching: matching[rr.matching_type - 1],
            cert_data: buff.toJSON().data,
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
  | "PTR"
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
interface PTR {
  [PTR: string]: string;
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
  [TXT: string]: TXTValue;
}
interface TXTValue {
  txt_data: Array<Array<number>>;
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
  [OPENPGPKEY: string]: OPENPGPKEYValue;
}

interface OPENPGPKEYValue {
  [public_key: string]: Array<number>;
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
