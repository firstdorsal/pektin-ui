import { Component } from "react";
import { FaArchway, FaDatabase, FaServer } from "react-icons/fa";
import { SiVault } from "react-icons/si";
import * as t from "./types";

interface HealthProps {
    readonly health: any;
    readonly config: t.Config;
}
interface HealthState {}
export default class Health extends Component<HealthProps, HealthState> {
    render = () => {
        const apps = [
            {
                name: "Vault",
                url: this.props.config.vaultAuth.endpoint,
                icon: (title: string) => <SiVault title={title} />,
                id: "vault"
            },
            {
                name: "Pektin API",
                url: "",
                icon: (title: string) => <FaArchway title={title} />,
                id: "api"
            },
            {
                name: "Redis",
                url: "",
                icon: (title: string) => <FaDatabase title={title} />,
                id: "redis"
            },
            {
                name: "Server",
                url: "",
                icon: (title: string) => <FaServer title={title} />,
                id: "server"
            }
        ];

        return (
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
                        <a
                            target="blank"
                            key={app.id}
                            href={app.url}
                            style={{ color, display: "inline-block", margin: "0px 5px" }}
                        >
                            {app.icon(
                                `${app.name}: ${message.length ? message : "No Information"}`
                            )}
                        </a>
                    );
                })}
            </div>
        );
    };
}
