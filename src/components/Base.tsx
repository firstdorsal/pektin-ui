// @ts-nocheck
import { Add, ImportExport, Settings, ShoppingCart } from "@material-ui/icons";
import React, { Component } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import * as t from "./types";
import { SiVault } from "react-icons/si";

interface BaseProps extends Partial<RouteComponentProps> {
    readonly config: t.Config;
    readonly domains: String[];
    readonly health: any;
}
interface BaseState {}

const apps = [{ name: "Vault", icon: title => <SiVault title={title} />, id: "vault" }];

export default class Base extends Component<BaseProps, BaseState> {
    render = () => {
        return (
            <div className="container">
                <aside>
                    <div
                        style={{
                            margin: "0px",
                            paddingLeft: "50px",
                            paddingRight: "50px",
                            paddingTop: "20px",
                            marginBottom: "-10px",
                            textAlign: "center"
                        }}
                    >
                        {apps.map((app, i) => {
                            let color = "var(--f1)";
                            let message = "";
                            if (this.props.health && this.props.health[app.id]) {
                                color =
                                    this.props.health[app.id].status === "ok"
                                        ? "var(--ok)"
                                        : "var(--error)";
                                message = this.props.health[app.id].message;
                            }
                            return (
                                <span style={{ color, display: "inline-block" }}>
                                    {app.icon(message)}
                                </span>
                            );
                        })}
                    </div>
                    <h1>Pektin-ui</h1>
                    <br />
                    <br />

                    <h2>Add Existing Domain</h2>
                    <NavLink
                        exact
                        className="link"
                        activeClassName="navActive"
                        to="/add/existing/manual"
                    >
                        <Add />
                        <span className="linkText">Manually</span>
                    </NavLink>

                    <NavLink
                        exact
                        className="link"
                        activeClassName="navActive"
                        to="/add/existing/import"
                    >
                        <ImportExport />
                        <span className="linkText">Import</span>
                    </NavLink>

                    <br />
                    <h2>Create New</h2>
                    <NavLink className="link" activeClassName="navActive" to="/add/buy">
                        <ShoppingCart />
                        <span className="linkText">Buy</span>
                    </NavLink>
                    <br />
                    <h2>Your Domains</h2>
                    {this.props.domains.length
                        ? this.props.domains.map((domain: string, i: number) => {
                              return (
                                  <NavLink
                                      activeClassName="navActive"
                                      className="link"
                                      key={i}
                                      exact
                                      to={`/domain/${domain}`}
                                  >
                                      {domain}
                                  </NavLink>
                              );
                          })
                        : ""}
                    <NavLink exact className="link config" activeClassName="navActive" to="/config">
                        <Settings />
                        <span className="linkText">Configuration</span>
                    </NavLink>
                </aside>
                <main>
                    {this.props.children
                        ? React.cloneElement(this.props.children, { ...this.props })
                        : ""}
                </main>
            </div>
        );
    };
}
