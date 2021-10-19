import { Fragment, PureComponent } from "react";
import "@fontsource/inter/900.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/400.css";
import Sidebar from "./components/SideBar";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
import * as l from "./components/lib";
import * as vaultApi from "./components/apis/vault";
import Auth from "./components/Auth";
import ImportDomain from "./components/ImportDomain";
import ConfigView from "./components/Config";
import cloneDeep from "lodash/cloneDeep";
import { HotKeys, configure as configureHotkeys } from "react-hotkeys";

configureHotkeys({ ignoreTags: [] });

interface AppState {
  readonly config: t.Config;
  readonly db: l.PektinUiDb;
  readonly configLoaded: boolean;
  readonly g: t.Glob;
  readonly domains: string[];
  readonly configError: boolean;
  readonly health?: t.ServiceHealth;
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

  updateLocalConfig = (e: any, type: string, i: number) => {
    const db = this.state.db;
    this.setState(({ config }) => {
      config = cloneDeep(config);
      if (type === "codeStyle") config.local = { ...config.local, [e.target.name]: e.target.value };
      if (type === "newVariable") config.local.variables = [e, ...config.local.variables];

      if (type === "updateVariable") {
        /*@ts-ignore*/
        config.local.variables[i][e.target.name] = e.target.value;
      }
      if (type === "removeVariable") config.local.variables.splice(e, 1);

      db.config.put({ key: "localConfig", value: config.local });
      return { config };
    });
  };

  loadDomains = async () => {
    try {
      if (this.state.configLoaded) {
        const domains = await l.getDomains(this.state.config);
        this.setState({ domains });
      }
    } catch (error) {}
  };

  init = async (vaultAuth: t.VaultAuth, localConfig?: t.LocalConfig) => {
    const { endpoint, token } = vaultAuth;
    const pektinConfig = await vaultApi.getValue({ endpoint, token, key: "pektin-config" });
    if (pektinConfig.error) {
      sessionStorage.clear();
      throw Error();
    }

    const config = {
      ...this.state.config,
      local: localConfig ? { ...localConfig } : this.state.config.local,
      pektin: pektinConfig,
      vaultAuth,
    };
    const domains = await l.getDomains(config);
    return { domains, config };
  };

  componentDidMount = async () => {
    // handle config
    document.addEventListener("contextmenu", this.handleContextMenu);

    this.mounted = true;
    this.healtChecks();

    await this.initDb();
    const localConfig: t.LocalConfig = (await this.state.db.config.get("localConfig"))?.value;
    try {
      const ssr = sessionStorage.getItem("vaultAuth");
      if (!ssr) throw Error();
      const vaultAuth = JSON.parse(ssr);
      const { domains, config } = await this.init(vaultAuth, localConfig);

      // handle custom right click menu
      this.setState(({ g }) => {
        return {
          configLoaded: true,
          g: {
            ...g,
            changeContextMenu: this.changeContextMenu,
            updateLocalConfig: this.updateLocalConfig,
            loadDomains: this.loadDomains,
          },
          config,
          configError: false,
          domains,
        };
      });
    } catch (e) {
      this.setState(({ config }) => ({
        configError: true,
        configLoaded: true,
        config: { ...config, local: localConfig },
      }));
    }
  };

  healtChecks = async () => {
    let vaultHealth = await vaultApi.healthCheck(this.state.config.vaultAuth);
    if (this.mounted && this.state.configLoaded) {
      let vault: t.VaultHealth = { status: "ok", message: "Online" };
      if (vaultHealth?.error) vault = { status: "offline", message: "Offline/Unreachable" };
      else if (vaultHealth?.sealed) vault = { status: "sealed", message: "Vault is sealed" };

      this.setState({ health: { vault } });
    }

    //setTimeout(this.healtChecks, 5000);
  };

  componentWillUnmount = () => {
    this.mounted = false;
    document.removeEventListener("contextmenu", this.handleContextMenu);
  };

  saveAuth = async (vaultAuth: t.VaultAuth) => {
    sessionStorage.setItem("vaultAuth", JSON.stringify(vaultAuth));
    const { domains, config } = await this.init(vaultAuth);
    this.setState({ config, domains });
  };

  handleContextMenuOffClick = (e: any) => {
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
          DELETE: ["ctrl+d"],
          ESCAPE: ["esc"],
          G_SETTINGS: ["ctrl+,"],
        }}
        handlers={{
          G_SETTINGS: () => {
            this.router.history.push("/settings");
          },
        }}
      >
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
                      <Domain {...routeProps} g={this.state.g} config={this.state.config} />
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
