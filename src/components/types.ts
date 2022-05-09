import {
  ApiRecordA,
  ApiRecordAAAA,
  ApiRecordBase,
  ApiRecordCNAME,
  ApiRecordMX,
  ApiRecordNS,
  ApiRecordOPENPGPKEY,
  ApiRecordSRV,
  ApiRecordTLSA,
  ApiRecordTXT,
} from "@pektin/client";
import { PektinConfig } from "@pektin/config/dist/js/config-types";
import App from "../App";
import { CodeStyle } from "./code-styles";

import { PektinRRType } from "@pektin/client";
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
  tntAuth: string | null;
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
  ttl: boolean;
  rr_set: ValueSearchMatch;
}

export interface ValueFieldChanged {
  [key: string]: boolean | any;
}

export interface FieldsChanged {
  name: boolean;
  type: boolean;
  ttl: boolean;
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

export type DisplayRecord =
  | ApiRecordA
  | ApiRecordAAAA
  | DisplayRecordCAA
  | ApiRecordCNAME
  | ApiRecordMX
  | ApiRecordNS
  | ApiRecordOPENPGPKEY
  | ApiRecordSRV
  | ApiRecordTLSA
  | ApiRecordTXT
  | DisplayRecordSOA;

export interface DisplayRecordSOA extends ApiRecordBase {
  rr_type: PektinRRType.SOA;
  rr_set: DisplayResourceRecordSOA[];
}
export interface DisplayResourceRecordSOA {
  mname: string;
  rname: string;
}

export interface DisplayRecordCAA extends ApiRecordBase {
  rr_type: PektinRRType.CAA;
  rr_set: DisplayResourceRecordCAA[];
}
export interface DisplayResourceRecordCAA {
  caaValue: string;
  tag: string;
}
