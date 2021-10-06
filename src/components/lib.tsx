import { ReactNode } from "react";
import * as t from "./types";
import Dexie from "dexie";
// import foreignApis
import PektinBackup from "./foreignApis/PektinBackup";
import PowerDns from "./foreignApis/PowerDns";
import Wanderlust from "./foreignApis/Wanderlust";
import * as pektinApi from "./apis/pektin";

export const defaultSearchMatch = {
    name: false,
    type: false,
    ttl: false,
    value: {}
};

export const defaultMeta = {
    selected: false,
    expanded: false,
    changed: false,
    searchMatch: defaultSearchMatch,
    anySearchMatch: false
};

export type RealData = pektinApi.RedisEntry;

export const regex = {
    ip: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
    legacyIp:
        /^(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
    domainName:
        /^(?:[a-z0-9_](?:[a-z0-9-_]{0,61}[a-z0-9_]|[-]{2,}?)?\.)+[a-z0-9-_][a-z0-9-]{0,61}[a-z0-9]{1,61}[.]?$/
};

export const jsTemp = (config: t.Config, records: t.DisplayRecord[]) => {
    return pektinApi.jsTemp(config, records);
};

export const isSupportedRecord = (record: t.DisplayRecord) => {
    if (supportedRecords.indexOf(record.type) > -1) return true;
    return false;
};

export const getDomains = (config: t.Config, format = "pektin") => {
    return pektinApi.getDomains(config);
};

export const getRecords = (config: t.Config, domainName: string, format = "pektin") => {
    return pektinApi.getRecords(config, domainName);
};

export const setRecords = (config: t.Config, records: t.DisplayRecord[], format = "pektin") => {
    return pektinApi.setRecords(config, records);
};
export const deleteRecords = (config: t.Config, records: t.DisplayRecord[], format = "pektin") => {
    return pektinApi.deleteRecords(config, records);
};

export const addDomain = (config: t.Config, record: t.DisplayRecord, format = "pektin") => {
    return pektinApi.addDomain(config, [record]);
};

export const toRealRecord = (dData: t.DisplayRecord, format = "pektin"): RealData => {
    if (format === "something") {
        return pektinApi.toRealRecord(dData);
    } else {
        return pektinApi.toRealRecord(dData);
    }
};

export const toDisplayRecord = (rData: RealData, format = "pektin"): t.DisplayRecord => {
    if (format === "something") {
        return pektinApi.toDisplayRecord(rData);
    } else {
        return pektinApi.toDisplayRecord(rData);
    }
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

export const isAbsolute = (name: string): boolean => name[name.length - 1] === ".";

export const displayRecordToBind = (
    rec0: t.DisplayRecord,
    onlyValues: boolean = false
): ReactNode => {
    if (!rec0 || !rec0.value) return "";
    if (rec0.type === "SOA") {
        const soa = rec0.value.SOA as t.SOAValue;
        if (onlyValues) return `${soa.mname} ${soa.rname}`;
        return `${absoluteName(rec0.name)} ${rec0.ttl ? rec0.ttl : ""} IN ${rec0.type} ${
            soa.mname
        } ${soa.rname} ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minimum}`;
    }
    return "Not Implemented for this record";
};

export const help: any = {
    auth: <div>helper text for auth</div>
};

export const supportedRecords = [
    "A",
    "AAAA",
    "NS",
    "CNAME",
    "PTR",
    "SOA",
    "MX",
    "TXT",
    "SRV",
    "CAA",
    "OPENPGPKEY",
    "TLSA"
];

export const validateDomain = (input: string, params?: t.ValidateParams): t.ValidationResult => {
    if (input === undefined || !input.replace("*.", "").match(regex.domainName)) {
        return { type: "error", message: "Invalid domain" };
    }
    const domains = input.split(" ");
    if (domains[1] !== undefined && domains[domains.length - 1].length !== 0) {
        return {
            type: "error",
            message: "Spaces indicate a list of domains, but only one is supported here"
        };
    }

    if (input.indexOf("*") > -1 && input.indexOf("*") !== 0) {
        return {
            type: "error",
            message: "Wildcard records can only have a * in the beginning"
        };
    }

    if (input.startsWith(".")) {
        return {
            type: "error",
            message: "Name can't start with a dot (empty label)"
        };
    }
    if (params?.domainName) {
        if (!input.endsWith(params.domainName) && !input.endsWith(params.domainName.slice(0, -1))) {
            return {
                type: "error",
                message: `Name must end in the current domain name ${params?.domainName}`
            };
        } else if (
            input !== params.domainName &&
            input + "." !== params.domainName &&
            !input.endsWith("." + params.domainName) &&
            !(input + ".").endsWith("." + params.domainName)
        ) {
            return {
                type: "error",
                message: `Name must end in the current domain name ${params?.domainName} Subdomains must be seperated by a dot`
            };
        }
    }
    if (!isAbsolute(input.replaceAll(" ", ""))) {
        return {
            type: "warning",
            message: "Domains should be absolute (end with a dot)"
        };
    }
    if (input.toLowerCase() !== input) {
        return {
            type: "warning",
            message: "Domains should only contain lower case chars"
        };
    }
    return { type: "ok" };
};

export const validateIp = (input: string, type?: "legacy"): t.ValidationResult => {
    if (type === "legacy") {
        if (input === undefined || !input.match(regex.legacyIp)) {
            return {
                type: "error",
                message: "Invalid legacy/V4 IP adress"
            };
        }
    } else if (input === undefined || !input.match(regex.ip)) {
        return { type: "error", message: "Invalid IP" };
    }
    return { type: "ok" };
};

export const validateDomains = (input: string, params?: t.ValidateParams): t.ValidationResult => {
    input = input.replace(/\s\s+/g, " ");
    const domains = input.split(" ");

    if (domains.length === 1) return validateDomain(input, params);

    if (params?.domainName) {
        if (domains[domains.length - 1].length === 0) {
            return {
                type: "warning",
                message: "Spaces indicate a list of domains, but only one is supported here"
            };
        } else {
            return {
                type: "error",
                message: "Spaces indicate a list of domains, but only one is supported here"
            };
        }
    }

    for (let i = 0; i < domains.length; i++) {
        if (!domains[i].length) break;
        const v = validateDomain(domains[i], params);
        if (v.type !== "ok") {
            v.message = `Domain ${i + 1}: ${v.message}`;
            return v;
        }
    }
    if (domains[domains.length - 1] !== undefined && domains[domains.length - 1].length === 0) {
        return {
            type: "warning",
            message: "Space characters indicate a list, but no second element was provided"
        };
    }
    return { type: "ok" };
};

export const validateIps = (input: string, type?: "legacy"): t.ValidationResult => {
    input = input.replace(/\s\s+/g, " ");
    const ips = input.split(" ");
    if (ips.length === 1) return validateIp(input, type);

    for (let i = 0; i < ips.length; i++) {
        if (!ips[i].length) break;
        const v = validateIp(ips[i], type);
        if (v.type !== "ok") {
            v.message = `IP ${i + 1}: ${v.message}`;
            return v;
        }
    }
    if (ips[ips.length - 1] !== undefined && ips[ips.length - 1].length === 0) {
        return {
            type: "warning",
            message: "Space characters indicate a list, but no second element was provided"
        };
    }

    return { type: "ok" };
};

export const rrTemplates: any = {
    AAAA: {
        template: {
            AAAA: ""
        },
        fields: {
            ip_addr: {
                placeholder: "1:see:bad:c0de",
                inputType: "text",
                width: 12,
                validate: (field: string): t.ValidationResult => validateIps(field)
            }
        },
        color: [43, 255, 0],
        complex: false
    },
    A: {
        template: {
            A: ""
        },
        fields: {
            legacy_addr: {
                placeholder: "127.0.0.1",
                inputType: "text",
                width: 12,
                validate: (field: string): t.ValidationResult => validateIps(field, "legacy")
            }
        },
        color: [82, 51, 18],
        complex: false
    },
    NS: {
        template: {
            NS: ""
        },
        fields: {
            name: {
                placeholder: "ns1.example.com.",
                inputType: "text",
                width: 12,
                absolute: true,
                validate: (field: string): t.ValidationResult => validateDomains(field)
            }
        },
        color: [29, 117, 0],
        complex: false
    },
    CNAME: {
        template: {
            CNAME: ""
        },
        fields: {
            name: {
                placeholder: "example.com.",
                inputType: "text",
                width: 12,
                absolute: true,
                validate: (field: string): t.ValidationResult => validateDomains(field)
            }
        },
        color: [255, 0, 0],
        complex: false
    },
    PTR: {
        template: {
            PTR: ""
        },
        fields: {
            name: {
                placeholder: "example.com.",
                inputType: "text",
                width: 12,
                absolute: true,
                validate: (field: string): t.ValidationResult => validateDomains(field)
            }
        },
        color: [255, 122, 0],
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
        fields: {
            mname: {
                placeholder: "ns1.example.com.",
                helperText: "The domain's primary name server",
                inputType: "text",
                width: 6,
                absolute: true,
                validate: (field: string): t.ValidationResult => validateDomain(field)
            },
            rname: {
                placeholder: "hostmaster.example.com.",
                helperText: "The hostmaster's email, the @ is replaced with a dot",
                inputType: "text",
                width: 6,
                absolute: true,
                validate: (field: string): t.ValidationResult => {
                    const dv = validateDomain(field);
                    if (dv.type !== "ok") return dv;
                    if (field.indexOf("@") > -1) {
                        return {
                            type: "warning",
                            message: "The @ symbol should be replaced with a dot"
                        };
                    }
                    return { type: "ok" };
                }
            }
        },
        color: [255, 145, 0],
        info: (
            <div>
                <h2>SOA Record</h2>
                <p>
                    The "Start Of Authority" record is the most important one, as it defines the
                    existence of the zone.
                </p>
                <br />
                <p>
                    The numbers like "serial", "expire" etc. are omitted because they are only used
                    for sync between main and subordinate DNS servers. Pektin does not use these
                    mechanisms, as it's data is synced using Redis replication.
                </p>
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
        fields: {
            preference: {
                placeholder: "10",
                inputType: "number",
                width: 3,
                min: 0
            },
            exchange: {
                placeholder: "mx.example.com.",
                inputType: "text",
                width: 9,
                absolute: true,
                validate: (field: string): t.ValidationResult => validateDomain(field)
            }
        },
        color: [29, 94, 224],
        complex: true
    },
    TXT: {
        template: {
            TXT: ""
        },
        fields: {
            text: {
                placeholder: "this is some text",
                inputType: "text",
                width: 12
            }
        },
        color: [140, 140, 140],
        complex: false
    },
    SRV: {
        template: {
            SRV: {
                priority: 1,
                weight: 1,
                port: 443,
                target: ""
            }
        },
        fields: {
            priority: {
                placeholder: 1,
                inputType: "number",
                width: 2,
                min: 0
            },
            weight: {
                placeholder: 1,
                inputType: "number",
                width: 2,
                min: 0
            },
            port: {
                placeholder: 443,
                inputType: "number",
                width: 2,
                min: 0,
                max: 65535
            },
            target: {
                placeholder: "mx.example.com.",
                inputType: "text",
                width: 6,
                absolute: true,
                validate: (field: string): t.ValidationResult => validateDomain(field)
            }
        },
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
        fields: {
            tag: {
                placeholder: "issue",
                inputType: "text",
                width: 6,
                validate: (field: string, val: t.CAAValue): t.ValidationResult => {
                    if (
                        field.toLowerCase().indexOf("issue") > -1 ||
                        field.toLowerCase().indexOf("issuewild") > -1 ||
                        field.toLowerCase().indexOf("iodef") > -1
                    ) {
                        if (field === field.toLowerCase()) {
                            return {
                                type: "ok"
                            };
                        }
                        return {
                            type: "warning",
                            message: "Tags should only contain lowercase characters"
                        };
                    }
                    return {
                        type: "error",
                        message: `Tag must contain one of: issue, issuewild, iodef)`
                    };
                }
            },
            value: {
                placeholder: "letsencrypt.org",
                inputType: "text",
                width: 6,
                validate: (field: string, val: t.CAAValue): t.ValidationResult => {
                    if (val.tag === "iodef") {
                        if (
                            field.indexOf("https://") === -1 &&
                            field.indexOf("http://") === -1 &&
                            field.indexOf("mailto:") === -1
                        ) {
                            return {
                                type: "error",
                                message: `iodef tags must contain a protocol: https://, http://, mailto:)`
                            };
                        }
                    }
                    if (isAbsolute(field)) {
                        return {
                            type: "warning",
                            message: `CAA values should NOT be absolute names (NOT end with a dot)`
                        };
                    }
                    return validateDomain(field + ".");
                }
            }
        },
        color: [212, 11, 165],
        complex: true
        /* check for quotes in verification*/
    },
    OPENPGPKEY: {
        template: {
            OPENPGPKEY: ""
        },
        fields: { key: { placeholder: "", inputType: "text", width: 12 } },
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
        fields: {
            usage: {
                placeholder: 3,
                inputType: "number",
                width: 2,
                min: 1,
                max: 4
            },
            selector: {
                placeholder: 1,
                inputType: "number",
                width: 2,
                min: 1,
                max: 2
            },
            matching_type: {
                placeholder: 1,
                inputType: "number",
                width: 2,
                min: 1,
                max: 3
            },
            data: {
                placeholder: "50c1ab1e11feb0a75",
                inputType: "text",
                width: 6
            }
        },
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
