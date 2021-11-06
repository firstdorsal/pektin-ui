import { Button, Box, TextField } from "@material-ui/core";

import { ArrowRight } from "@material-ui/icons";
import { Component } from "react";
import * as l from "../lib";
import * as t from "../types";

interface WanderlustProps {
  readonly import: any;
  readonly config: t.Config;
}
interface WanderlustState {
  readonly domainName: string;
  readonly console: string;
  readonly limit: number;
  readonly toluol?: any;
}

export default class Wanderlust extends Component<WanderlustProps, WanderlustState> {
  state: WanderlustState = {
    domainName: "",
    console: "",
    limit: 500,
  };
  walk = async (name: string, limit: number = 100) => {
    const parseData = (n: string[]) => {
      n = n.splice(1);
      n = n.filter((e: string) => {
        if (!(e === "NSEC" || e === "RRSIG")) return true;
        return false;
      });
      return n;
    };
    const ogName = l.absoluteName(name);
    let currentName = ogName;
    const allRecordsRequests: Array<Promise<any>> = [];
    const allTypes: string[] = [];
    for (let i = 0; i < limit; i++) {
      const newNameRes = await this.query({ name: currentName, type: "NSEC" });

      const newNameData = newNameRes.values[0].data.split(" ");

      if (newNameRes.typeId !== 47) break;
      /*eslint no-loop-func: "off"*/

      parseData(newNameData).forEach((coveredRecord) => {
        allTypes.push(coveredRecord);
        allRecordsRequests.push(this.query({ name: currentName, type: coveredRecord }));
      });
      this.setState({ console: currentName });
      currentName = newNameData[0];
      if (newNameData[0] === ogName && i > 0) break;
    }
    const allRecords = await Promise.all(allRecordsRequests);
    return allRecords.map((record: any) => {
      if (record.type === "TYPE61") record.type = "OPENPGPKEY";
      return record;
    });
  };
  handleChange = (e: any) => {
    this.setState((state) => ({ ...state, [e.target.name]: e.target.value }));
  };
  import = async () => {
    const records = await this.walk(this.state.domainName, this.state.limit);

    console.log(records);

    //this.props.import(records.map(simpleDnsRecordToDisplayRecord).filter(l.isSupportedRecord));
  };

  componentDidMount = async () => {
    this.setState({ toluol: await l.loadToluol() });
    console.log(await this.query({ name: "y.gy", type: "NSEC" }));
  };
  query = async (query: t.DOHQuery) => {
    const a = await l.dohQuery(query, this.props.config, this.state.toluol, "post");

    return l.toluolBodge(a) as any;
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
          helperText="Maximum of steps to take"
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
