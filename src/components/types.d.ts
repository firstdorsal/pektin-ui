export interface VaultAuth {
    endpoint: string;
    token: string;
}

export interface Config {
    vaultAuth: VaultAuth;
    foreignApis: any[];
    local: LocalConfig;
    pektin: PektinConfig | undefined;
}
export interface PektinConfig {
    domain: string;
    uiSubDomain: string;
    apiSubDomain: string;
    vaultSubDomain: string;
    uiEnabled: boolean;
    autoRotate: boolean;
    autoCertificates: boolean;
    autoConfigureMainDomain: boolean;
    dev: boolean;
}

export interface LocalConfig {
    defaultActiveTab: number;
    codeStyle: codeStyle;
}

export interface PektinUiConnectionConfig {
    username: string;
    password: string;
    vaultEndpoint: string;
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

export interface PektinApiSetReqBody extends PektinApiReqBody {
    records: RedisEntry[];
}

export interface PektinApiGetReqBody extends PektinApiReqBody {
    query: string;
}

export interface PektinApiReqBody {
    token: string;
}

export interface SimpleDnsRecord {
    name: string;
    type: RRTypes;
    ttl: number;
    data: string;
}

export interface RedisEntry {
    name: string;
    value: RedisValue;
}

export interface RedisValue {
    //dnssec?: boolean;
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
export type ResourceRecordValue = A | AAAA | NS | CNAME | PTR | SOA | MX | TXT | DNSKEY | SRV | CAA | OPENPGPKEY | TLSA;

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
    exchange: string;
}
export interface TXT {
    [TXT: string]: string;
}

export interface DNSKEY {
    [DNSKEY: string]: DNSKEYValue;
}
export interface DNSKEYValue {
    flags: number; //256 | 257;
    protocol: number; //1 | 2 | 3 | 4 | 255;
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
    flag: number; //0;
    tag: string; //"issue" | "issuewild" | "iodef" | "contactemail" | "contactphone";
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
export type codeStyle =
    | "a11yDark"
    | "a11yLight"
    | "agate"
    | "anOldHope"
    | "androidstudio"
    | "arduinoLight"
    | "arta"
    | "ascetic"
    | "atelierCaveDark"
    | "atelierCaveLight"
    | "atelierDuneDark"
    | "atelierDuneLight"
    | "atelierEstuaryDark"
    | "atelierEstuaryLight"
    | "atelierForestDark"
    | "atelierForestLight"
    | "atelierHeathDark"
    | "atelierHeathLight"
    | "atelierLakesideDark"
    | "atelierLakesideLight"
    | "atelierPlateauDark"
    | "atelierPlateauLight"
    | "atelierSavannaDark"
    | "atelierSavannaLight"
    | "atelierSeasideDark"
    | "atelierSeasideLight"
    | "atelierSulphurpoolDark"
    | "atelierSulphurpoolLight"
    | "atomOneDarkReasonable"
    | "atomOneDark"
    | "atomOneLight"
    | "brownPaper"
    | "codepenEmbed"
    | "colorBrewer"
    | "darcula"
    | "dark"
    | "defaultStyle"
    | "docco"
    | "dracula"
    | "far"
    | "foundation"
    | "githubGist"
    | "github"
    | "gml"
    | "googlecode"
    | "gradientDark"
    | "grayscale"
    | "gruvboxDark"
    | "gruvboxLight"
    | "hopscotch"
    | "hybrid"
    | "idea"
    | "irBlack"
    | "isblEditorDark"
    | "isblEditorLight"
    | "kimbieDark"
    | "kimbieLight"
    | "lightfair"
    | "lioshi"
    | "magula"
    | "monoBlue"
    | "monokaiSublime"
    | "monokai"
    | "nightOwl"
    | "nnfxDark"
    | "nnfx"
    | "nord"
    | "obsidian"
    | "ocean"
    | "paraisoDark"
    | "paraisoLight"
    | "pojoaque"
    | "purebasic"
    | "qtcreatorDark"
    | "qtcreatorLight"
    | "railscasts"
    | "rainbow"
    | "routeros"
    | "schoolBook"
    | "shadesOfPurple"
    | "solarizedDark"
    | "solarizedLight"
    | "srcery"
    | "sunburst"
    | "tomorrowNightBlue"
    | "tomorrowNightBright"
    | "tomorrowNightEighties"
    | "tomorrowNight"
    | "tomorrow"
    | "vs"
    | "vs2015"
    | "xcode"
    | "xt256"
    | "zenburn";
