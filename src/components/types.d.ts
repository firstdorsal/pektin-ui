export interface Config {
    apiEndpoint: string;
}

export interface getRecords extends RequestParams {
    domainName: string;
}

export interface RequestParams {
    apiEndpoint: string;
}

export interface DomainMeta {
    selected: boolean;
    expanded: boolean;
    changed: boolean;
}

export interface Response {
    error: boolean;
    message: string;
    data: Object;
}

export interface Rec0 {
    name: string;
    value: Rec1;
}

export interface Rec1 {
    dnssec: boolean;
    rr_type: RRTypes;
    rr_set: RRset;
}

export type RRset = Array<ResourceRecord>;

// a resource recprd with a ttl and the rr value
export interface ResourceRecord {
    ttl: number;
    value: ResourceRecordValue;
}

export type RRTypes = "A" | "AAAA" | "NS" | "CNAME" | "PTR" | "SOA" | "MX" | "TXT" | "DNSKEY" | "SRV" | "CAA" | "OPENPGPKEY" | "TLSA";

// the resource record value
export type ResourceRecordValue = A | AAAA | NS | CNAME | PTR | SOA | MX | TXT | SRV | CAA | OPENPGPKEY | TLSA;

export interface A {
    [A: string]: string;
}
export interface AAAA {
    [AAAA: string]: string;
}
export interface NS {
    [NS: string]: string;
}
export interface CNAME {
    [CNAME: string]: string;
}
export interface PTR {
    [PTR: string]: string;
}
export interface SOA {
    [SOA: string]: SOAValue;
}
export interface SOAValue {
    mname: string;
    rname: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minimum: number;
}
export interface MX {
    [MX: string]: MXValue;
}
export interface MXValue {
    preference: number;
    exchange: number;
}
export interface TXT {
    [TXT: string]: string;
}
export interface DNSKEY {
    flags: 256 | 257;
    protocol: 1 | 2 | 3 | 4 | 255;
    // 1=TLS, 2=email, 3=DNSSEC, 4=IPsec, 255=alle
    algorithm: number;
    // 1=RSA/MD5, 2=Diffie Hellman, 3=DSA/SHA-1, 4=Elliptische Kurven, 5=RSA/SHA-1, 6=DSA/SHA-1/NSEC3, 7=RSA/SHA-1/NSEC3, 8=RSA/SHA-256, 10=RSA/SHA-512, 12=ECC-GOST, 13=ECDSA/Curve P-256/SHA-256, 14=ECDSA/Curve P-384/SHA-384
    key_data: string;
}
export interface SRV {
    [SRV: string]: SRVValue;
}
export interface SRVValue {
    priority: number;
    weight: number;
    port: number;
    target: string;
}

export interface CAA {
    [CAA: string]: CAAValue;
}
export interface CAAValue {
    flag: 0;
    tag: "issue" | "issuewild" | "iodef" | "contactemail" | "contactphone";
    value: string;
}
export interface OPENPGPKEY {
    [OPENPGPKEY: string]: string;
}

export interface TLSA {
    [TLSA: string]: TLSAValue;
}
export interface TLSAValue {
    usage: number;
    selector: number;
    matching_type: number;
    data: string;
}
