import React, { Component } from "react";
import "@fontsource/inter/900.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/400.css";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Base from "./components/Base";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
import * as l from "./components/lib";
import Auth from "./components/Auth";
import ImportDomain from "./components/ImportDomain";
import ConfigView from "./components/Config";

const f = fetch;
const theme = createTheme({
    palette: {
        primary: {
            light: "#dc143c",
            main: "#dc143c",
            dark: "#a20016",
            contrastText: "#fff"
        },
        secondary: {
            light: "#78ffea",
            main: "#37dbb8",
            dark: "#00a888",
            contrastText: "#000"
        }
    }
});

interface AppState {
    readonly config: t.Config;
    readonly db: l.PektinUiDb;
    readonly configLoaded: boolean;
}
interface AppProps {}

export default class App extends Component<AppProps, AppState> {
    state: AppState = {
        config: l.defaulConfig,
        db: new l.PektinUiDb(),
        configLoaded: false
    };

    initDb = async () => {
        await this.state.db.config.add({ key: "localConfig", value: this.state.config.local }).catch(() => {});
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
    updateLocalConfig = (e: any) => {
        const db = this.state.db;
        this.setState(({ config }) => {
            config = { ...config, local: { ...config.local, [e.target.name]: e.target.value } };
            db.config.put({ key: "localConfig", value: config.local });
            return { config };
        });
    };

    loadAuth = () => {
        const ssr = sessionStorage.getItem("vaultAuth");
        if (ssr) {
            return this.setState(({ config }) => {
                const vaultAuth = JSON.parse(ssr);
                config.vaultAuth = vaultAuth;
                return { config };
            });
        }
    };

    loadPektinConfig = async () => {
        const { endpoint, token } = this.state.config.vaultAuth;
        if (endpoint.length) {
            const res = await f(endpoint + "/v1/pektin-kv/data/pektin-config", {
                headers: {
                    "X-Vault-Token": token
                }
            });
            const pektin = await res.json().catch(e => console.log(e));
            this.setState(({ config }) => ({ config: { ...config, pektin } }));
        }
    };

    componentDidMount = async () => {
        await this.initDb();
        await this.loadLocalConfig();
        this.loadAuth();
        await this.loadPektinConfig();

        this.setState({ configLoaded: true });
    };

    saveAuth = (vaultAuth: t.VaultAuth) => {
        sessionStorage.setItem("vaultAuth", JSON.stringify(vaultAuth));
        this.setState(({ config }) => {
            config.vaultAuth = vaultAuth;
            return { config };
        });
    };

    render = () => {
        if (!this.state.configLoaded) return <div></div>;
        return (
            <Router>
                <ThemeProvider theme={theme}>
                    <Switch>
                        <Route exact path="/auth" render={routeProps => <Auth config={this.state.config} saveAuth={this.saveAuth} {...routeProps} />} />

                        <PrivateRoute config={this.state.config} exact path="/">
                            <Base config={this.state.config}></Base>
                        </PrivateRoute>
                        <PrivateRoute exact config={this.state.config} path="/add/existing/manual">
                            <Base config={this.state.config}>
                                <AddDomain config={this.state.config} />
                            </Base>
                        </PrivateRoute>
                        <PrivateRoute exact config={this.state.config} path="/add/existing/import">
                            <Base config={this.state.config}>
                                <ImportDomain config={this.state.config} />
                            </Base>
                        </PrivateRoute>
                        <PrivateRoute config={this.state.config} exact path={`/domain/:domainName`}>
                            <Base config={this.state.config}>
                                <Domain config={this.state.config} />
                            </Base>
                        </PrivateRoute>
                        <PrivateRoute exact config={this.state.config} path="/config/">
                            <Base config={this.state.config}>
                                <ConfigView updateConfig={this.updateLocalConfig} config={this.state.config} />
                            </Base>
                        </PrivateRoute>

                        <PrivateRoute config={this.state.config} path="*">
                            <Base config={this.state.config}></Base>
                        </PrivateRoute>
                    </Switch>
                </ThemeProvider>
            </Router>
        );
    };
}
interface PrivateRouteProps {
    config: t.Config;
    [propName: string]: any;
    children: any;
}
interface PrivateRouteState {}
class PrivateRoute extends Component<PrivateRouteProps, PrivateRouteState> {
    render = () => {
        return (
            <Route
                {...this.props.rest}
                render={routeProps =>
                    this.props.config.vaultAuth.token.length ? (
                        React.cloneElement(this.props.children, { ...routeProps })
                    ) : (
                        <Redirect
                            to={{
                                pathname: "/auth"
                            }}
                        />
                    )
                }
            />
        );
    };
}
