import { Fragment, MouseEvent, PureComponent } from "react";
import "@fontsource/inter/900.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/400.css";
import Sidebar from "./components/SideBar";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
import * as l from "./components/lib";
import Auth from "./components/Auth";
import ImportDomain from "./components/ImportDomain";
import ConfigView from "./components/Config";
import cloneDeep from "lodash/cloneDeep";
import { HotKeys, configure as configureHotkeys, GlobalHotKeys } from "react-hotkeys";
import { PektinClientConnectionConfigOverride } from "@pektin/client/src/types";
import { ExtendedPektinApiClient } from "@pektin/client";

configureHotkeys({ ignoreTags: [] });

interface AppState {
  readonly config: t.Config;
  readonly db: l.PektinUiDb;
  readonly configLoaded: boolean;
  readonly g: t.Glob;
  readonly domains: string[];
  readonly configError: boolean;
  readonly health?: t.ServiceHealth;
  readonly client: ExtendedPektinApiClient;
}
interface AppProps {}

export default class App extends PureComponent<AppProps, AppState> {
  state: AppState = {
    config: l.defaulConfig,
    db: new l.PektinUiDb(),
    configLoaded: false,
    configError: false,
    g: {
      contextMenu: false,
      changeContextMenu: () => {},
      cmAction: "",
      updateLocalConfig: () => {},
      loadDomains: () => {},
    },
    domains: [],
    client: undefined as unknown as ExtendedPektinApiClient,
  };
  mounted = true;
  router: any;
  initDb = async () => {
    await this.state.db.config
      .add({ key: "localConfig", value: this.state.config.local })
      .catch(() => {});
  };

  loadLocalConfig = async () => {
    const db = this.state.db;
    const localConfig: t.LocalConfig = (await db.config.get("localConfig"))?.value;

    if (localConfig) {
      this.setState(({ config }) => {
        config = { ...config, local: { ...config.local, ...localConfig } };
        return { config };
      });
    }
  };

  updateLocalConfig = ({
    type,
    i,
    e,
    newVariable,
  }: {
    type: string;
    i?: number;
    e?: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>;
    newVariable?: t.Variable;
  }) => {
    const db = this.state.db;
    this.setState(({ config }) => {
      config = cloneDeep(config);
      if (type === "codeStyle" && e) {
        config.local = { ...config.local, [e.target.name]: e.target.value };
      }

      if (
        type === "updateVariable" &&
        i &&
        e &&
        (e.target.name === "key" || e.target.name === "value")
      ) {
        config.local.variables[i][e.target.name] = e.target.value;
      }

      if (type === "removeVariable" && i) config.local.variables.splice(i, 1);
      if (type === "newVariable" && newVariable) {
        config.local.variables = [newVariable, ...config.local.variables];
      }
      db.config.put({ key: "localConfig", value: config.local });
      return { config };
    });
  };

  loadDomains = async () => {
    try {
      if (this.state.configLoaded) {
        if (this.state.client === undefined) throw Error("loadDomains: client is undefined");
        const domains = await this.state.client.getDomains();
        this.setState({ domains });
      }
    } catch (error) {}
  };

  initClient = async (client: ExtendedPektinApiClient) => {
    try {
      await client.getPektinConfig();
    } catch (error: any) {
      sessionStorage.clear();
      throw Error(error);
    }
    try {
      await client.getRecursorAuth();
    } catch (error) {
      console.error(error);
    }

    const domains = await client.getDomains();
    return { domains };
  };

  componentDidMount = async () => {
    // handle config
    document.addEventListener("contextmenu", this.handleContextMenu);

    this.mounted = true;
    this.healtChecks();

    await this.initDb();
    const localConfig: t.LocalConfig = (await this.state.db.config.get("localConfig"))?.value;
    try {
      const ssr = sessionStorage.getItem("pccc");
      if (!ssr) throw Error();
      const pccc: PektinClientConnectionConfigOverride = JSON.parse(ssr);
      const client = new ExtendedPektinApiClient(pccc);
      const { domains } = await this.initClient(client);

      // handle custom right click menu
      this.setState(({ g, config }) => {
        return {
          configLoaded: true,
          g: {
            ...g,
            changeContextMenu: this.changeContextMenu,
            updateLocalConfig: this.updateLocalConfig,
            loadDomains: this.loadDomains,
          },
          config: { ...config, local: localConfig },
          configError: false,
          client,
          domains,
        };
      });
    } catch (e) {
      this.setState(({ g, config }) => ({
        // TODO: code style doesnt change on first load of production version

        configError: true,
        configLoaded: true,
        config: { ...config, local: localConfig },
        g: {
          ...g,
          changeContextMenu: this.changeContextMenu,
          updateLocalConfig: this.updateLocalConfig,
          loadDomains: this.loadDomains,
        },
      }));
    }
  };

