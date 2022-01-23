import { PektinConfig } from "@pektin/client/src/types";
import App from "../App";
import { CodeStyle } from "./code-styles";

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
  changeContextMenu: InstanceType<typeof App>["changeContextMenu"];
  cmAction: string;
  updateLocalConfig: InstanceType<typeof App>["updateLocalConfig"];
  loadDomains: InstanceType<typeof App>["loadDomains"];
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

export interface Variable {
  key: string;
  value: string;
}
export interface LocalConfig {
  defaultActiveTab: number;
  codeStyle: CodeStyle;
  variables: Variable[];
  synesthesia: boolean;
  replaceVariables: boolean;
  helper: boolean;
}

export interface ValueSearchMatch {
  [key: string]: boolean | any;
}

export interface SearchMatch {
  name: boolean;
  rr_type: boolean;
  rr_set: ValueSearchMatch;
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
  apiError: string | null;
}

export enum PektinRRType {
  A = "A",
  AAAA = "AAAA",
  NS = "NS",
  CNAME = "CNAME",
  SOA = "SOA",
  MX = "MX",
  TXT = "TXT",
  SRV = "SRV",
  CAA = "CAA",
  OPENPGPKEY = "OPENPGPKEY",
  TLSA = "TLSA",
}
