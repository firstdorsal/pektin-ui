import { Client } from "@pektin/client";
import { Component } from "react";

interface ClientsListProps {
  clients: Client[];
  me: string;
}
interface ClientsListState {}
export default class ClientsList extends Component<ClientsListProps, ClientsListState> {
  render = () => {
    return (
      <div className="ClientsList">
        <ul>
          {this.props.clients.map((c) => {
            const me = c.name === this.props.me;
            //const meStyle = c.name === this.props.me ? { color: "var(--f2)" } : {};

            return (
              <li title={me ? "This is you!" : ""} key={c.name}>
                <span>{c.name}</span>
                <span>{c.confidant}</span>
                <span>{c.manager}</span>
                <span>Edit</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
}
