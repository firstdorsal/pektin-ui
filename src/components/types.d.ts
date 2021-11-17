export interface ToluolResponse {
  additional_answers: ToluolAnswer[];
  answers: ToluolAnswer[];
  authoritative_answers: ToluolAnswer[];
  header: ToluolHeader;
  questions: ToluolQuestion[];
}

export interface ToluolAnswer {
  NONOPT: {
    atype: string;
    class: "IN";
    name: string;
    rdata: string[];
    ttl: number;
  };
}

export interface ToluolQuestion {
  qclass: string;
  qname: string;
  qtype: string;
}
export interface ToluolHeader {
  ancount: number;
  arcount: number;
  flags: { flags: number };
  msg_id: number;
  nscount: number;
  opcode: string;
  qdcount: number;
  qr: boolean;
  rcode: string;
}

export interface DOHQuery {
  name: string;
  type: string;
}
export interface ServiceHealth {
  vault: VaultHealth;
}

export interface VaultHealth {
  status: "ok" | "sealed" | "offline";
  message: string;
}

export type ValidationType = "error" | "warning" | "ok";
export interface ValidationResult {
  type: ValidationType;
  message?: string;
}

export interface FieldValidity {
  name: ValidationResult;
  values: RRValidity[];
  totalValidity: ValidationType;
}
export interface RRValidity {
  [fieldName: string]: ValidationResult;
}

export interface ValidateParams {
  domainName: string;
}

export interface Glob {
  contextMenu: boolean;
  changeContextMenu: Function;
  cmAction: string;
  updateLocalConfig: Function;
  loadDomains: Function;
}
export interface VaultAuth {
  endpoint: string;
  token: string;
}

export interface Config {
  vaultAuth: VaultAuth;
  recursorAuth: string | null;
  foreignApis: any[];
  local: LocalConfig;
  pektin: PektinConfig | undefined;
}

export interface PektinConfig {
  domain: string;
  nameServers: MainNameServer[];
  uiSubDomain: string;
  apiSubDomain: string;
  vaultSubDomain: string;
  recursorSubDomain: string;
  enableUi: boolean;
  enableApi: boolean;
  enableRecursor: boolean;
  enableRotate: boolean;
  createCerts: boolean;
  letsencryptEmail: string;
  autoConfigureMainDomain: boolean;
  proxyConfig: string;
  createProxy: boolean;
  buildFromSource: boolean;
  dev: string;
  insecureDevIp: string;
}

export interface MainNameServer {
  subDomain: string;
  ips: string[];
  legacyIps: string[];
}

export interface Variable {
  key: string;
  value: string;
}
export interface LocalConfig {
  defaultActiveTab: number;
  codeStyle: codeStyle;
  variables: Variable[];
  synesthesia: boolean;
  replaceVariables: boolean;
  helper: boolean;
}

export interface PektinUiConnectionConfig {
  username: string;
  password: string;
  vaultEndpoint: string;
}

export interface ValueSearchMatch {
  [key: string]: boolean | any;
}

export interface SearchMatch {
  name: boolean;
  type: boolean;
  values: ValueSearchMatch;
}

export interface ValueFieldChanged {
  [key: string]: boolean | any;
}

export interface FieldsChanged {
  name: boolean;
  type: boolean;
  values: ValueFieldChanged[];
}

export interface DomainMeta {
  selected: boolean;
  expanded: boolean;
  changed: FieldsChanged;
  anyChanged: boolean;
  searchMatch: SearchMatch;
  anySearchMatch: boolean;
  validity?: FieldValidity;
}

export interface DisplayRecord {
  name: string;
  type: RRType;
  values: ResourceRecordValue[];
}

export type RRType =
  | "NEW"
  | "A"
  | "AAAA"
  | "NS"
  | "CNAME"
  | "PTR"
  | "SOA"
  | "MX"
  | "TXT"
  | "SRV"
  | "CAA"
  | "OPENPGPKEY"
  | "TLSA";

export type ResourceRecordValue =
  | A
  | AAAA
  | NS
  | CNAME
  | PTR
  | SOA
  | MX
  | TXT
  | SRV
  | CAA
  | OPENPGPKEY
  | TLSA;

export interface RRVal {
  ttl: number;
  value?: string;
}

export interface A extends RRVal {
  value: string;
}
export interface AAAA extends RRVal {
  value: string;
}
export interface NS extends RRVal {
  value: string;
}
export interface CNAME extends RRVal {
  value: string;
}
export interface PTR extends RRVal {
  value: string;
}
export interface TXT extends RRVal {
  value: string;
}
export interface OPENPGPKEY extends RRVal {
  value: string;
}
export interface SOA extends RRVal {
  mname: string;
  rname: string;
}

export interface MX extends RRVal {
  preference: number;
  exchange: string;
}

export interface SRV extends RRVal {
  priority: number;
  weight: number;
  port: number;
  target: string;
}

export interface CAA extends RRVal {
  flag: number; //0;
  tag: "issue" | "issuewild" | "iodef"; //"issue" | "issuewild" | "iodef" | "contactemail" | "contactphone";
  caaValue: string;
}

export interface TLSA extends RRVal {
  usage: 0 | 1 | 2 | 3;
  selector: 0 | 1;
  matching_type: 0 | 1 | 2;
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
