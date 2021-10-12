import * as t from "../types";
const f = fetch;

interface VaultAuthJSON {
    vaultEndpoint: string;
    username: string;
    password: string;
}

export const getToken = async (auth: VaultAuthJSON): Promise<Object> => {
    const loginCredRes: any = await f(
        `${auth.vaultEndpoint}/v1/auth/userpass/login/${auth.username}`,
        {
            method: "POST",
            body: JSON.stringify({
                password: auth.password
            })
        }
    ).catch(e => {
        e = e.toString();
        e = e.substring(e.indexOf(":") + 2);
        return { error: e };
    });

    if (loginCredRes.error) return loginCredRes;

    return await loginCredRes.json().catch(() => {});
};

export const getValue = async ({
    endpoint,
    token,
    key
}: {
    endpoint: string;
    token: string;
    key: string;
}) => {
    const res: any = await f(`${endpoint}/v1/pektin-kv/data/${key}`, {
        headers: {
            "X-Vault-Token": token
        }
    }).catch(e => {
        e = e.toString();
        e = e.substring(e.indexOf(":") + 2);
        return { error: e };
    });

    if (res.error) return res;

    const resJson = await res.json().catch(() => {});
    return resJson?.data?.data;
};

export const healthCheck = async (vaultAuth: t.VaultAuth) => {
    const res: any = await f(vaultAuth.endpoint + `/v1/sys/health`, {
        headers: {
            "X-Vault-Token": vaultAuth.token
        }
    }).catch(e => {
        e = e.toString();
        e = e.substring(e.indexOf(":") + 2);
        return { error: e };
    });
    if (res.error) return res;

    const resJson = await res.json().catch(() => {});
    return resJson;
};
