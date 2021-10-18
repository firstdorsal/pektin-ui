import { regex } from "../lib";
import * as t from "../types";
import * as l from "../lib";

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
export interface ParsedSPF1 {
    mechanisms?: Array<SPF1Mechanism | t.ValidationResult>;
    modifier?: "redirect" | "exp";
    modifierDomain?: string;
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
    if (string.indexOf(seperator) === -1) {
        return [string, ""];
    }
    return [
        string.substr(0, string.indexOf(seperator)),
        string.substr(string.indexOf(seperator) + 1)
    ];
};

const checkSPF1Macros = (string: string): false | t.ValidationResult => {
    if (string.indexOf("%") === -1) return { type: "error", message: `invalid domain: ${string}` };
    if (!string.match(/.*(%{|%%|%-|%_).*/g)) {
        return {
            type: "error",
            message: `invalid macro in domain:  % character is not followed by a '{', '%', '-', or '_'`
        };
    }
    if (string.match(/.*%{.*/g)) {
        if (string.match(/{/g)?.length !== string.match(/}/g)?.length) {
            return {
                type: "error",
                message: `invalid macro in domain: Unbalanced ammount of brackets`
            };
        }

        if (!string.match(/.*{[0-9slodipvhr-]+}.*/g)) {
            return {
                type: "error",
                message: `invalid macro in domain: Invalid character in curly brackets`
            };
        }
    }

    /*
    Invalid:
    %(ir).sbl.example.org

    Valid:
    %{ir}.sbl.example.org
    %{ir}.%{v}._spf.%{d2}
    %{lr-}.lp._spf.%{d2}
    %{lr-}.lp.%{ir}.%{v}._spf.%{d2}
    %{ir}.%{v}.%{l1r-}.lp._spf.%{d2}
    %{d2}.trusted-domains.example.net
    %{ir}.%{v}._spf.%{d2}

    s = <sender>
    l = local-part of <sender>
    o = domain of <sender>
    d = <domain>
    i = <ip>
    p = the validated domain name of <ip> (do not use)
    v = the string "in-addr" if <ip> is ipv4, or "ip6" if <ip> is ipv6
    h = HELO/EHLO domain
*/
    return false;
};

const parseSPF1 = (config: t.Config, value: string): ParsedSPF1 | t.ValidationResult => {
    const v = value.replaceAll(/\s+/g, " ").toLowerCase();

    const split = v.split(" ");
    if (split[0] !== "v=spf1")
        return {
            type: "error",
            message: "invalid spf1 record identifier"
        };
    if (split.length === 1 || !split[1]) return { type: "error", message: "spf1 record is empty" };
    const parsed: ParsedSPF1 = {};
    split.shift();
    const parseMechanism = (
        e: string,
        index: number,
        length: number
    ): SPF1Mechanism | t.ValidationResult => {
        if (!e.length) return { type: "error", message: "invalid spf1 mechanism" };
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
            anyInArrayStartsWith(["ip4:", "ip6:", "a:", "mx:", "ptr:", "exists:", "include:"], e)
        ) {
            const [type, ...r] = splitFirstAndRest(e, ":");
            const rest = r.toString();

            if (type === "exists" || type === "include" || type === "ptr") {
                if (l.validateDomain(config, rest).type !== "error") {
                    mechanism.type = type;
                    mechanism.domain = rest;
                } else {
                    if (type !== "ptr") {
                        const cm = checkSPF1Macros(rest);
                        if (cm && cm.type === "error") return cm;

                        mechanism.type = type;
                        mechanism.domain = rest;
                    } else {
                        return {
                            type: "error",
                            message: `invalid domain: ${rest}`
                        };
                    }
                }
            } else if (type === "mx" || type === "a") {
                if (rest.indexOf("/") <= -1) {
                    if (l.validateDomain(config, rest).type !== "error") {
                        mechanism.type = type;
                        mechanism.domain = rest;
                    } else {
                        return {
                            type: "error",
                            message: `invalid domain: ${rest}`
                        };
                    }
                } else {
                    const [domain, prefixLength] = splitFirstAndRest(rest, "/");
                    if (l.validateDomain(config, rest).type !== "error") {
                        if (checkPrefixLength(prefixLength)) {
                            mechanism.type = type;
                            mechanism.domain = domain;
                            mechanism.prefixLength = parseInt(prefixLength);
                        } else {
                            return {
                                type: "error",
                                message: `invalid prefix-length: ${prefixLength}`
                            };
                        }
                    } else {
                        return {
                            type: "error",
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
                                type: "error",
                                message: `invalid ipv6 prefix-length: ${prefixLength}`
                            };
                        }
                    } else {
                        mechanism.type = type;
                        mechanism.ip6 = ip6;
                    }
                } else {
                    return {
                        type: "error",
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
                                type: "error",
                                message: `invalid ipv4 prefix-length: ${prefixLength}`
                            };
                        }
                    } else {
                        mechanism.type = type;
                        mechanism.ip4 = ip4;
                    }
                } else {
                    return {
                        type: "error",
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
                    type: "error",
                    message: `invalid prefix-length: ${prefixLength}`
                };
            }
        } else {
            return {
                type: "error",
                message: `invalid spf1 mechanism at index ${index + 1}/${length}: ${e}`
            };
        }
        return mechanism;
    };
    parsed.mechanisms = [];
    split.forEach((e: string, i: number) => {
        if (e.indexOf("exp=") > -1 || e.indexOf("redirect=") > -1) {
            /*@ts-ignore*/
            const [modifier, modifierDomain]: ["redirect" | "exp", string] = splitFirstAndRest(
                e,
                "="
            );
            if (modifierDomain.match(regex.domainName)) {
                parsed.modifier = modifier;
                parsed.modifierDomain = modifierDomain;
            } else {
                return {
                    type: "error",
                    message: `invalid spf1 modifier: invalid domain: ${modifierDomain}`
                };
            }
        } else if (parsed.mechanisms) {
            parsed.mechanisms[i] = parseMechanism(e, i, split.length) as SPF1Mechanism;
        }
    });
    if (!parsed.mechanisms.length) delete parsed.mechanisms;

    return parsed;
};

