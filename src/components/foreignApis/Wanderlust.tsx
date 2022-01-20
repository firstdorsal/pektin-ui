import { Button, Box, TextField } from "@material-ui/core";

import { ArrowRight } from "@material-ui/icons";
import { Component } from "react";
import ImportDomain from "../ImportDomain";
import * as l from "../lib";
import * as t from "../types";

interface WanderlustProps {
  readonly import: InstanceType<typeof ImportDomain>["import"];
  readonly config: t.Config;
  readonly recursorUrl: string;
  readonly recursorAuth: string;
}
interface WanderlustState {
  readonly domainName: string;
  readonly console: string;
  readonly limit: number;
  readonly toluol?: any;
}

// TODO harden wanderlust against errors

export default class Wanderlust extends Component<WanderlustProps, WanderlustState> {
  state: WanderlustState = {
    domainName: "y.gy",
    console: "",
    limit: 50,
  };
  walk = async (name: string, limit: number = 10) => {
    const parseData = (n: string[]) => {
      n = n.filter((e: string) => {
        if (e === "NSEC" || e === "RRSIG") return false;
        return true;
      });

      return n;
    };
    const ogName = l.absoluteName(name);
    let currentName = ogName;
    const allRecordsRequests: Array<Promise<any>> = [];
    const allTypes: string[] = [];
    for (let i = 0; i < limit; i++) {
      const newNameRes = await this.query({ name: currentName, type: "NSEC" });

      if (!newNameRes) break;
      if (newNameRes.answers.length > 1) {
        //newNameRes.answers = newNameRes.answers.filter((a) => a.NONOPT.atype === "NSEC");
      }
      if (!newNameRes.answers[0].NONOPT.rdata[1]) {
        console.error(newNameRes);
        break;
      }

      const newNameData = newNameRes.answers[0].NONOPT.rdata[1].split(" ");

      //if (newNameRes.typeId !== 47) break;
      /*eslint no-loop-func: "off"*/

      parseData(newNameData).forEach((coveredRecord) => {
        allTypes.push(coveredRecord);
        allRecordsRequests.push(this.query({ name: currentName, type: coveredRecord }));
      });
      this.setState({ console: currentName });

      currentName = newNameRes.answers[0].NONOPT.rdata[0];

      if (currentName === ogName && i > 0) break;
    }
    const allRecords = await Promise.all(allRecordsRequests);
    return allRecords;
  };
  handleChange = (e: any) => {
    this.setState((state) => ({ ...state, [e.target.name]: e.target.value }));
  };
  import = async () => {
    const records = await this.walk(this.state.domainName, this.state.limit);

    const displayRecords = records
      .map(l.toluolToDisplayRecord)
      .filter((r) => r !== false) as t.DisplayRecord[];

    this.props.import(displayRecords);
  };

  componentDidMount = async () => {
    this.setState({ toluol: await l.loadToluol() });
  };
  query = async (query: t.DOHQuery) => {
    const a = await l.dohQuery(
      query,
      this.state.toluol,
      this.props.recursorUrl,
      this.props.recursorAuth
    );

    return a;
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
