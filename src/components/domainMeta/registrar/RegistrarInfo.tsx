import { Paper } from "@material-ui/core";
import { PektinClient, ProxyOptions, PektinRRType } from "@pektin/client";
import { GlobalRegistrar, PluginNames, FetchType } from "@pektin/global-registrar";
import { CSSProperties, PureComponent, Fragment } from "react";
import ShouldIsTable from "./ShouldIsTable";

interface Meta {
  readonly pektin?: MetaPektin;
}
interface MetaPektin {
  readonly registrar?: MetaRegistrar;
}
interface MetaRegistrar {
  readonly id?: string;
  readonly i?: number;
}

interface RegistrarInfoProps {
  client: PektinClient;
  domainName: string;
  style?: CSSProperties;
}
interface RegistrarInfoState {
  loaded: boolean;
  domainMeta: Meta;
  proxyOptions: ProxyOptions;
  gr?: GlobalRegistrar;
}
export class RegistrarInfo extends PureComponent<RegistrarInfoProps, RegistrarInfoState> {
  constructor(props: RegistrarInfoProps) {
    super(props);
    this.state = {
      loaded: false,
      domainMeta: {},
      proxyOptions: {} as ProxyOptions,
    };
  }
  componentDidMount = async () => {
    const soa = await this.props.client.get([
      { name: this.props.domainName, rr_type: PektinRRType.SOA },
    ]);

    let domainMeta;
    try {
      domainMeta = JSON.parse(soa.data?.[0]?.data?.meta ?? "{}");
    } catch (error) {}
    const id = domainMeta?.pektin?.registrar?.id;
    const index = domainMeta?.pektin?.registrar?.index;
    const proxyOptions = await this.props.client.getProxyOptions(id);
    const data = this.props.client.pc3?.info?.apiCredentials?.[id ?? ""]?.[index ?? 0];

    let gr;
    try {
      gr = new GlobalRegistrar(
        {
          type: id as PluginNames,
          /*@ts-ignore*/
          data: data,
        },
        FetchType.proxy,
        proxyOptions
      );
    } catch (error) {
      console.log(error);
    }

    this.setState({
      domainMeta,
      proxyOptions,
      loaded: true,
      gr,
    });
  };

  render = () => {
    const id = this.state.domainMeta?.pektin?.registrar?.id;

    const index = this.state.domainMeta?.pektin?.registrar?.i;
    return (
      <div className="RegistrarTab">
        <Paper className="RegistrarInfo">
          {this.state.loaded === false ? (
            <div>Loading</div>
          ) : (
            <Fragment>
              <h2>Registrar Information</h2>
              <div className="basicInfo">
                <div>id: {id ?? "unknown"}</div>
                <div>index: {index}</div>
                <div>
                  api key in pc3?:
                  {this.props.client.pc3?.info?.apiCredentials?.[id ?? ""]?.[index ?? 0]
                    ? " true"
                    : " false"}
                </div>
              </div>
            </Fragment>
          )}
        </Paper>

        {this.state.loaded === false ? (
          <div>Loading</div>
        ) : (
          <ShouldIsTable
            gr={this.state.gr}
            domain={this.props.domainName}
            client={this.props.client}
          ></ShouldIsTable>
        )}
      </div>
    );
  };
}