const validateSPF1 = (config: t.Config, string: string): t.ValidationResult => {
    const parsedSpf = parseSPF1(config, string) as ParsedSPF1;

    if ((parsedSpf as t.ValidationResult).type === "error") {
        return parsedSpf as t.ValidationResult;
    }
    if (parsedSpf.mechanisms && parsedSpf.mechanisms.length) {
        const erroredMechanisms = parsedSpf.mechanisms.filter(
            (e: any) => e.type === "error" || e.type === "warning"
        );

        if (erroredMechanisms.length > 0) {
            return erroredMechanisms[0] as t.ValidationResult;
        }

        for (let i = 0; i < parsedSpf.mechanisms.length; i++) {
            const m = parsedSpf.mechanisms[i];

            if (m.type === "all" && i < parsedSpf.mechanisms.length - 1) {
                if (m.qualifier === "-") {
                    return {
                        type: "warning",
                        message: `All mechanisms after the '-all' will be ignored/overridden: THIS WILL REJECT ALL MAIL`
                    };
                } else if (m.qualifier === "+") {
                    return {
                        type: "warning",
                        message: `All mechanisms after the '+all' will be ignored/overridden: this renders the record useless lol`
                    };
                }
            }
        }
    }
    if (string !== string.replaceAll(/\s+/g, " ")) {
        return {
            type: "warning",
            message: `Spf record contains multiple adjacent spaces`
        };
    }
    if (string !== string.toLowerCase()) {
        return {
            type: "warning",
            message: `Spf record should only contain lower case chars`
        };
    }
    return { type: "ok" };
};

