import { Paper } from "@material-ui/core";
import { PektinClient, PublicDnssecData } from "@pektin/client";
import { Component, CSSProperties, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import HelpPopper from "./HelpPopper";
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
        <h1>{this.props.match.params.domainName}</h1>
        <DnssecParams client={this.props.client} domainName={this.props.match.params.domainName} />
      </div>
    );
  };
}

const DnssecParams = ({
  client,
  domainName,
  style,
}: {
  client: PektinClient;
  domainName: string;
  style?: CSSProperties;
}) => {
  const [state, setState] = useState({ loaded: false, res: null as unknown as PublicDnssecData });

  useEffect(() => {
    client.getPublicDnssecData(domainName).then((res) => setState({ res, loaded: true }));
  }, [client, domainName]);

  if (!state.loaded) return <div></div>;

  return (
    <Paper className="DnssecParams" style={style}>
      <h2>DNSSEC Information</h2>
      <div className="basicInfo">
        <span>
          <div className="tfName">
            flag
            <HelpPopper helper="dnssecInfoFlag" />
          </div>
          <span className="selectable-all code">{state.res.flag}</span>
        </span>
        <span>
          <div className="tfName">
            algorithm
            <HelpPopper helper="dnssecInfoAlgorithm" />
          </div>
          <span className="selectable-all code">{state.res.algorithm}</span>
        </span>
        <span>
          <div className="tfName">
            keyTag
            <HelpPopper helper="dnssecInfoKeyTag" />
          </div>
          <span className="selectable-all code">{state.res.keyTag}</span>
        </span>
      </div>

      <div className="digests">
        <br />
        <div className="tfName">
          digests
          <HelpPopper helper="dnssecInfoDigests" />
        </div>

        <div>
          <div className="hashName label">SHA256</div>
          <div className="selectable-all code">{state.res.digests.sha256}</div>
        </div>
        <div>
          <div className="hashName label">SHA384</div>
          <div className="selectable-all code">{state.res.digests.sha384}</div>
        </div>
        <div>
          <div className="hashName label">SHA512</div>
          <div className="selectable-all code">{state.res.digests.sha512}</div>
        </div>
      </div>
      <br />
      <div className="publicKeys">
        <div className="tfName">
          Public Key
          <HelpPopper helper="dnssecInfoPublicKeys" />
        </div>
        <div>
          <div className="keyType label">PEM</div>
          <div className="selectable-all code">{state.res.pubKeyPEM}</div>
        </div>
        <br />
        <div>
          <div className="keyType label">DNS-BASE64</div>
          <div className="selectable-all code">{state.res.pubKeyDns}</div>
        </div>
      </div>
    </Paper>
  );
};
