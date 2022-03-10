import { Box, Container, Grid, Paper } from "@material-ui/core";
import { PektinClient, getPektinClients, Client } from "@pektin/client";
import { Component } from "react";
import { Config, Glob } from "../types";
import ClientsList from "./Clients/ClientsList";

interface ClientsProps {
  g: Glob;
  config: Config;
  client: PektinClient;
}
interface ClientsState {
  readonly clients: Client[] | null;
}

export default class Clients extends Component<ClientsProps, ClientsState> {
  state = {
    clients: null,
  };
  componentDidMount = async () => {
    if (!this.props.client.managerToken) {
      await this.props.client.getVaultToken("manager");
    }
    if (!this.props.client.vaultEndpoint || !this.props.client.managerToken)
      throw Error("Couldnt get client list");
    const clients = await getPektinClients(
      this.props.client.vaultEndpoint,
      this.props.client.managerToken
    );
    this.setState({ clients });
  };
  render = () => {
    if (!this.state.clients) return <div></div>;
    return (
      <div className="Clients">
        <Grid container style={{ margin: "20px" }}>
          <Grid item xs={4}>
            <Paper elevation={2}>
              <Container style={{ padding: "10px 0px" }}>
                <ClientsList me={this.props.client.username} clients={this.state.clients} />
              </Container>
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  };
}
