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

const dm = {
  registrar: "gandi",
  api: true,
  expires: { api: true, date: Date.now() },
  nameservers: { setAtRegistrar: [], resolvedAtSource: [] },
  recordsResolve: {},
  certificates: {
    past: [],
    configured: [],
  },
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
