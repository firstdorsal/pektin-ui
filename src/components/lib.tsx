import { ReactNode } from "react";
import * as t from "./types";

export const getDomains = async ({ apiEndpoint }: t.RequestParams) => {
    const res = await fetch(`${apiEndpoint}/get`, { method: "POST", body: JSON.stringify({}) });
    const parsedRes = await res.json().catch(e => {
        return [];
    });
    return parsedRes;
};

export const getRecords = async ({ apiEndpoint, domainName }: t.getRecords) => {
    const res = await fetch(`${apiEndpoint}/get`, { method: "POST", body: JSON.stringify({}) });
    const parsedRes = await res.json().catch(e => {
        return [];
    });
    return parsedRes;
};

export const absoluteName = (name: string) => {
    if (!name?.length) return "";
    if (name[name.length - 1] !== ".") return name + ".";
    return name;
};

export const getName = (rec0: t.Rec0) => {
    return rec0.name.substring(0, rec0.name.indexOf(":"));
};

export const rec0ToBind = (rec0: t.Rec0, onlyValues: boolean = false): ReactNode => {
    if (!rec0 || !rec0.value) return;
    const rec1 = rec0.value as t.Rec1;
    if (rec1.rr_type === "SOA") {
        const soa = rec1.rr_set[0].value.SOA as t.SOAValue;
        const rr_set = rec1.rr_set[0];
        if (onlyValues) return `${soa.mname} ${soa.rname}`;
        return `${absoluteName(getName(rec0))} ${rr_set.ttl ? rr_set.ttl : ""} IN ${rec1.rr_type} ${soa.mname} ${soa.rname} ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minimum}`;
    }
};

export const rrTemplates: any = {
    A: {
        template: {
            A: ""
        },
        fields: [
            {
                name: "addr",
                placeholder: "127.0.0.1",
                inputType: "text",
                width: 12
            }
        ],
        color: "brown"
    },
    AAAA: {
        template: {
            AAAA: ""
        },
        fields: [
            {
                name: "addr",
                placeholder: "::1",
                inputType: "text",
                width: 12
            }
        ],
        color: "lime"
    },
    NS: {
        template: {
            NS: ""
        },
        fields: [
            {
                name: "name",
                placeholder: "ns1.example.com",
                inputType: "text",
                width: 12
            }
        ],
        color: "darkgreen"
    },
    CNAME: {
        template: {
            CNAME: ""
        },
        fields: [
            {
                name: "name",
                placeholder: "example.com",
                inputType: "text",
                width: 12
            }
        ],
        color: "red"
    },
    PTR: {
        template: {
            PTR: ""
        },
        fields: [
            {
                name: "name",
                placeholder: "",
                inputType: "text",
                width: 12
            }
        ]
    },
    SOA: {
        template: {
            SOA: {
                mname: "",
                rname: "hostmaster.",
                serial: 0,
                refresh: 0,
                retry: 0,
                expire: 0,
                minimum: 0
            }
        },
        fields: [
            {
                name: "mname",
                placeholder: "ns1.example.com",
                helperText: "The domains primary name server",
                inputType: "text",
                width: 6
            },
            {
                name: "rname",
                placeholder: "hostmaster.example.com",
                helperText: "hostmaster email, the @ is replaced with a .",
                inputType: "text",
                width: 6
            }
        ],
        color: "orange",
        info: (
            <div>
                <h2>SOA Record</h2>
                <p>The "Start Of Authority" record is the most important one as it defines the existence of the zone.</p>
            </div>
        )
    },
    MX: {
        template: {
            MX: {
                preference: 10,
                exchange: ""
            }
        },
        fields: [
            {
                name: "preference",
                placeholder: "10",
                inputType: "number"
            },
            { name: "exchange", placeholder: "mx.example.com", inputType: "text" }
        ],
        color: "blue"
    },
    TXT: {
        template: {
            TXT: ""
        },
        fields: [
            {
                name: "text",
                placeholder: "this is some text",
                inputType: "text",
                width: 12
            }
        ],
        color: "gray"
    },
    DNSKEY: {
        template: {
            flags: 257,
            protocol: 3,
            algorithm: 13,
            key_data: ""
        }
    },
    SRV: {
        template: {
            SRV: {
                priority: 1,
                weight: 1,
                port: "",
                target: ""
            }
        },
        fields: [
            { name: "priority", placeholder: 1, inputType: "number", width: 2 },
            { name: "weight", placeholder: 1, inputType: "number", width: 2 },
            { name: "port", placeholder: 443, inputType: "number", width: 2 },
            { name: "data", placeholder: "", inputType: "text", width: 6 }
        ],
        color: "purple"
    },
    CAA: {
        template: {
            CAA: {
                flag: 0,
                tag: "issue",
                value: "letsencrypt.org"
            }
        },
        fields: [
            {
                name: "tag",
                placeholder: "issue",
                inputType: "text",
                width: 6
            },
            { name: "value", placeholder: "letsencrypt.org", inputType: "text", width: 6 }
        ],
        color: "pink"
    },
    OPENPGPKEY: {
        template: {
            OPENPGPKEY: ""
        },
        fields: [{ name: "key", placeholder: "", inputType: "text", width: 12 }],
        color: "darkred"
    },
    TLSA: {
        template: {
            TLSA: {
                usage: 3,
                selector: 1,
                matching_type: 1,
                data: ""
            }
        },
        fields: [
            { name: "usage", placeholder: 3, inputType: "number", width: 2 },
            { name: "selector", placeholder: 1, inputType: "number", width: 2 },
            { name: "matching_type", placeholder: 1, inputType: "number", width: 2 },
            { name: "data", placeholder: "", inputType: "text", width: 6 }
        ],
        color: "yellow"
    }
};
