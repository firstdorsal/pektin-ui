import { Button, Paper, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { PektinClient, ProxyOptions, PektinRRType, FetchType, ApiRecord } from "@pektin/client";
import { GlobalRegistrar, PluginNames } from "@pektin/global-registrar";
import { CSSProperties, PureComponent, Fragment } from "react";
import { registrars } from "../../lib";
import ShouldIsTable from "./ShouldIsTable";
import update from "immutability-helper";
import { Save } from "@material-ui/icons";
import { cloneDeep } from "lodash";

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
  soa?: ApiRecord | null;
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

    let domainMeta = null;
    try {
      domainMeta = JSON.parse(soa.data?.[0]?.data?.meta ?? "{}");
    } catch (error) {}
    const id = domainMeta?.pektin?.registrar?.id ?? "";
    const index = domainMeta?.pektin?.registrar?.index ?? 0;
    const proxyOptions = await this.props.client.getProxyOptions(id);
    const data = this.props.client.pc3?.info?.apiCredentials?.[id]?.[index];

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
      domainMeta: domainMeta ?? { pektin: { registrar: { id, index } } },
      proxyOptions,
      loaded: true,
      gr,
      soa: soa.data?.[0]?.data,
    });
  };

  render = () => {
    const id = this.state.domainMeta?.pektin?.registrar?.id ?? "";

    const index = this.state.domainMeta?.pektin?.registrar?.i ?? 0;
    return (
      <div className="RegistrarTab">
        <Paper className="RegistrarInfo">
          {this.state.loaded === false ? (
            <div>Loading</div>
          ) : (
            <Fragment>
              <h2>Registrar Information</h2>
              <div className="basicInfo">
                <div>
                  <Autocomplete
                    style={{ width: "80%", display: "inline-block", marginRight: "5%" }}
                    id="selectMethod"
                    freeSolo
                    forcePopupIcon={true}
                    selectOnFocus={true}
                    openOnFocus={true}
                    clearOnEscape
                    value={id}
                    onChange={(e, value) =>
                      this.setState((state) =>
                        update(state, {
                          domainMeta: {
                            pektin: {
                              registrar: { id: { $set: value ?? "" } },
                            },
                          },
                        })
                      )
                    }
                    inputValue={id}
                    onInputChange={(event, newInputValue) =>
                      this.setState((state) =>
                        update(state, {
                          domainMeta: {
                            pektin: {
                              registrar: { id: { $set: newInputValue ?? "" } },
                            },
                          },
                        })
                      )
                    }
                    options={registrars.map((r) => r.id)}
                    renderInput={(params) => (
                      <TextField {...params} label="Registrar" margin="none" variant="standard" />
                    )}
                  />

                  <TextField
                    style={{ width: "10%", display: "inline-block" }}
                    label="Index"
                    margin="none"
                    variant="standard"
                    type={"number"}
                    value={index}
                    onChange={(e) =>
                      this.setState((state) =>
                        update(state, {
                          domainMeta: {
                            pektin: {
                              registrar: { i: { $set: Math.max(parseInt(e.target.value), 0) } },
                            },
                          },
                        })
                      )
                    }
                  />
                  <Button
                    onClick={async () => {
                      const soa = cloneDeep(this.state.soa);
                      if (!soa) return;
                      soa.meta = JSON.stringify(this.state.domainMeta);
                      await this.props.client.set([soa]);
                    }}
                    variant="contained"
                    size="small"
                    color="primary"
                    startIcon={<Save />}
                  >
                    Save
                  </Button>
                </div>
                <div>
                  api key in pc3?
                  {this.props.client.pc3?.info?.apiCredentials?.[id]?.[index] ? " true" : " false"}
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
