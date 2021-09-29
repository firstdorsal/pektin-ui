import { ReactNode } from "react";
import * as t from "./types";
import Dexie from "dexie";
// import foreignApis
import PektinBackup from "./foreignApis/PektinBackup";
import PowerDns from "./foreignApis/PowerDns";
import Wanderlust from "./foreignApis/Wanderlust";
import * as pektinApi from "./apis/pektin";

const defaultApiEndpoint = "http://127.0.0.1:3001";

export const isSupportedRecord = (record: t.DisplayRecord) => {
    if (supportedRecords.indexOf(record.type) > -1) return true;
    return false;
};

export const simpleDnsRecordToDisplayRecord = (simple: t.RawDnsRecord): t.DisplayRecord => {
    return {
        ...simple,
        value: textToRRValue(simple.type, simple.value)
    };
};

export const addDomain = (config: t.Config, dData: t.DisplayRecord, format = "pektin") => {
    if (format === "something") {
        return pektinApi.addDomain(config, [pektinApi.toRealRecord(dData)]);
    } else {
        return pektinApi.addDomain(config, [pektinApi.toRealRecord(dData)]);
    }
};

export const toRealRecord = (dData: t.DisplayRecord, format = "pektin"): t.RealData => {
    if (format === "something") {
        return pektinApi.toRealRecord(dData);
    } else {
        return pektinApi.toRealRecord(dData);
    }
};

export const toDisplayRecord = (rData: t.RealData, format = "pektin"): t.DisplayRecord => {
    if (format === "something") {
        return pektinApi.toDisplayRecord(rData);
    } else {
        return pektinApi.toDisplayRecord(rData);
    }
};

export const textToRRValue = (recordType: t.RRTypes, text: string): t.ResourceRecordValue => {
    const t = text.split(" ");
    switch (recordType) {
        case "SOA":
            return {
                SOA: {
                    mname: t[0],
                    rname: t[1],
                    serial: parseInt(t[2]),
                    refresh: parseInt(t[3]),
                    retry: parseInt(t[4]),
                    expire: parseInt(t[5]),
                    minimum: parseInt(t[6])
                }
            };
        case "MX":
            return {
                MX: {
                    preference: parseInt(t[0]),
                    exchange: t[1]
                }
            };
        case "DNSKEY":
            return {
                DNSKEY: {
                    flags: parseInt(t[0]),
                    protocol: parseInt(t[1]),
                    algorithm: parseInt(t[2]),
                    key_data: t[3]
                }
            };

        case "SRV":
            return {
                SRV: {
                    priority: parseInt(t[0]),
                    weight: parseInt(t[1]),
                    port: parseInt(t[2]),
                    target: t[3]
                }
            };

        case "CAA":
            return {
                CAA: {
                    flag: parseInt(t[0]),
                    tag: t[1],
                    value: t[2]
                }
            };

        case "TLSA":
            return {
                TLSA: {
                    usage: parseInt(t[0]),
                    selector: parseInt(t[1]),
                    matching_type: parseInt(t[2]),
                    data: t[3]
                }
            };

        default:
            return { [recordType]: text };
    }
};

export const jsTemp = (endpoint: string, data: t.RedisEntry[]) => {
    if (!endpoint) endpoint = defaultApiEndpoint;
    return `const token = process.env.PEKTIN_API_TOKEN;
const endpoint="${endpoint}";
const res = await fetch(endpoint + "/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        token,
        records: 
                ${JSON.stringify(data, null, "    ")}
    })
}).catch(e => {
    console.log(e);
});
console.log(res);`;
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
            localConfig: "key, value"
        });
        this.config = this.table("localConfig");
    }
}
const defaultVaultAuth: t.VaultAuth = {
    endpoint: "",
    token: ""
};

const defaultLocalConfig: t.LocalConfig = {
    defaultActiveTab: 0,
    codeStyle: "dracula",
    variables: [],
    synesthesia: false
};

