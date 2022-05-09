import { Button, Box, TextField } from "@material-ui/core";

import { ArrowRight } from "@material-ui/icons";
import { ApiRecord } from "@pektin/client";
import { Component } from "react";
import ImportDomain from "../ImportDomain";
import * as l from "../lib";
import * as t from "../types";
import { Toluol } from "@pektin/client";

interface WanderlustProps {
  readonly import: InstanceType<typeof ImportDomain>["import"];
  readonly config: t.Config;
  readonly tntUrl: string;
  readonly tntAuth: string;
}
interface WanderlustState {
  readonly domainName: string;
  readonly console: string;
  readonly limit: number;
  readonly toluol?: any;
}

export default class Wanderlust extends Component<WanderlustProps, WanderlustState> {
  state: WanderlustState = {
    domainName: "y.gy",
    console: "",
    limit: 50,
  };

  handleChange = (e: any) => {
    this.setState((state) => ({ ...state, [e.target.name]: e.target.value }));
  };
  import = async () => {
    const t = new Toluol(this.props.tntUrl, this.props.tntAuth, this.state.toluol, this);
    const walked = await t.walk(this.state.domainName, this.state.limit);
    if (!walked) {
      //TODO display this error
      return;
    }
    const records = walked
      .map(t.toluolToApiRecord)
      .filter((r) => typeof r === "object")
      .map((r) => l.toUiRecord(this.props.config, r as ApiRecord));

    this.props.import(records);
  };

  componentDidMount = async () => {
    this.setState({ toluol: await l.loadToluol() });
  };

  render = () => {
    return (
      <Box style={{ position: "relative" }}>
        <TextField
          InputLabelProps={{
            shrink: true,
          }}
          style={{ paddingRight: "20px" }}
          helperText="The domain you want to import"
          placeholder="example.com."
          value={this.state.domainName}
          onChange={this.handleChange}
          name="domainName"
          label="Domain Name"
          variant="standard"
        />

        <TextField
          InputLabelProps={{
            shrink: true,
          }}
          helperText="Maximum steps to take"
          placeholder="100"
          value={this.state.limit}
          onChange={this.handleChange}
          name="limit"
          label="Limit"
          variant="standard"
        />
        <Button
          disabled={this.state.domainName.length ? false : true}
          onClick={this.import}
          style={{ position: "absolute", bottom: "10px", right: "10px" }}
          variant="contained"
          color="primary"
          endIcon={<ArrowRight />}
        >
          Import
        </Button>
        <div>{this.state.console}</div>
      </Box>
    );
  };
}
