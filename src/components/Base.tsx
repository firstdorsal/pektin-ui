import { Add, ImportExport, Settings, ShoppingCart } from "@material-ui/icons";
import { Component } from "react";
import { NavLink } from "react-router-dom";
import * as pektinApi from "./apis/pektin";
import * as t from "./types";

interface BaseProps {
    readonly config: t.Config;
}
interface BaseState {
    readonly domains: String[];
}

export default class Base extends Component<BaseProps, BaseState> {
    state = { domains: [] };
    componentDidMount = async () => {
        const domains = await pektinApi.getDomains(this.props.config);
        this.setState({ domains });
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