// https://www.ietf.org/rfc/rfc6376.txt
// https://www.iana.org/assignments/dkim-parameters/dkim-parameters.xhtml
interface ParsedDKIM1 {
    v: any | t.ValidationResult;
    g: any | t.ValidationResult; // granularity
    h: "sha1" | "sha256" | t.ValidationResult; // hash; a list of mechanisms that can be used to produce a digest of message data
    k: "rsa" | "ed25519" | t.ValidationResult; // key type; a list of mechanisms that can be used to decode a DKIM signature
    n: string | t.ValidationResult; // notes; notes for humans
    p: string | t.ValidationResult; //public-key; base64 encoded public key
    s: Array<"email" | "*"> | t.ValidationResult; // service types for example * or email
    t: "y" | "s" | t.ValidationResult; // list of flags to modify the selector
    //q: string; // query type for example "dns"
    //l: number; // size limit
}
const parseDKIM1 = (string: string): ParsedDKIM1 | t.ValidationResult => {
    let parsed = {} as ParsedDKIM1;
    string = string.replaceAll(" ", "").replaceAll("v=DKIM1;", "");
    const split = string.split(";");

    split.forEach(e => {
        if (e.indexOf("=") === -1) {
            /*@ts-ignore*/
            parsed = { type: "error", message: "Couldnt parse DKIM1: Missing =" };
            return;
        }
        const kv = e.split("=");

        if (!kv[0]) {
            /*@ts-ignore*/
            parsed = { type: "error", message: "Couldnt parse DKIM1: Missing key/name" };
            return;
        }
        if (kv[1] === undefined) {
            /*@ts-ignore*/
            parsed = { type: "error", message: `Couldnt parse DKIM1: Missing value ${kv[0]}` };
            return;
        }

        if (!kv[1].length) {
            /*@ts-ignore*/
            parsed[kv[0]] = {
                type: "error",
                message: `Couldnt parse DKIM1 KV pair: Empty value ${kv[0]}`
            };
            return;
        }

        if (kv[0] === "g") {
            parsed["g"] = kv[1];
        } else if (kv[0] === "h") {
            if (kv[1] !== "sha1" && kv[1] !== "sha256") {
                parsed["h"] = {
                    type: "error",
                    message: "Couldnt parse DKIM1 KV pair: h has to be either sha1 or sha256"
                };
            } else {
                parsed["h"] = kv[1];
            }
        } else if (kv[0] === "k") {
            if (kv[1] !== "rsa" && kv[1] !== "ed25519") {
                parsed["k"] = {
                    type: "error",
                    message: "Couldnt parse DKIM1 KV pair: k has to be either rsa or ed25519"
                };
            } else {
                parsed["k"] = kv[1];
            }
        } else if (kv[0] === "n") {
            parsed["n"] = kv[1];
        } else if (kv[0] === "p") {
            parsed["p"] = kv[1];
        } else if (kv[0] === "s") {
            let serviceTypes = kv[1].split(",");
            if (serviceTypes.length > 2) {
                parsed["s"] = {
                    type: "error",
                    message:
                        "Couldnt parse DKIM1 KV pair: s is an array that can only have the options * and email hence cant be longer than 2"
                };
            } else if (serviceTypes.length) {
                const filteredServiceTypes = serviceTypes.filter(
                    string => string === "email" || string === "*"
                );
                if (filteredServiceTypes.length === serviceTypes.length) {
                    parsed["s"] = serviceTypes as Array<"email" | "*">;
                } else {
                    parsed["s"] = {
                        type: "error",
                        message:
                            "Couldnt parse DKIM1 KV pair: s contains one or more invalid service types: may only contain email or *"
                    };
                }
            } else {
                parsed["s"] = {
                    type: "error",
                    message: "Couldnt parse DKIM1 KV pair: s is empty"
                };
            }
        } else if (kv[0] === "t") {
            if (kv[1] !== "y" && kv[1] !== "s") {
                parsed["t"] = {
                    type: "error",
                    message: "Couldnt parse DKIM1 KV pair: t has to be either y or s"
                };
            } else {
                parsed["t"] = kv[1];
            }
        } else {
            /*@ts-ignore*/
            parsed[kv[0]] = {
                type: "error",
                message: `Couldnt parse DKIM1 KV pair: unknown key ${kv[0]}`
            };
        }
    });
    return parsed;
};

