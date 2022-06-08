import { Container, Fab, IconButton, MenuItem, Paper, Select, TextField } from "@material-ui/core";
import { Add, Delete, Remove } from "@material-ui/icons";
import { PektinClient } from "@pektin/client";
import { PureComponent } from "react";
import { Config, Glob } from "../types";

const supportedApis = [{ id: "gandi", name: "Gandi" }];

interface ForeignApiKeysProps {
  g: Glob;
  config: Config;
  client: PektinClient;
}

interface ApiKeys {
  id: string;
  username: string;
  value: string;
}

interface ForeignApiKeysState {
  apiKeys: ApiKeys[];
}
export default class ForeignApiKeys extends PureComponent<
  ForeignApiKeysProps,
  ForeignApiKeysState
> {
  constructor(props: ForeignApiKeysProps) {
    super(props);
    this.state = {
      apiKeys: [
        {
          id: "gandi",
          username: "test",
          value: "abcdef",
        },
        {
          id: "gandi",
          username: "test",
          value: "abcdef",
        },
      ],
    };
  }

  render = () => {
    return (
      <div className="ForeignApiKeys">
        <h1>Foreign API Keys</h1>
        <Container>
          <Paper>
            <Fab color="primary" size="small" aria-label="add">
              <Add />
            </Fab>
            {this.state.apiKeys.map((apiKey) => {
              return (
                <div>
                  <Select value={apiKey.id}>
                    {supportedApis.map((sa) => {
                      return <MenuItem value={sa.id}>{sa.name}</MenuItem>;
                    })}
                  </Select>
                  <TextField value={apiKey.username} label="Username" />
                  <TextField value={apiKey.value} label="Key" />
                  <IconButton>
                    <Delete />
                  </IconButton>
                </div>
              );
            })}
          </Paper>
        </Container>
      </div>
    );
  };
}
