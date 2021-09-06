import React, { Component } from "react";
import "@fontsource/inter";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Base from "./components/Base";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
import * as l from "./components/lib";
import Auth from "./components/Auth";

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
        const db = this.state.db;
        await db.config.add({ key: "config", value: l.defaulConfig }).catch(() => {});
    };

    loadConfig = async () => {
        const db = this.state.db;
        const config = (await db.config.get("config"))?.value;
        if (config) this.setState({ config });
    };

    loadAuth = () => {
        const ssr = sessionStorage.getItem("vaultAuth");
        if (ssr) {
            const vaultAuth = JSON.parse(ssr);
            this.setState(({ config }) => {
                config.vaultAuth = vaultAuth;
                return { config, configLoaded: true };
            });
        } else {
            this.setState({ configLoaded: true });
        }
    };

    componentDidMount = async () => {
        await this.initDb();
        this.loadAuth();
        //await this.loadConfig();
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
                        <PrivateRoute exact config={this.state.config} path="/add-domain">
                            <Base config={this.state.config}>
                                <AddDomain />
                            </Base>
                        </PrivateRoute>
                        <PrivateRoute config={this.state.config} exact path={`/domain/:domainName`}>
                            <Base config={this.state.config}>
                                <Domain config={this.state.config} />
                            </Base>
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
        console.log(this.props.config);

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
