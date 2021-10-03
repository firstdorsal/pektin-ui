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
    records: t.RedisEntry[];
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

const request = async (config: t.Config, type: RequestType, body: RequestBody): Promise<PektinResponse> => {
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
    const records: t.RedisEntry[] = [];
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

export const toDisplayRecord = (record: t.RedisEntry): t.DisplayRecord => {
    /*@ts-ignore*/
    const [name, type]: [string, t.RRTypes] = record.name.split(":");
    if (type === "TXT") {
        /*@ts-ignore*/
        const a = new Uint8Array(record.rr_set[0].value.TXT.txt_data[0]);
        record.rr_set[0].value.TXT = Buffer.from(a).toString();
    } else if (type === "CAA") {
        /*@ts-ignore*/
        record.rr_set[0].value.CAA.value = record.rr_set[0].value.CAA.value.url;
    } else if (type === "OPENPGPKEY") {
        /*@ts-ignore*/
        const a = new Uint8Array(record.rr_set[0].value.OPENPGPKEY.public_key);
        record.rr_set[0].value.OPENPGPKEY = Buffer.from(a).toString();
    } else if (type === "TLSA") {
        /*@ts-ignore*/
        const a = new Uint8Array(record.rr_set[0].value.TLSA.cert_data);
        /*@ts-ignore*/
        record.rr_set[0].value.TLSA.cert_data = Buffer.from(a).toString();
    } else if ((type === "A" || type === "AAAA" || type === "NS") && record.rr_set.length > 1) {
        console.log(record);

        record.rr_set.forEach((e, i) => {
            if (i > 0) record.rr_set[0].value[type] += " " + record.rr_set[i].value[type];
        });
    }
    return {
        name,
        /*@ts-ignore*/
        type,
        ttl: record.rr_set[0].ttl,
        value: record.rr_set[0].value
    };
};

export const toRealRecord = (record: t.DisplayRecord): t.RedisEntry => {
    record = cloneDeep(record);
    let rr_set = [{ value: record.value, ttl: record.ttl }];

    if (
        (record.type === "A" || record.type === "AAAA" || record.type === "NS") &&
        typeof record.value[record.type] === "string"
    ) {
        /*@ts-ignore*/
        rr_set = record.value[record.type].split(" ").map((value: string) => {
            if (typeof value === "string" && record.type === "NS") value = l.absoluteName(value);
            return { value: { [record.type]: value }, ttl: record.ttl };
        });
    } else if (record.type === "TXT") {
        /*@ts-ignore*/
        const buff = Buffer.from(rr_set[0].value.TXT, "utf-8");

        rr_set[0].value.TXT = { txt_data: [buff.toJSON().data] };
    } else if (record.type === "CAA") {
        /*@ts-ignore*/
        rr_set[0].value.CAA.value = { Issuer: rr_set[0].value.CAA.value };
    } else if (record.type === "OPENPGPKEY") {
        /*@ts-ignore*/
        const buff = Buffer.from(rr_set[0].value.OPENPGPKEY, "utf-8");

        rr_set[0].value.OPENPGPKEY = { public_key: buff.toJSON().data };
    }

    if (l.rrTemplates[record.type].complex) {
        l.rrTemplates[record.type].fields.forEach((field: any) => {
            if (field.absolute) {
                /*@ts-ignore*/
                record.value[record.type][field.name] = l.absoluteName(record.value[record.type][field.name]);
                if (field.name === "rname") {
                    /*@ts-ignore*/
                    record.value[record.type][field.name] = record.value[record.type][field.name].replaceAll("@", ".");
                }
            }
        });
    }
    return {
        name: `${l.absoluteName(record.name)}:${record.type}`,
        rr_set
    };
};