const validateDKIM1 = (string: string): t.ValidationResult => {
    const parsed = parseDKIM1(string) as t.ValidationResult;
    if (parsed.type === "error") {
        return parsed;
    } else {
        const parsedValues = Object.values(parsed);
        for (let i = 0; i < parsedValues.length; i++) {
            const parsedValue = parsedValues[i];

            if (parsedValue.type === "error") {
                return parsedValue;
            }
        }
    }
    return { type: "ok" };
};

// https://datatracker.ietf.org/doc/html/rfc7489#section-6.3
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
const parseDMARC1 = (string: string): ParsedDMARC1 | t.ValidationResult => {
    const parsed = {};
    string = string.replaceAll(" ", "");
    const split = string.split(";");

    return parsed as ParsedDMARC1;
};

export const txtRecords = {
    SPF1: {
        identifier: "v=spf1",
        parse: parseSPF1,
        validate: validateSPF1
    },
    SPF2: {
        identifier: "spf2.0"
    },
    DKIM1: {
        identifier: "v=DKIM1",
        parse: parseDKIM1,
        validate: validateDKIM1
    },
    DMARC1: {
        identifier: "v=DMARC1",
        parse: parseDMARC1
    }
};

/*
ip4:82.165.229.31 ip4:82.165.230.21 ip4:37.187.153.22: invalid ip

include:%{ir}.%{v}.%{d}.spf.has.pphosted.com: invalid domain; very strange


*/

export const spfTests = [
    `v=spf1 include:spf-a.outlook.com include:spf-b.outlook.com ip4:157.55.9.128/25 include:spf.protection.outlook.com include:spf-a.hotmail.com include:_spf-ssg-b.microsoft.com include:_spf-ssg-c.microsoft.com ~all`,
    `v=spf1 ip4:51.4.72.0/24 ip4:51.5.72.0/24 ip4:51.5.80.0/27 ip4:20.47.149.138/32 ip4:51.4.80.0/27 ip6:2a01:4180:4051:0800::/64 ip6:2a01:4180:4050:0800::/64 ip6:2a01:4180:4051:0400::/64 ip6:2a01:4180:4050:0400::/64 -all`,
    `v=spf1 redirect=_spf.google.com`,
    `v=spf1 include:_netblocks.google.com include:_netblocks2.google.com include:_netblocks3.google.com ~all`,
    `v=spf1 mx ip4:62.216.223.128/29 -all`,
    `v=spf1 mx a:mail-a3.dbtg.de a:mail-c3.dbtg.de ~all`,
    `v=spf1 redirect=gmx.net`,
    `v=spf1 ip4:213.165.64.0/23 ip4:74.208.5.64/26 ip4:212.227.126.128/25 ip4:212.227.15.0/25 ip4:212.227.17.0/27 ip4:74.208.4.192/26 ip4:82.165.159.0/24 ip4:217.72.207.0/27 ip4:82.165.229.31 ip4:82.165.230.21 -all`,
    `v=spf1 mx a:mail.belin.es ip4:37.187.153.22 -all`,
    `v=spf1 include:_zebus.cantamen.de include:_zoffice.cantamen.de include:_ron.cantamen.de include:_3cx.cantamen.de ~all`,
    `v=spf1 include:_spf.hetzner.com include:spf.nl2go.com -all`,
    `v=spf1 include:%{ir}.%{v}.%{d}.spf.has.pphosted.com -all`,
    `v=spf1 redirect=_spf.facebook.com`,
    `v=spf1 ip4:66.220.144.128/25 ip4:66.220.155.0/24 ip4:66.220.157.0/25 ip4:69.63.178.128/25 ip4:69.63.181.0/24 ip4:69.63.184.0/25 ip4:69.171.232.0/24 ip4:69.171.244.0/23 -all`,
    `v=spf1 include:amazon.com -all`,
    `v=spf1 include:spf1.amazon.com include:spf2.amazon.com include:amazonses.com -all`,
    `v=spf1 ip4:207.171.160.0/19 ip4:87.238.80.0/21 ip4:72.21.192.0/19 ip4:194.154.193.192/27 ip4:194.7.41.152/28 ip4:212.123.28.40/32 ip4:203.81.17.0/24 ip4:178.236.10.128/26 ip4:52.94.124.0/28 ip4:99.78.197.208/28 ip4:52.119.213.144/28 -all`,
    `v=spf1 include:%{ir}.%{v.%{d}.spf.has.pphosted.com -all`
];

