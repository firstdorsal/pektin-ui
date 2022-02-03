import { Component } from "react";
import { Button, Grid, TextField, Container, Paper } from "@material-ui/core";
import { Ballot } from "@material-ui/icons";
import * as t from "./types";
import * as l from "./lib";
import DataDisplay from "../components/DataDisplay";
import { ContextMenu } from "./ContextMenu";
import { cloneDeep } from "lodash";
import { RouteComponentProps } from "react-router-dom";
import { PektinClient, PektinRRType } from "@pektin/client";
import App from "../App";
import { SetResponseError, SOARecord } from "@pektin/client";

const defaultSOA: t.DisplayRecord = {
  name: "",
  rr_type: PektinRRType.SOA,
  rr_set: [l.rrTemplates.SOA.template],
};

// TODO add react strict mode

interface AddDomainProps extends RouteComponentProps {
  readonly config: t.Config;
  readonly g: t.Glob;
  readonly loadDomains: InstanceType<typeof App>["loadDomains"];
  readonly client: PektinClient;
}

interface AddDomainState {
  readonly record: t.DisplayRecord;
  readonly apiError: string;
}

export default class AddDomain extends Component<AddDomainProps, AddDomainState> {
  state: AddDomainState = {
    record: defaultSOA,
    apiError: "",
  };

  handleChange = (e: any, mode: string = "default") => {
    const n = mode === "default" ? e?.target?.name : e.name;
    const v = mode === "default" ? e?.target?.value : e.value;
    if (!n || !v === undefined) return;

    this.setState(({ record }) => {
      if (record.rr_type === "SOA") {
        record = cloneDeep(record);
        if (n === "ttl") record.rr_set[0].ttl = parseInt(v);
        if (n === "mname") record.rr_set[0].mname = v;
        if (n === "rname") record.rr_set[0].rname = v;
        if (n === "name") record.name = v;
      }
      return { record };
    });
  };
  cmClick = (target: any, action: string, value: string | number) => {
    if (action === "paste") {
      this.handleChange({ name: target.name, value }, action);
    }
  };

  //TODO add better validation, disabled button etc.

  render = () => {
    return (
      <Container style={{ marginTop: "20px" }}>
        <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />
        <Grid container spacing={3} style={{ maxWidth: "100%" }}>
          <Grid item xs={4}>
            <Paper elevation={3}>
              <Container className="form" style={{ paddingBottom: "20px" }}>
                <div className="cardHead">
                  <Ballot />
                  <span className="caps label">data</span>
                </div>
                <div className={l.validateDomain(this.props.config, this.state.record.name)?.type}>
                  <br />
                  <div className="tfName">name</div>
                  <div className="tfHelper">Name of the domain you want to add</div>
                  <TextField
                    variant="standard"
                    onChange={this.handleChange}
                    value={this.state.record.name}
                    name="name"
                    helperText={
                      l.validateDomain(this.props.config, this.state.record.name)?.message || " "
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    placeholder="example.com"
                  />
                </div>

                <div
                  className={
                    l.rrTemplates["SOA"]?.fields.mname?.validate(
                      this.props.config,
                      (this.state.record.rr_set[0] as SOARecord).mname
                    )?.type
                  }
                >
                  <div className="tfName">mname</div>
                  <div className="tfHelper">{l.rrTemplates["SOA"]?.fields.mname.helperText}</div>
                  <TextField
                    variant="standard"
                    onChange={this.handleChange}
                    name="mname"
                    placeholder="ns1.example.com"
                    value={(this.state.record.rr_set[0] as SOARecord).mname}
                    helperText={
                      l.rrTemplates["SOA"]?.fields.mname?.validate(
                        this.props.config,
                        (this.state.record.rr_set[0] as SOARecord).mname
                      )?.message || " "
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </div>

                <div
                  className={
                    l.rrTemplates["SOA"]?.fields.rname?.validate(
                      this.props.config,
                      (this.state.record.rr_set[0] as SOARecord).rname
                    )?.type
                  }
                >
                  <div className="tfName">rname</div>
                  <div className="tfHelper">{l.rrTemplates["SOA"]?.fields.rname.helperText}</div>
                  <TextField
                    variant="standard"
                    onChange={this.handleChange}
                    name="rname"
                    placeholder="hostmaster.example.com"
                    value={(this.state.record.rr_set[0] as SOARecord).rname}
                    helperText={
                      l.rrTemplates["SOA"]?.fields.rname?.validate(
                        this.props.config,
                        (this.state.record.rr_set[0] as SOARecord).rname
                      )?.message || " "
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </div>
                <div>
                  <div className="tfName">ttl</div>
                  <div className="tfHelper">Time to cache the dns response</div>
                  <TextField
                    variant="standard"
                    type="number"
                    onChange={this.handleChange}
                    name="ttl"
                    value={this.state.record.rr_set[0].ttl}
                    inputProps={{
                      min: 0,
                    }}
                  />
                </div>
                <div>
                  <Button
                    color="primary"
                    variant="contained"
                    onClick={async () => {
                      const setRes = await this.props.client.set(
                        [l.toPektinApiRecord(this.props.config, this.state.record)],
                        false
                      );
                      if (setRes.type === "error" && (setRes as SetResponseError).data) {
                        return this.setState({
                          apiError: setRes.message + "\n" + (setRes as SetResponseError).data[0],
                        });
                      }
                      // TODO handle unauthorized and internal
                      await this.props.loadDomains();
                      if (this.props.history)
                        this.props.history.push(
                          `/domain/${l.absoluteName(this.state.record.name)}`
                        );
                    }}
                  >
                    Add Domain
                  </Button>
                </div>
                <div style={{ color: "var(--error)" }}>{this.state.apiError}</div>
              </Container>
            </Paper>
          </Grid>
          <Grid container item xs={8}>
            <DataDisplay
              style={{ marginTop: "15px" }}
              config={this.props.config}
              data={this.state.record}
              client={this.props.client}
            />
          </Grid>
        </Grid>
      </Container>
    );
  };
}
/*
<div>
    <Switch defaultChecked color="primary" value={this.state.dnssec} name="dnssec" onChange={this.handleChange} />
    DNSSEC
</div>
*/
