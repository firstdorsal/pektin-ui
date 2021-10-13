// @ts-nocheck
import { Add, ImportExport, Settings, ShoppingCart } from "@material-ui/icons";
import { Component } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import Health from "./Health";
import * as t from "./types";

interface BaseProps extends Partial<RouteComponentProps> {
    readonly config: t.Config;
    readonly domains: String[];
    readonly health: any;
}
interface BaseState {}

export default class Sidebar extends Component<BaseProps, BaseState> {
    render = () => {
        return (
            <aside>
                <h1>Pektin-ui</h1>
                <Health config={this.props.config} health={this.props.health} />
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
        );
    };
}
