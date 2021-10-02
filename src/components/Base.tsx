// @ts-nocheck
import { Add, ImportExport, Settings, ShoppingCart } from "@material-ui/icons";
import React, { Component } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import * as t from "./types";

interface BaseProps extends Partial<RouteComponentProps> {
    readonly config: t.Config;
    readonly domains: String[];
}
interface BaseState {}

export default class Base extends Component<BaseProps, BaseState> {
    render = () => {
        return (
            <div className="container">
                <aside>
                    <h1>Pektin-ui</h1>
                    <br />
                    <br />

                    <h2>Add Existing Domain</h2>
                    <NavLink className="link" activeClassName="navActive" to="/add/existing/manual">
                        <Add />
                        <span className="linkText">Manually</span>
                    </NavLink>

                    <NavLink className="link" activeClassName="navActive" to="/add/existing/import">
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
                                  <NavLink className="link" key={i} to={`/domain/${domain}`}>
                                      {domain}
                                  </NavLink>
                              );
                          })
                        : ""}
                    <NavLink className="link config" activeClassName="navActive" to="/config">
                        <Settings />
                        <span className="linkText">Configuration</span>
                    </NavLink>
                </aside>
                <main>{this.props.children ? React.cloneElement(this.props.children, { ...this.props }) : ""}</main>
            </div>
        );
    };
}
