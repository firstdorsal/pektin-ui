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
    queries: string[];
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

type RequestBody = SetRequestBody | GetRequestBody | SearchRequestBody | DeleteRequestBody;

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
                ${JSON.stringify(records.map(toRealRecord), null, "    ")}
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
        dev: config?.pektin?.dev
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
        body: JSON.stringify({ ...body, token })
    });

    return await res.json().catch(() => ({ error: true, message: res.statusText, data: {} }));
};

export const getDomains = async (config: t.Config): Promise<string[]> => {
    const res = await request(config, "search", { glob: "*.:SOA" });
    if (!res.data || !Array.isArray(res.data)) return [];
    return res.data.map(e => e.split(":")[0].slice(0, -1));
};

export const getRecords = async (config: t.Config, domainName: string) => {
    const req = await request(config, "search", { glob: `*${l.absoluteName(domainName)}:*` });
    const recordKeys = req.data;
    if (!Array.isArray(recordKeys)) return [];

    const recordValues = (await request(config, "get", { queries: recordKeys })).data;
    const records: RedisEntry[] = [];
    recordKeys.forEach((e, i) => {
        records[i] = { name: e, ...recordValues[i] };
    });

    return records.map(toDisplayRecord);
};

export const setRecords = async (config: t.Config, records: t.DisplayRecord[]) => {
    return await request(config, "set", { records: records.map(toRealRecord) });
};

export const deleteRecords = async (config: t.Config, records: t.DisplayRecord[]) => {
    return await request(config, "delete", { keys: records.map(toRealRecord).map(e => e.name) });
};

export const addDomain = async (config: t.Config, records: t.DisplayRecord[]) => {
    return await request(config, "set", { records: records.map(toRealRecord) });
};

export const toDisplayRecord = (record: RedisEntry): t.DisplayRecord => {
    const [name, type]: [string, PektinRRTypes] = record.name.split(":");
    if (type === "TXT") {
        const a = new Uint8Array(record.rr_set[0].value.TXT.txt_data[0]);
        record.rr_set[0].value.TXT = Buffer.from(a).toString();
    } else if (type === "OPENPGPKEY") {
        const a = new Uint8Array(record.rr_set[0].value.OPENPGPKEY.public_key);
        record.rr_set[0].value.OPENPGPKEY = Buffer.from(a).toString();
    } else if (type === "TLSA") {
        const cert_usage = ["CA", "Service", "TrustAnchor", "DomainIssued"];
        const selector = ["Full", "Spki"];
        const matching = ["Raw", "Sha256", "Sha512"];

        const a = new Uint8Array(record.rr_set[0].value.TLSA.cert_data);

        record.rr_set[0].value.TLSA = {
            data: Buffer.from(a).toString(),

            usage: cert_usage.findIndex(e => e === record.rr_set[0].value.TLSA.cert_usage) + 1,

            selector: selector.findIndex(e => e === record.rr_set[0].value.TLSA.selector) + 1,

            matching_type: matching.findIndex(e => e === record.rr_set[0].value.TLSA.matching) + 1
        };
    } else if (
        (type === "A" || type === "AAAA" || type === "NS" || type === "CNAME" || type === "PTR") &&
        record.rr_set.length > 1
    ) {
        record.rr_set.forEach((e, i) => {
            if (i > 0) record.rr_set[0].value[type] += " " + record.rr_set[i].value[type];
        });
    } else if (type === "CAA") {
        const tag = record.rr_set[0].value[type].tag;
        record.rr_set[0].value[type].tag = tag.toLowerCase();
        if (tag === "Issue" || tag === "IssueWild") {
            record.rr_set[0].value[type].value = record.rr_set[0].value[type].value.Issuer[0];
        } else if (tag === "Iodef") {
            record.rr_set[0].value[type].value = record.rr_set[0].value[type].value.Url;
        }
    }

    return {
        name,

        type,
        ttl: record.rr_set[0].ttl,
        value: record.rr_set[0].value as t.ResourceRecordValue
    };
};

export const toRealRecord = (record: t.DisplayRecord): RedisEntry => {
    record = cloneDeep(record);
    let rr_set: PektinRRset = [{ value: record.value, ttl: record.ttl }];

    if (
        (record.type === "A" ||
            record.type === "AAAA" ||
            record.type === "NS" ||
            record.type === "CNAME" ||
            record.type === "PTR") &&
        typeof record.value[record.type] === "string"
    ) {
        rr_set = record.value[record.type].split(" ").map((value: string) => {
            if (typeof value === "string" && (record.type === "NS" || record.type === "CNAME"))
                value = l.absoluteName(value);
            return { value: { [record.type]: value }, ttl: record.ttl };
        });
    } else if (record.type === "TXT") {
        const buff = Buffer.from(rr_set[0].value.TXT, "utf-8");

        rr_set[0].value.TXT = { txt_data: [buff.toJSON().data] };
    } else if (record.type === "CAA") {
        rr_set[0].value.CAA.issuer_critical = true;
        const tag = rr_set[0].value.CAA.tag.toLowerCase();
        if (tag === "issue" || tag === "issuewild") {
            if (tag === "issue") {
                rr_set[0].value.CAA.tag = "Issue";
            } else {
                rr_set[0].value.CAA.tag = "IssueWild";
            }
            rr_set[0].value.CAA.value = {
                Issuer: [rr_set[0].value.CAA.value, []] //{ key: "", value: "" }
            };
        } else if (tag === "iodef") {
            rr_set[0].value.CAA.tag = "Iodfef";
            rr_set[0].value.CAA.value = { Url: rr_set[0].value.CAA.value };
        }
    } else if (record.type === "OPENPGPKEY") {
        const buff = Buffer.from(rr_set[0].value.OPENPGPKEY, "utf-8");

        rr_set[0].value.OPENPGPKEY = { public_key: buff.toJSON().data };
    } else if (record.type === "TLSA") {
        const cert_usage = ["CA", "Service", "TrustAnchor", "DomainIssued"];
        const selector = ["Full", "Spki"];
        const matching = ["Raw", "Sha256", "Sha512"];

        const buff = Buffer.from(rr_set[0].value.TLSA.data, "utf-8");
        rr_set[0].value.TLSA = {
            cert_usage: cert_usage[rr_set[0].value.TLSA.usage - 1],
            selector: selector[rr_set[0].value.TLSA.selector - 1],
            matching: matching[rr_set[0].value.TLSA.matching_type - 1],
            cert_data: buff.toJSON().data
        };
    }

    if (l.rrTemplates[record.type].complex) {
        const fieldNames = Object.keys(l.rrTemplates[record.type].fields);
        const fieldValues = Object.keys(l.rrTemplates[record.type].fields);
        fieldNames.forEach((fieldName: any, i) => {
            const field = fieldValues[i];
            if (field.absolute) {
                record.value[record.type][fieldName] = l.absoluteName(
                    record.value[record.type][fieldName]
                );
                if (field.name === "rname") {
                    record.value[record.type][fieldName] = record.value[record.type][
                        fieldName
                    ].replaceAll("@", ".");
                }
            }
        });
    }
    return {
        name: `${l.absoluteName(record.name).toLowerCase()}:${record.type}`,
        rr_set
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
