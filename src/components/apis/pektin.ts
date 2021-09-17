import * as t from "../types";
import * as l from "../lib";

import * as vaultApi from "./vault";
const f = fetch;

const pektinDevEndpoint = "127.0.0.1:8081";

export interface PektinApiAuth {
    endpoint: string;
    token: string;
    dev?: boolean;
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
    if (getDevFromConfig(config)) return pektinDevEndpoint;
    if (!config?.pektin?.apiSubDomain || !config?.pektin?.domain) return "";
    return config?.pektin?.apiSubDomain + "." + config?.pektin?.domain;
};

export const getTokenFromConfig = async (config: t.Config): Promise<string> => {
    const res = await vaultApi.getKey({ ...config.vaultAuth, key: "gss_token" });
    return res.token;
};

export const getDevFromConfig = (config: t.Config): boolean => (config?.pektin?.dev ? true : false);

export const getAuthFromConfig = async (config: t.Config): Promise<PektinApiAuth> => {
    return {
        token: await getTokenFromConfig(config),
        endpoint: getDomainFromConfig(config),
        dev: getDevFromConfig(config)
    };
};

const request = async (config: t.Config, type: RequestType, body: RequestBody): Promise<PektinResponse> => {
    const { token, endpoint, dev } = await getAuthFromConfig(config);
    const res = await f(`${dev ? "http://" : "https://"}${endpoint}/${type}`, { method: "POST", body: JSON.stringify({ ...body, token }) });
    return await res.json();
};

export const getDomains = async (config: t.Config): Promise<string[]> => {
    const res = await request(config, "search", { regex: ".*.:SOA" });
    if (!res.data) return [];
    return res.data;
};

export const getRecords = async (config: t.Config, domainName: string) => {
    return await request(config, "get", { query: l.absoluteName(domainName) });
};

export const addDomain = async (config: t.Config, records: t.RedisEntry[]) => {
    return await request(config, "set", { records });
};
