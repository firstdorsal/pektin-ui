// @ts-nocheck
import { Add, ImportExport, Settings, ShoppingCart } from "@material-ui/icons";
import { Component } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import Health from "./Health";
import PieSpinner from "./small/PieSpinner";
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
        <h1>Pektin</h1>
        <Health config={this.props.config} health={this.props.health} />
        <br />
        <br />
        <PieSpinner></PieSpinner>
        <h2>Add Existing Domain</h2>
        <NavLink exact className="link" activeClassName="navActive" to="/add/existing/manual">
          <Add />
          <span className="linkText">Manually</span>
        </NavLink>

        <NavLink exact className="link" activeClassName="navActive" to="/add/existing/import">
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
        <ul
          style={{
            overflowX: "hidden",
            overflowY: "scroll",
            maxHeight: "calc(100% - 410px)",
          }}
        >
          {this.props.domains.length
            ? this.props.domains.map((domain: string, i: number) => {
                return (
                  <li key={i}>
                    <NavLink
                      activeClassName="navActive"
                      className="link"
                      exact
                      to={`/domain/${domain}`}
                    >
                      {domain}
                    </NavLink>
                  </li>
                );
              })
            : ""}
        </ul>

        <NavLink
          style={{ background: "var(--bg-color-dark)" }}
          exact
          className="link config"
          activeClassName="navActive"
          to="/settings"
        >
          <Settings />
          <span className="linkText">Settings</span>
        </NavLink>
      </aside>
    );
  };
}
