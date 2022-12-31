import {
  absoluteName,
  ApiRecord,
  deAbsolute,
  FetchType,
  PektinClient,
  PektinRRType,
} from "@pektin/client";
import { PureComponent } from "react";
import { MailcowClient, MailDomain } from "@pektin/mailcow-client";
import { Button, Paper } from "@material-ui/core";
import { Add } from "@material-ui/icons";

interface MailcowProps {
  client: PektinClient;
  domainName: string;
}
interface MailcowState {
  mailDomain: MailDomain | null | false;
  mcc: MailcowClient | null;
}
export default class Mailcow extends PureComponent<MailcowProps, MailcowState> {
  constructor(props: MailcowProps) {
    super(props);
    this.state = {
      mailDomain: null,
      mcc: null,
    };
  }
  componentDidMount = async () => {
    const info = this.props.client.pc3.info;

    const mcServer =
      typeof info?.apiCredentials?.mailcow === "object"
        ? Object.keys(info?.apiCredentials?.mailcow)?.[0]
        : undefined;

    if (!mcServer) return;

    const mailcowApiKey = info?.apiCredentials?.mailcow?.[mcServer].apiKey;
    if (typeof mailcowApiKey !== "string") return;
    const proxyOptions = await this.props.client.getProxyOptions(mcServer);
    const mcc = new MailcowClient(mcServer, mailcowApiKey, FetchType.proxy, proxyOptions);

    const mccThisDomain = await mcc.getDomain(deAbsolute(this.props.domainName));
    this.setState({ mailDomain: mccThisDomain.active ? mccThisDomain : null, mcc });
  };
  addDomain = async () => {
    if (!this.state.mcc?.baseurl) return;
    const [addDomain, dkim] = await Promise.all([
      this.state.mcc?.addDomain({
        active: 1,
        domain: deAbsolute(this.props.domainName),
        aliases: 10,
        defquota: 3000,
        mailboxes: 10,
        maxquota: 3000,
        quota: 10000,
      }),
      this.state.mcc.addAndGetDKIM({
        domain: deAbsolute(this.props.domainName),
        key_size: 2048,
        dkim_selector: `dkim`,
      }),
    ]);
    console.log(dkim);

    const mailServer = this.state.mcc?.baseurl;

    const recordsToBeSet: ApiRecord[] = [
      {
        name: absoluteName(this.props.domainName),
        rr_type: PektinRRType.MX,
        rr_set: [{ preference: 0, exchange: absoluteName(mailServer) }],
        ttl: 60,
      },

      {
        name: `autodiscover.${absoluteName(this.props.domainName)}`,
        rr_type: PektinRRType.CNAME,
        rr_set: [{ value: deAbsolute(mailServer) }],
        ttl: 60,
      },
      {
        name: `autoconfig.${absoluteName(this.props.domainName)}`,
        rr_type: PektinRRType.CNAME,
        rr_set: [{ value: deAbsolute(mailServer) }],
        ttl: 60,
      },
      {
        name: `_autodiscover._tcp.${absoluteName(this.props.domainName)}`,
        rr_type: PektinRRType.SRV,
        rr_set: [{ port: 443, priority: 0, weight: 0, target: deAbsolute(mailServer) }],
        ttl: 60,
      },
      {
        name: `dkim._domainkey.${absoluteName(this.props.domainName)}`,
        rr_type: PektinRRType.TXT,
        rr_set: [{ value: dkim.dkim_txt }],
        ttl: 60,
      },
      {
        name: absoluteName(this.props.domainName),
        rr_type: PektinRRType.TXT,
        rr_set: [{ value: `"v=spf1 mx -all"` }],
        ttl: 60,
      },
      {
        name: `_dmarc.${absoluteName(this.props.domainName)}`,
        rr_type: PektinRRType.TXT,
        rr_set: [{ value: `"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;"` }],
        ttl: 60,
      },
    ];

    await this.props.client.set(recordsToBeSet);
  };

  render = () => {
    return (
      <div className="Mailcow">
        <Paper>
          {this.state.mailDomain ? (
            <div>{JSON.stringify(this.state.mailDomain)}</div>
          ) : (
            <Button
              onClick={this.addDomain}
              color="primary"
              variant="contained"
              size="small"
              startIcon={<Add></Add>}
            >
              Add
            </Button>
          )}
        </Paper>
      </div>
    );
  };
}
