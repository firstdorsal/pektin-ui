import { Add, ImportExport, Settings, ShoppingCart } from "@material-ui/icons";
import { Component } from "react";
import { NavLink } from "react-router-dom";
import * as l from "./lib";
import * as t from "./types";

interface BaseProps {
    config: t.Config;
}
interface BaseState {
    domains: String[];
}

export default class Base extends Component<BaseProps, BaseState> {
    state = { domains: ["vonforell.de"] };
    componentDidMount = async () => {
        //const domains = await l.getDomains({ pektinApiAuth: this.props.config?.pektinApiAuth });
        //this.setState({ domains });
    };

    render = () => {
        return (
            <div className="container">
                <aside>
                    <h1>Pektin</h1>
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
                    {this.state.domains.length
                        ? this.state.domains.map((domain: string, i: number) => {
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
                <main>{this.props.children}</main>
            </div>
        );
    };
}
