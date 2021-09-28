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
    regex: string;
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
    if (config?.pektin?.dev === "local") return "http://127.0.0.1:3001";
    if (config?.pektin?.dev === "insecure-online") return `http://${config?.pektin?.insecureDevIp}:3001`;

    if (!config?.pektin?.apiSubDomain || !config?.pektin?.domain) return "";
    return config?.pektin?.apiSubDomain + "." + config?.pektin?.domain;
};

export const getTokenFromConfig = async (config: t.Config): Promise<string> => {
    const res = await vaultApi.getValue({ ...config.vaultAuth, key: "gss_token" });
    return res?.token;
};

export const getAuthFromConfig = async (config: t.Config): Promise<PektinApiAuth> => {
    let dev = config?.pektin?.dev === undefined ? false : config?.pektin?.dev;
    if (config?.pektin?.dev === "local") dev = "http://127.0.0.1:3001";
    if (config?.pektin?.dev === "insecure-online") dev = `http://${config?.pektin?.insecureDevIp}:3001`;

    return {
        token: await getTokenFromConfig(config),
        endpoint: getDomainFromConfig(config),
        dev
    };
};

const request = async (config: t.Config, type: RequestType, body: RequestBody): Promise<PektinResponse> => {
    const { token, endpoint, dev } = await getAuthFromConfig(config);
    const uri = `${dev ? dev : "https://"}${endpoint}/${type}`;
    const res = await f(uri, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, token })
    });
    return await res.json().catch(() => ({ error: true, message: res.statusText, data: {} }));
};

export const getDomains = async (config: t.Config): Promise<string[]> => {
    const res = await request(config, "search", { regex: ".*.:SOA" });
    if (!res.data) return [];
    return res.data;
};

export const getRecords = async (config: t.Config, domainName: string) => {
    return await request(config, "search", { regex: `.*${l.absoluteName(domainName)}::*` });
};

export const addDomain = async (config: t.Config, records: t.RedisEntry[]) => {
    return await request(config, "set", { records });
};
