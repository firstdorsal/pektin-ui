import * as t from "../types";
import * as l from "../lib";

import * as vaultApi from "./vault";
const f = fetch;

export interface PektinApiAuth {
    endpoint: string;
    token: string;
    dev?: string | false;
}
export interface GetRequestBody {
    query: string;
}
export interface SearchRequestBody {
    glob: string;
}
export interface SetRequestBody {
    records: t.RedisEntry[];
}

type RequestBody = SetRequestBody | GetRequestBody | SearchRequestBody;

type RequestType = "set" | "get" | "search";

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
    return await request(config, "search", { glob: `*${l.absoluteName(domainName)}:*` });
};

export const addDomain = async (config: t.Config, records: t.RedisEntry[]) => {
    return await request(config, "set", { records });
};

export const toDisplayRecord = (record: t.RedisEntry): t.DisplayRecord => {
    const [name, type] = record.name.split(":");
    return {
        name,
        /*@ts-ignore*/
        type,
        ttl: record.value.rr_set[0].ttl,
        value: record.value.rr_set[0].value
    };
};

export const toRealRecord = (record: t.DisplayRecord): t.RedisEntry => {
    let rr_set = [{ value: record.value, ttl: record.ttl }];

    if (
        (record.type === "A" || record.type === "AAAA" || record.type === "NS") &&
        typeof record.value[record.type] === "string"
    ) {
        /*@ts-ignore*/
        rr_set = record.value[record.type].split(" ").map((value: string) => {
            if (typeof value === "string" && record.type === "NS") value = l.absoluteName(value);
            return { value, ttl: record.ttl };
        });
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
        value: {
            rr_set,
            rr_type: record.type
        }
    };
};
