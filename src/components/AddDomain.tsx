import { Component } from "react";
import { Button, Grid, TextField, Container, Paper } from "@material-ui/core";
import { Ballot } from "@material-ui/icons";
import * as t from "./types";
import * as l from "./lib";
import DataDisplay from "../components/DataDisplay";
import { ContextMenu } from "./ContextMenu";
import { cloneDeep } from "lodash";
import { RouteComponentProps } from "react-router-dom";

const defaultSOA: t.DisplayRecord = {
  name: "",
  type: "SOA",
  values: [l.rrTemplates.SOA.template],
};

interface AddDomainProps extends RouteComponentProps {
  readonly config: t.Config;
  readonly g: t.Glob;
  readonly loadDomains: Function;
}

interface AddDomainState {
  readonly record: t.DisplayRecord;
  readonly error: string;
}

export default class AddDomain extends Component<AddDomainProps, AddDomainState> {
  state: AddDomainState = {
    record: defaultSOA,
    error: "",
  };

  handleChange = (e: any, mode: string = "default") => {
    const n = mode === "default" ? e?.target?.name : e.name;
    const v = mode === "default" ? e?.target?.value : e.value;
    if (!n || !v === undefined) return;

    this.setState(({ record }) => {
      record = cloneDeep(record);
      if (n === "ttl") record.values[0].ttl = parseInt(v);
      /*@ts-ignore*/
      if (n === "mname") record.values[0].mname = v;
      /*@ts-ignore*/
      if (n === "rname") record.values[0].rname = v;
      if (n === "name") record.name = v;
      return { record };
    });
  };
  cmClick = (target: any, action: string, value: string | number) => {
    if (action === "paste") {
      this.handleChange({ name: target.name, value }, action);
    }
  };

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
                    /*@ts-ignore*/
                    l.rrTemplates["SOA"]?.fields.mname?.validate(
                      this.props.config,
                      /*@ts-ignore*/
                      this.state.record.values[0].mname
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
                    /*@ts-ignore*/
                    value={this.state.record.values[0].mname}
                    helperText={
                      l.rrTemplates["SOA"]?.fields.mname?.validate(
                        this.props.config,
                        /*@ts-ignore*/
                        this.state.record.values[0].mname
                      )?.message || " "
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </div>

                <div
                  className={
                    /*@ts-ignore*/
                    l.rrTemplates["SOA"]?.fields.rname?.validate(
                      this.props.config,
                      /*@ts-ignore*/
                      this.state.record.values[0].rname
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
                    /*@ts-ignore*/
                    value={this.state.record.values[0].rname}
                    helperText={
                      l.rrTemplates["SOA"]?.fields.rname?.validate(
                        this.props.config,
                        /*@ts-ignore*/
                        this.state.record.values[0].rname
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
                    value={this.state.record.values[0].ttl}
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
                      const req = await l.addDomain(this.props.config, this.state.record);
                      if (req.error) this.setState({ error: req.message });
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
                <div style={{ color: "var(--error)" }}></div>
              </Container>
            </Paper>
          </Grid>
          <Grid container item xs={8}>
            <DataDisplay
              style={{ marginTop: "15px" }}
              config={this.props.config}
              data={this.state.record}
            ></DataDisplay>
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
