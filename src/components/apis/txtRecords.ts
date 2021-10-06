import { regex } from "../lib";

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

const parseSPF1 = (v: string): ParsedSPF1 | TxtRecordsParseError => {
    const split = v.split(" ");
    if (split[0] !== "v=spf1")
        return {
            error: true,
            message: "invalid spf1 record identifier"
        };
    if (split.length === 1 || !split[1]) return { error: true, message: "spf1 record is empty" };
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
            anyInArrayStartsWith(["ip4:", "ip6:", "a:", "mx:", "ptr:", "exists:", "include:"], e)
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
            const [modifier, modifierDomain]: ["redirect" | "exp", string] = splitFirstAndRest(
                e,
                "="
            );
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
};

export const txtRecords = {
    SPF1: {
        identifier: "v=spf1",
        parse: parseSPF1
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