  healtChecks = async () => {
    /*
    let vaultHealth = await vaultApi.healthCheck(this.state.config.vaultAuth);
    if (this.mounted && this.state.configLoaded) {
      let vault: t.VaultHealth = { status: "ok", message: "Online" };
      if (vaultHealth?.error) vault = { status: "offline", message: "Offline/Unreachable" };
      else if (vaultHealth?.sealed) vault = { status: "sealed", message: "Vault is sealed" };

      this.setState({ health: { vault } });
    }
*/
    //setTimeout(this.healtChecks, 5000);
  };

  componentWillUnmount = () => {
    this.mounted = false;
    document.removeEventListener("contextmenu", this.handleContextMenu);
  };

  saveAuth = async (
    pccc: PektinClientConnectionConfigOverride,
    client: ExtendedPektinApiClient
  ) => {
    sessionStorage.setItem("pccc", JSON.stringify(pccc));

    const { domains } = await this.initClient(client);
    this.setState({ domains, client });
  };

  handleContextMenuOffClick = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    this.setState(({ g }) => ({ g: { ...g, contextMenu: false } }));
  };

  handleContextMenu = (e: any) => {
    if (e.ctrlKey || e.shiftKey || e.altKey)
      return this.setState(({ g }) => ({ g: { ...g, contextMenu: false } }));
    const target = e.target;
    let action = "";
    if (target.tagName === "INPUT") action = "paste";
    if (target.tagName === "PRE") action = "code";
    if (!action.length) return this.setState(({ g }) => ({ g: { ...g, contextMenu: false } }));
    e.preventDefault();
    this.setState(({ g }) => ({ g: { ...g, contextMenu: e, cmAction: action } }));
  };

  changeContextMenu = (value: any) => {
    return this.setState(({ g }) => ({ g: { ...g, contextMenu: value } }));
  };

  render = () => {
    if (!this.state.configLoaded) return <div></div>;

    return (
      <HotKeys
        style={{ height: "100%" }}
        keyMap={{
          SELECT_ALL: ["ctrl+a"],
          SEARCH: ["ctrl+f"],
          REPLACE: ["ctrl+h"],
          RELOAD: ["ctrl+r"],
          NEW: ["shift+a"],
          SAVE: ["ctrl+s"],
          DELETE: ["del"],
          ESCAPE: ["esc"],
          G_SETTINGS: ["ctrl+,"],
        }}
        handlers={{
          G_SETTINGS: () => {
            this.router.history.push("/settings");
          },
        }}
      >
        <GlobalHotKeys />
        <Router ref={(ref) => (this.router = ref)}>
          {this.state.configError ? <Redirect to="/auth" /> : ""}
          {this.state.g.contextMenu ? (
            <div
              onClick={this.handleContextMenuOffClick}
              onContextMenu={this.handleContextMenuOffClick}
              className="cmOverlay"
            />
          ) : (
            ""
          )}

          <Switch>
            <Route
              exact
              path="/auth"
              render={(routeProps) => (
                <Auth config={this.state.config} saveAuth={this.saveAuth} {...routeProps} />
              )}
            />

            <Route
              exact
              path="/add/existing/manual"
              render={(routeProps: any) => {
                return (
                  <Fragment>
                    <Sidebar
                      health={this.state.health}
                      domains={this.state.domains}
                      config={this.state.config}
                    ></Sidebar>
                    <main>
                      <AddDomain
                        {...routeProps}
                        loadDomains={this.loadDomains}
                        g={this.state.g}
                        config={this.state.config}
                        client={this.state.client}
                      />
                    </main>
                  </Fragment>
                );
              }}
            />

            <Route
              exact
              path="/add/existing/import"
              render={(routeProps: any) => {
                return (
                  <Fragment>
                    <Sidebar
                      health={this.state.health}
                      domains={this.state.domains}
                      config={this.state.config}
                    ></Sidebar>
                    <main>
                      <ImportDomain
                        routeProps={routeProps}
                        g={this.state.g}
                        config={this.state.config}
                        client={this.state.client}
                      />
                    </main>
                  </Fragment>
                );
              }}
            />
            <Route
              path={`/domain/:domainName`}
              render={(routeProps: any) => {
                return (
                  <Fragment>
                    <Sidebar
                      health={this.state.health}
                      domains={this.state.domains}
                      config={this.state.config}
                    ></Sidebar>
                    <main>
                      <Domain
                        {...routeProps}
                        g={this.state.g}
                        config={this.state.config}
                        client={this.state.client}
                      />
                    </main>
                  </Fragment>
                );
              }}
            />
            <Route
              exact
              path="/settings"
              render={(routeProps: any) => {
                return (
                  <Fragment>
                    <Sidebar
                      health={this.state.health}
                      domains={this.state.domains}
                      config={this.state.config}
                    ></Sidebar>
                    <main>
                      <ConfigView g={this.state.g} config={this.state.config} />
                    </main>
                  </Fragment>
                );
              }}
            />

            <Route
              path="*"
              render={(routeProps: any) => {
                return (
                  <Fragment>
                    <Sidebar
                      health={this.state.health}
                      domains={this.state.domains}
                      config={this.state.config}
                    ></Sidebar>
                    <main></main>
                  </Fragment>
                );
              }}
            />
          </Switch>
        </Router>
      </HotKeys>
    );
  };
}
