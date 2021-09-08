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
import cloneDeep from "lodash/cloneDeep";

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

    configToDb = (config: t.Config) => {
        const newConfig: any = cloneDeep(config);
        delete newConfig.apis;
        delete newConfig.vaultAuth;
        delete newConfig.pektinApiAuth;
        return newConfig;
    };

    initDb = async () => {
        const db = this.state.db;
        const value = this.configToDb(this.state.config);
        await db.config.add({ key: "config", value }).catch(() => {});
    };

    loadConfig = async () => {
        const db = this.state.db;
        const newConfig = (await db.config.get("config"))?.value;

        if (newConfig) {
            this.setState(({ config }) => {
                return { config: { ...config, ...newConfig } };
            });
        }
    };
    updateConfig = (e: any) => {
        const db = this.state.db;
        this.setState(({ config }) => {
            config = { ...config, [e.target.name]: e.target.value };
            const value = this.configToDb(config);
            db.config.put({ key: "config", value });
            return { config };
        });
    };

    loadAuth = () => {
        const ssr = sessionStorage.getItem("vaultAuth");
        if (ssr) {
            return this.setState(({ config }) => {
                const vaultAuth = JSON.parse(ssr);
                config.vaultAuth = vaultAuth;
                return { config, configLoaded: true };
            });
        }
        this.setState({ configLoaded: true });
    };

    componentDidMount = async () => {
        await this.initDb();
        await this.loadConfig();
        this.loadAuth();
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
                                <ConfigView updateConfig={this.updateConfig} config={this.state.config} />
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