/*
SPF1
TODO: automatic spf1 scraping and verification to test function

outlook.com
v=spf1 include:spf-a.outlook.com include:spf-b.outlook.com ip4:157.55.9.128/25 include:spf.protection.outlook.com include:spf-a.hotmail.com include:_spf-ssg-b.microsoft.com include:_spf-ssg-c.microsoft.com ~all

spfd.protection.outlook.com
v=spf1 ip4:51.4.72.0/24 ip4:51.5.72.0/24 ip4:51.5.80.0/27 ip4:20.47.149.138/32 ip4:51.4.80.0/27 ip6:2a01:4180:4051:0800::/64 ip6:2a01:4180:4050:0800::/64 ip6:2a01:4180:4051:0400::/64 ip6:2a01:4180:4050:0400::/64 -all

gmail.com
v=spf1 redirect=_spf.google.com

_spf.google.com
v=spf1 include:_netblocks.google.com include:_netblocks2.google.com include:_netblocks3.google.com ~all

augsburg.de
v=spf1 mx ip4:62.216.223.128/29 -all

bundestag.de
v=spf1 mx a:mail-a3.dbtg.de a:mail-c3.dbtg.de ~all

gmx.de
v=spf1 redirect=gmx.net

gmx.net
v=spf1 ip4:213.165.64.0/23 ip4:74.208.5.64/26 ip4:212.227.126.128/25 ip4:212.227.15.0/25 ip4:212.227.17.0/27 ip4:74.208.4.192/26 ip4:82.165.159.0/24 ip4:217.72.207.0/27 ip4:82.165.229.31 ip4:82.165.230.21 -all

belin.es
v=spf1 mx a:mail.belin.es ip4:37.187.153.22 -all

cantamen.de
v=spf1 include:_zebus.cantamen.de include:_zoffice.cantamen.de include:_ron.cantamen.de include:_3cx.cantamen.de ~all

hetzner.com
v=spf1 include:_spf.hetzner.com include:spf.nl2go.com -all

booking.com
v=spf1 include:%{ir}.%{v}.%{d}.spf.has.pphosted.com -all

facebook.com
v=spf1 redirect=_spf.facebook.com

_spf.facebook.com
v=spf1 ip4:66.220.144.128/25 ip4:66.220.155.0/24 ip4:66.220.157.0/25 ip4:69.63.178.128/25 ip4:69.63.181.0/24 ip4:69.63.184.0/25 ip4:69.171.232.0/24 ip4:69.171.244.0/23 -all

amazon.de
v=spf1 include:amazon.com -all

amazon.com
v=spf1 include:spf1.amazon.com include:spf2.amazon.com include:amazonses.com -all

spf1.amazon.com
v=spf1 ip4:207.171.160.0/19 ip4:87.238.80.0/21 ip4:72.21.192.0/19 ip4:194.154.193.192/27 ip4:194.7.41.152/28 ip4:212.123.28.40/32 ip4:203.81.17.0/24 ip4:178.236.10.128/26 ip4:52.94.124.0/28 ip4:99.78.197.208/28 ip4:52.119.213.144/28 -all

*/

