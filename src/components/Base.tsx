import { Component } from "react";
import { Link } from "react-router-dom";
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
        const domains = await l.getDomains({ pektinApiAuth: this.props.config?.pektinApiAuth });
        //this.setState({ domains });
    };

    render = () => {
        return (
            <div className="container">
                <aside>
                    <h1>Pektin</h1>
                    <br />
                    <div>
                        <div>
                            <Link to="/add-domain">Add Domain</Link>
                        </div>
                        {this.state.domains.length
                            ? this.state.domains.map((domain: string, i: number) => {
                                  return (
                                      <div key={i}>
                                          <Link to={`/domain/${domain}`}>{domain}</Link>
                                      </div>
                                  );
                              })
                            : ""}
                    </div>
                </aside>
                <main>{this.props.children}</main>
            </div>
        );
    };
}
