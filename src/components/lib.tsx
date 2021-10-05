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

const regex = {
    ip: /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/,
    legacyIp:
        /(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/,
    domainName: /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/
};

export const jsTemp = (config: t.Config, records: t.DisplayRecord[]) => {
    return pektinApi.jsTemp(config, records);
};

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
                    tag: t[1] as "Issue" | "IssueWild" | "Iodef",
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

export const SPF1QualifierNames = ["Pass", "Fail", "SoftFail", "Neutral"];

//type Domain = string;
//type PrefixLength = number;
//type IP6Adress = string;
//type IP4Adress = string;
//type SPF1_M_ip4 = IP4Adress | `${IP4Adress}/${PrefixLength}`;
//type SPF1_M_ip6 = IP6Adress | `${IP6Adress}/${PrefixLength}`;
//type SPF1_M_a = `/${PrefixLength}` | Domain | `${Domain}/${PrefixLength}`;
//type SPF1_M_mx = `/${PrefixLength}` | Domain | `${Domain}/${PrefixLength}`;
//type SPF1_M_ptr = Domain;
//type SPF1_M_exists = Domain;
//type SPF1_M_include = Domain;

interface SPF1Mechanism {
    qualifier?: "+" | "-" | "~" | "?"; // Pass Fail SoftFail Neutral; defaults to "+"/Pass if nothing is set
    type: "all" | "ip4" | "ip6" | "a" | "mx" | "ptr" | "exists" | "include";
    domain?: string;
    ip4?: string;
    ip6?: string;
    prefixLength?: number;
}
interface ParsedSPF1 {
    mechanisms?: Array<SPF1Mechanism | TxtRecordsParseError>;
    modifier?: "redirect" | "exp";
    modifierDomain?: string;
}
interface TxtRecordsParseError {
    error: true;
    message: string;
}

// https://www.ietf.org/rfc/rfc6376.txt
// eslint-disable-next-line
interface ParsedDKIM1 {
    g: any; // granularity
    h: any; // hash; a list of mechanisms that can be used to produce a digest of message data
    k: "rsa"; // key type; a list of mechanisms that can be used to decode a DKIM signature
    n: string; // notes; notes for humans
    p: string; //public-key; base64 encoded public key
    s: string[]; // service types for example * or email
    t: "y" | "s"; // list of flags to modify the selector
    q: string; // query type for example "dns"
    l: number; // size limit
}

// https://datatracker.ietf.org/doc/html/rfc7489#section-6.3
// eslint-disable-next-line
interface ParsedDMARC1 {
    p: "none" | "quarantine" | "reject"; // policy
    adkim?: "r" | "s"; // dkim alignment: relaxed or strict mode
    aspf?: "r" | "s"; // spf alignment: relaxed or strict mode
    fo?: 0 | 1 | "d" | "s"; // Failure reporting options: default is 0
    pct?: number; //percent: number from 1-100
    rf?: Array<"afrf" | "iodef">; // report format: Authentication Failure Reporting Format || incident object description exchange format
    ri?: number; // report interval: number of seconds defaults to 86400 u32
    rua?: string[]; // report aggregate address: comma seperated list
    ruf?: string[]; // report failure address: comma seperated list
    sp?: "none" | "quarantine" | "reject"; // subdomain policy
}

const anyInArrayStartsWith = (a: string[], start: string): boolean => {
    for (let i = 0; i < a.length; i++) {
        if (start.match(RegExp(`^${a[i]}.*`))) return true;
    }
    return false;
};

const checkPrefixLength = (input: string, type: 6 | 4 | 0 = 0): boolean => {
    if (isNaN(parseInt(input))) return false;
    const parsedInput = parseInt(input);
    if (type === 4 && parsedInput <= 32 && parsedInput >= 0) return true;
    if (parsedInput <= 128 && parsedInput >= 0) return true;
    return false;
};

const splitFirstAndRest = (string: string, seperator: string) => {
    return [
        string.substr(0, string.indexOf(seperator)),
        string.substr(string.indexOf(seperator) + 1)
    ];
};
export const txtRecords = {
    SPF1: {
        identifier: "v=spf1",
        parse: (v: string): ParsedSPF1 | TxtRecordsParseError => {
            const split = v.split(" ");
            if (split[0] !== "v=spf1")
                return {
                    error: true,
                    message: "invalid spf1 record identifier"
                };
            if (split.length === 1 || !split[1])
                return { error: true, message: "spf1 record is empty" };
            const parsed: ParsedSPF1 = {};
            split.shift();
            const parseMechanism = (e: string): SPF1Mechanism | TxtRecordsParseError => {
                if (!e.length) return { error: true, message: "invalid spf1 mechanism" };
                const mechanism: SPF1Mechanism = {} as SPF1Mechanism;
                if (["+", "-", "~", "?"].indexOf(e.charAt(0)) > -1) {
                    mechanism.qualifier = e.charAt(0) as "+" | "-" | "~" | "?";
                    e = e.substring(1);
                } else {
                    mechanism.qualifier = "+";
                }

                if (e === "all" || e === "mx" || e === "a" || e === "ptr") {
                    mechanism.type = e;
                } else if (
                    anyInArrayStartsWith(
                        ["ip4:", "ip6:", "a:", "mx:", "ptr:", "exists:", "include:"],
                        e
                    )
                ) {
                    const [type, ...r] = splitFirstAndRest(e, ":");
                    const rest = r.toString();

                    if (type === "exists" || type === "include" || type === "ptr") {
                        if (rest.match(regex.domainName)) {
                            mechanism.type = type;
                            mechanism.domain = rest;
                        } else {
                            return {
                                error: true,
                                message: `invalid domain: ${rest}`
                            };
                        }
                    } else if (type === "mx" || type === "a") {
                        if (rest.indexOf("/") <= -1) {
                            if (rest.match(regex.domainName)) {
                                mechanism.type = type;
                                mechanism.domain = rest;
                            } else {
                                return {
                                    error: true,
                                    message: `invalid domain: ${rest}`
                                };
                            }
                        } else {
                            const [domain, prefixLength] = splitFirstAndRest(rest, "/");
                            if (domain.match(regex.domainName)) {
                                if (checkPrefixLength(prefixLength)) {
                                    mechanism.type = type;
                                    mechanism.domain = domain;
                                    mechanism.prefixLength = parseInt(prefixLength);
                                } else {
                                    return {
                                        error: true,
                                        message: `invalid prefix-length: ${prefixLength}`
                                    };
                                }
                            } else {
                                return {
                                    error: true,
                                    message: `invalid domain: ${domain}`
                                };
                            }
                        }
                    } else if (type === "ip6") {
                        const [ip6, prefixLength] = splitFirstAndRest(rest, "/");
                        if (ip6.match(regex.ip)) {
                            if (prefixLength) {
                                if (checkPrefixLength(prefixLength)) {
                                    mechanism.type = type;
                                    mechanism.ip6 = ip6;
                                    mechanism.prefixLength = parseInt(prefixLength);
                                } else {
                                    return {
                                        error: true,
                                        message: `invalid ipv6 prefix-length: ${prefixLength}`
                                    };
                                }
                            } else {
                                mechanism.type = type;
                                mechanism.ip6 = ip6;
                            }
                        } else {
                            return {
                                error: true,
                                message: `invalid ipv6 address: ${ip6}`
                            };
                        }
                    } else if (type === "ip4") {
                        const [ip4, prefixLength] = splitFirstAndRest(rest, "/");
                        if (ip4.match(regex.legacyIp)) {
                            if (prefixLength) {
                                if (checkPrefixLength(prefixLength, 4)) {
                                    mechanism.type = type;
                                    mechanism.ip4 = ip4;
                                    mechanism.prefixLength = parseInt(prefixLength);
                                } else {
                                    return {
                                        error: true,
                                        message: `invalid ipv4 prefix-length: ${prefixLength}`
                                    };
                                }
                            } else {
                                mechanism.type = type;
                                mechanism.ip4 = ip4;
                            }
                        } else {
                            return {
                                error: true,
                                message: `invalid ipv4 address: ${ip4}`
                            };
                        }
                    }
                } else if (anyInArrayStartsWith(["a/", "mx/"], e)) {
                    const [type, prefixLength] = splitFirstAndRest(e, "/");
                    if (checkPrefixLength(prefixLength)) {
                        mechanism.type = type as "a" | "mx";
                        mechanism.prefixLength = parseInt(prefixLength);
                    } else {
                        return {
                            error: true,
                            message: `invalid prefix-length: ${prefixLength}`
                        };
                    }
                } else {
                    return {
                        error: true,
                        message: "invalid spf1 mechanism: no valid prefix matched"
                    };
                }
                return mechanism;
            };
            parsed.mechanisms = [];
            split.forEach((e: string, i: number) => {
                if (e.indexOf("exp=") > -1 || e.indexOf("redirect=") > -1) {
                    /*@ts-ignore*/
                    const [modifier, modifierDomain]: ["redirect" | "exp", string] =
                        splitFirstAndRest(e, "=");
                    if (modifierDomain.match(regex.domainName)) {
                        parsed.modifier = modifier;
                        parsed.modifierDomain = modifierDomain;
                    } else {
                        return {
                            error: true,
                            message: `invalid spf1 modifier: invalid domain: ${modifierDomain}`
                        };
                    }
                } else if (parsed.mechanisms) {
                    parsed.mechanisms[i] = parseMechanism(e);
                }
            });
            if (!parsed.mechanisms.length) delete parsed.mechanisms;
            return parsed;
        }
    },
    DKIM1: {
        identifier: "v=DKIM1"
        //parse: (v: string): ParsedDKIM1 | TxtRecordsParseError => {}
    },
    DMARC1: {
        identifier: "v=DMARC1"
        //parse: (v: string): ParsedDMARC1 | TxtRecordsParseError => {}
    }
};

export const verifyDomain = (input: string): t.ValidationResult => {
    if (input === undefined || !input.match(regex.domainName)) {
        return { type: "error", message: "Invalid domain" };
    }
    const domains = input.split(" ");
    if (domains[1] !== undefined && domains[domains.length - 1].length !== 0) {
        return {
            type: "error",
            message: "Spaces indicate a list of domains, but only one is supported here"
        };
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

export const verifyIp = (input: string, type?: "legacy"): t.ValidationResult => {
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

export const verifyDomains = (input: string): t.ValidationResult => {
    const domains = input.split(" ");
    if (domains.length === 1) return verifyDomain(input);
    if (domains[domains.length - 1] !== undefined && domains[domains.length - 1].length === 0) {
        return {
            type: "ok"
        };
    }
    for (let i = 0; i < domains.length; i++) {
        const v = verifyDomain(domains[i]);
        if (v.type !== "ok") {
            v.message = `Domain ${i + 1}: ${v.message}`;
            return v;
        }
    }
    return { type: "ok" };
};

export const verifyIps = (input: string, type?: "legacy"): t.ValidationResult => {
    const ips = input.split(" ");
    if (ips.length === 1) return verifyIp(input, type);
    if (ips[ips.length - 1] !== undefined && ips[ips.length - 1].length === 0) {
        return {
            type: "ok"
        };
    }
    for (let i = 0; i < ips.length; i++) {
        const v = verifyIp(ips[i], type);
        if (v.type !== "ok") {
            v.message = `IP ${i + 1}: ${v.message}`;
            return v;
        }
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
                verify: (field: string): t.ValidationResult => verifyIps(field)
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
                verify: (field: string): t.ValidationResult => verifyIps(field, "legacy")
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
                verify: (field: string): t.ValidationResult => verifyDomains(field)
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
                verify: (field: string): t.ValidationResult => verifyDomains(field)
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
                verify: (field: string): t.ValidationResult => verifyDomains(field)
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
                verify: (field: string): t.ValidationResult => verifyDomain(field)
            },
            rname: {
                placeholder: "hostmaster.example.com.",
                helperText: "The hostmaster's email, the @ is replaced with a dot",
                inputType: "text",
                width: 6,
                absolute: true,
                verify: (field: string): t.ValidationResult => {
                    const dv = verifyDomain(field);
                    if (dv.type !== "ok") return dv;
                    if (field.indexOf("@") > -1)
                        return {
                            type: "warning",
                            message: "The @ symbol should be replaced with a dot"
                        };
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
                absolute: true
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
                absolute: true
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
                width: 6
            },
            value: {
                placeholder: "letsencrypt.org",
                inputType: "text",
                width: 6
            }
        },
        color: [212, 11, 165],
        complex: true
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