/*
spf2.0

amazon.de
spf2.0/pra include:amazon.com -all
amazon.com
spf2.0/pra include:spf1.amazon.com include:spf2.amazon.com include:amazonses.com -all

spf1.amazon.com
spf2.0/pra ip4:207.171.160.0/19 ip4:87.238.80.0/21 ip4:72.21.192.0/19 ip4:194.154.193.192/27 ip4:194.7.41.152/28 ip4:212.123.28.40/32 ip4:203.81.17.0/24 ip4:178.236.10.128/26 ip4:52.94.124.0/28 ip4:99.78.197.208/28 ip4:52.119.213.144/28 -all

*/

/*
verification stuff

google-site-verification=J0NZ2F6kdhXzsguHSKZTm3CWujnrImftkDG3zhz14g0
Trustpilot-Verification-kqvVskCm6JQ9Vg1qAmahpBSJ5tvZORbriFyVIk4E
facebook-domain-verification=scdn4fwr0on3j97l5py9vp9raerciu
globalsign-domain-verification=Sk6NCwvBPC8mpjpg-aJJnVu4ab1vTpwUXBP4kh5qLX
_globalsign-domain-verification=l_BNpBAnk-rKZRyXJ9UkBfv9o6EEuuenkBrGpYNYo0
globalsign-smime-dv=CDYX+XFHUw2wml6/Gb8+59BsH31KzUr6c1l2BPvqKX8=
apple-domain-verification=P8Zbl20P9OhxGB39
MS=ms98807220 //Microsoft Office 365. augsburg.de
MS=28BE46DF2C2D9EE896CCCC268DC6CBD9FE32E2D9 //hetzner.de
pinterest-site-verification=50229699c495513af87299cd94d686f9
Dynatrace-site-verification=3a88fc1a-195c-455d-ab87-88d09191496b__drhtlct978bncn9utek6qdqapk
ZOOM_verify_rRPrFA9oTH2bxfFkJeQTzA
adobe-idp-site-verification=040db58f-cfb9-4203-a555-bfcd15b24b86
atlassian-domain-verification=F3hugs/a4ZZHwjGTLmlb12IMA3TIRiz3ifqw4TKRz9tWk0LoyBBXfwc775aT/juy
cisco-ci-domain-verification=18ab0a696c72c79cc3e9c35ddca9a4d722c40bdb86e06aa25aefe1d8284d0946
docusign=1ddc2bf3-a249-4127-a351-f22dc75077d3
fastly-domain-delegation-0344411-343733-2021_0223
logmein-domain-confirmation 90DIFG9EEUT8U8R4895Y87H
onetrust-domain-verification=3fce180bf9e54d5b97a7c9e1ce3cb10c
wrike-verification=NDM5MTUzODoyMTFkNjJmZWM5MDk5MTVjOWY2YTQ2MWI4MmVhNjRkZjBmNjg3NzhmZTJhZTQ2NjYxMmVlNjNmMDJkZWRkN2Vi
pardot326621=b26a7b44d7c73d119ef9dfd1a24d93c77d583ac50ba4ecedd899a9134734403b
webexdomainverification.RYIX=601f1f0d-b15f-4824-965a-735d477c3ac4
spycloud-domain-verification=8189b5fe-434e-4adb-9e29-635880677850
ahrefs-site-verification_c59586c96c2e3ae85a64edd9f506b21b62b8382b6f30385e8a3af024958c0571
_telesec-domain-validation=2019-10-17_EsWjLFKa2XbjSAS1ix2xprx6iSmXoRqF8j3F6gr5i6WhUKULkv
QuoVadis=e4cbdf1c-5183-4575-9299-4c597c9c87a2
yandex-verification: 5005ecaee0968a87
favro-verification=xttPpZk_Tn7IbEozkV-vd5wJjwPF-U17-FvqUv7dp6S
*/

/*
anything else
v=SSHCA1;key=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMXX+Aji751cwORw62W56nfsYLMFQc3eMpTlbVED0c72 signservice@biro

*/