export const defaulConfig: t.Config = {
    vaultAuth: defaultVaultAuth,
    foreignApis: [
        {
            name: "Wanderlust",
            class: Wanderlust,
            description:
                "Wanderlust imports a single domain per import with NSEC zone walking. To resolve the records, DNS queries are sent through Google or Cloudflare."
        },
        { name: "Pektin Backup", class: PektinBackup, description: "" },
        { name: "PowerDNS", class: PowerDns, description: "" }
    ],
    local: defaultLocalConfig,
    pektin: undefined
};

export const absoluteName = (name: string) => {
    if (!name?.length) return "";
    if (name[name.length - 1] !== ".") return name + ".";
    return name;
};

export const displayRecordToBind = (rec0: t.DisplayRecord, onlyValues: boolean = false): ReactNode => {
    if (!rec0 || !rec0.value) return "";
    if (rec0.type === "SOA") {
        const soa = rec0.value.SOA as t.SOAValue;
        if (onlyValues) return `${soa.mname} ${soa.rname}`;
        return `${absoluteName(rec0.name)} ${rec0.ttl ? rec0.ttl : ""} IN ${rec0.type} ${soa.mname} ${soa.rname} ${soa.serial} ${
            soa.refresh
        } ${soa.retry} ${soa.expire} ${soa.minimum}`;
    }
    return "Not Implemented for this record";
};

export const help: any = {
    auth: <div>helper text for auth</div>
};

export const supportedRecords = ["A", "AAAA", "NS", "CNAME", "PTR", "SOA", "MX", "TXT", "SRV", "CAA", "OPENPGPKEY", "TLSA"];

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
        color: [82, 51, 18],
        complex: false
    },
    AAAA: {
        template: {
            AAAA: ""
        },
        fields: [
            {
                name: "addr",
                placeholder: "1:see:bad:c0de",
                inputType: "text",
                width: 12
            }
        ],
        color: [43, 255, 0],
        complex: false
    },
    NS: {
        template: {
            NS: ""
        },
        fields: [
            {
                name: "name",
                placeholder: "ns1.example.com.",
                inputType: "text",
                width: 12,
                absolute: true
            }
        ],
        color: [29, 117, 0],
        complex: false
    },
    CNAME: {
        template: {
            CNAME: ""
        },
        fields: [
            {
                name: "name",
                placeholder: "example.com.",
                inputType: "text",
                width: 12,
                absolute: true
            }
        ],
        color: [255, 0, 0],
        complex: false
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
        ],
        complex: false
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
                placeholder: "ns1.example.com.",
                helperText: "The domain's primary name server",
                inputType: "text",
                width: 6,
                absolute: true
            },
            {
                name: "rname",
                placeholder: "hostmaster.example.com.",
                helperText: "Hostmaster email, the @ is replaced with a dot",
                inputType: "text",
                width: 6,
                absolute: true
            }
        ],
        color: [255, 145, 0],
        info: (
            <div>
                <h2>SOA Record</h2>
                <p>The "Start Of Authority" record is the most important one, as it defines the existence of the zone.</p>
            </div>
        ),
        complex: true
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
                inputType: "number",
                width: 3
            },
            { name: "exchange", placeholder: "mx.example.com.", inputType: "text", width: 9, absolute: true }
        ],
        color: [29, 94, 224],
        complex: true
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
        color: [140, 140, 140],
        complex: false
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
            { name: "priority", placeholder: 1, inputType: "text", width: 2 },
            { name: "weight", placeholder: 1, inputType: "text", width: 2 },
            { name: "port", placeholder: 443, inputType: "text", width: 2 },
            { name: "target", placeholder: "mx.example.com.", inputType: "text", width: 6, absolute: true }
        ],
        color: [149, 61, 196],
        complex: true
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
        color: [212, 11, 165],
        complex: true
    },
    OPENPGPKEY: {
        template: {
            OPENPGPKEY: ""
        },
        fields: [{ name: "key", placeholder: "", inputType: "text", width: 12 }],
        color: [145, 0, 7],
        complex: false
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
            { name: "data", placeholder: "50c1ab1e11feb0a75", inputType: "text", width: 6 }
        ],
        color: [255, 217, 0],
        complex: true
    }
};

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
    "zenburn"
];
