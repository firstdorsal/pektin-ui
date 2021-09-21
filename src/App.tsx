import React, { Component } from "react";
import "@fontsource/inter/900.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/400.css";
import Base from "./components/Base";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
import * as l from "./components/lib";
import * as vaultApi from "./components/apis/vault";
import Auth from "./components/Auth";
import ImportDomain from "./components/ImportDomain";
import ConfigView from "./components/Config";

interface AppState {
    readonly config: t.Config;
    readonly db: l.PektinUiDb;
    readonly configLoaded: boolean;
    readonly g: t.Glob;
}
interface AppProps {}

export default class App extends Component<AppProps, AppState> {
    state: AppState = {
        config: l.defaulConfig,
        db: new l.PektinUiDb(),
        configLoaded: false,
        g: { contextMenu: false, changeContextMenu: false, cmAction: "", updateLocalConfig: false }
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

    updateLocalConfig = (e: any, type: string, i: number) => {
        const db = this.state.db;
        this.setState(({ config }) => {
            if (type === "codeStyle") config.local = { ...config.local, [e.target.name]: e.target.value };
            if (type === "newVariable") config.local.variables = [e, ...config.local.variables];
            /*@ts-ignore*/
            if (type === "updateVariable") config.local.variables[i][e.target.name] = e.target.value;
            if (type === "removeVariable") config.local.variables.splice(e, 1);

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
            const pektin = await vaultApi.getKey({ endpoint, token, key: "pektin-config" });
            this.setState(({ config }) => ({ config: { ...config, pektin } }));
        }
    };

    componentDidMount = async () => {
        // handle config
        await this.initDb();
        await this.loadLocalConfig();
        this.loadAuth();
        await this.loadPektinConfig();

        // handle custom right click menu
        this.setState(({ g }) => ({ configLoaded: true, g: { ...g, changeContextMenu: this.changeContextMenu, updateLocalConfig: this.updateLocalConfig } }));
        document.addEventListener("contextmenu", this.handleContextMenu);
    };
    componentWillUnmount() {
        document.removeEventListener("contextmenu", this.handleContextMenu);
    }

    saveAuth = async (vaultAuth: t.VaultAuth) => {
        sessionStorage.setItem("vaultAuth", JSON.stringify(vaultAuth));
        this.loadAuth();
        await this.loadPektinConfig();
    };

    handleContextMenuOffClick = (e: any) => {
        e.preventDefault();
        this.setState(({ g }) => ({ g: { ...g, contextMenu: false } }));
    };

    handleContextMenu = (e: any) => {
        if (e.ctrlKey || e.shiftKey || e.altKey) return this.setState(({ g }) => ({ g: { ...g, contextMenu: false } }));
        const target = e.target;
        let action = "";
        if (target.tagName === "INPUT") action = "paste";
        if (target.tagName === "PRE") action = "code";
        if (!action.length) return this.setState(({ g }) => ({ g: { ...g, contextMenu: false } }));
        e.preventDefault();
        this.setState(({ g }) => ({ g: { ...g, contextMenu: e, cmAction: action } }));
    };
    changeContextMenu = (value: any) => this.setState(({ g }) => ({ g: { ...g, contextMenu: value } }));

    render = () => {
        if (!this.state.configLoaded) return <div></div>;

        return (
            <Router>
                {this.state.g.contextMenu ? <div onClick={this.handleContextMenuOffClick} onContextMenu={this.handleContextMenuOffClick} className="cmOverlay" /> : ""}
                <Switch>
                    <Route exact path="/auth" render={routeProps => <Auth config={this.state.config} saveAuth={this.saveAuth} {...routeProps} />} />

                    <PrivateRoute config={this.state.config} exact path="/">
                        <Base config={this.state.config}></Base>
                    </PrivateRoute>
                    <PrivateRoute exact config={this.state.config} path="/add/existing/manual">
                        <Base config={this.state.config}>
                            <AddDomain g={this.state.g} config={this.state.config} />
                        </Base>
                    </PrivateRoute>
                    <PrivateRoute exact config={this.state.config} path="/add/existing/import">
                        <Base config={this.state.config}>
                            <ImportDomain g={this.state.g} config={this.state.config} />
                        </Base>
                    </PrivateRoute>
                    <PrivateRoute config={this.state.config} exact path={`/domain/:domainName`}>
                        <Base config={this.state.config}>
                            <Domain g={this.state.g} config={this.state.config} />
                        </Base>
                    </PrivateRoute>
                    <PrivateRoute exact config={this.state.config} path="/config/">
                        <Base config={this.state.config}>
                            <ConfigView g={this.state.g} config={this.state.config} />
                        </Base>
                    </PrivateRoute>

                    <PrivateRoute config={this.state.config} path="*">
                        <Base config={this.state.config}></Base>
                    </PrivateRoute>
                </Switch>
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
