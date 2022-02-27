import { PektinClient } from "@pektin/client";
import { Component } from "react";
import { RouteComponentProps } from "react-router-dom";
import { Config, Glob } from "./types";

interface RouteParams {
  readonly domainName: string;
}

interface DomainMetaProps extends RouteComponentProps<RouteParams> {
  readonly config: Config;
  readonly g: Glob;
  readonly client: PektinClient;
}
// eslint-disable-next-line
const dm = {
  registrar: "gandi",
  api: true,
  expires: { api: true, date: Date.now() }, // if the expiration time is set manually or via the api
  nameservers: { setAtRegistrar: [], resolvedAtSource: [] }, // what nameserver are set at the registrar and what the actual resolved state is
  recordsResolve: {}, // what records resolve publicly how
  certificates: {
    past: [], // what certificates were issued in the past
    configured: [], // what certificates are set to be (re)issued on a regular basis
  },
  notes: "",
  primary: true,
};

interface DomainMetaState {}
export default class DomainMeta extends Component<DomainMetaProps, DomainMetaState> {
  render = () => {
    return (
      <div className="DomainMeta">
        <br />
        <h1>{this.props.match.params.domainName}</h1>
      </div>
    );
  };
}
