import { Component } from "react";
import { Button, Grid, TextField, Container, Paper } from "@material-ui/core";
import { Ballot } from "@material-ui/icons";
import * as t from "./types";
import * as l from "./lib";
import DataDisplay from "../components/DataDisplay";
import { ContextMenu } from "./ContextMenu";
import { RouteComponentProps } from "react-router-dom";
import {
  absoluteName,
  clampTTL,
  concatDomain,
  getMainNameServers,
  getNameServersByDomain,
  NSRecord,
  PektinClient,
  PektinRRType,
} from "@pektin/client";
import App from "../App";
import { SetResponseError, SOARecord } from "@pektin/client";
import { validateDomain } from "./validators/common";

const defaultSOA: t.DisplayRecord = {
  name: "",
  rr_type: PektinRRType.SOA,
  rr_set: [l.rrTemplates.SOA.template],
};

const defaultNS: t.DisplayRecord = {
  name: "",
  rr_type: PektinRRType.NS,
  rr_set: [l.rrTemplates.NS.template],
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
  readonly nameserver: t.DisplayRecord;
}

export default class AddDomain extends Component<AddDomainProps, AddDomainState> {
  state: AddDomainState = {
    record: defaultSOA,
    apiError: "",
    nameserver: defaultNS,
  };

  componentDidMount = () => {
    if (this.props.client.pektinConfig) {
      const config = this.props.client.pektinConfig;
      const mainNS = getMainNameServers(config);
      this.setState(({ record, nameserver }) => {
        /*@ts-ignore*/
        record.rr_set[0].mname = absoluteName(concatDomain(mainNS[0].domain, mainNS[0].subDomain));
        /*@ts-ignore*/
        record.rr_set[0].rname = absoluteName(concatDomain(mainNS[0].domain, `hostmaster`));
        nameserver = {
          name: "",
          rr_type: PektinRRType.NS,
          rr_set: getNameServersByDomain(config, mainNS[0].domain).map((ns) => {
            return { ttl: 60, value: absoluteName(concatDomain(ns.domain, ns.subDomain)) };
          }),
        };
        console.log(nameserver);

        return { record, nameserver };
      });
    }
  };

  handleChange = (e: any, mode: string = "default") => {
    const n = mode === "default" ? e?.target?.name : e.name;
    const v = mode === "default" ? e?.target?.value : e.value;
    if (!n || !v === undefined) return;

    this.setState(({ record, nameserver }) => {
      if (record.rr_type === PektinRRType.SOA) {
        if (n === "ttl") {
          record.rr_set[0].ttl = clampTTL(v);
        } else if (n === "mname") {
          record.rr_set[0].mname = v;
        } else if (n === "rname") {
          record.rr_set[0].rname = v;
        } else if (n === "name") {
          record.name = v;
          nameserver.name = v;
        }
      }
      return { record };
    });
  };
  handleNsChange = (e: any, i: number) => {
    const n = e?.target?.name;
    const v = e?.target?.value;
    this.setState(({ nameserver }) => {
      if (nameserver.rr_type === PektinRRType.NS) {
        if (n === `ttl`) {
          nameserver.rr_set[i].ttl = clampTTL(v);
        } else {
          nameserver.rr_set[i].value = v;
        }
      }
      return { nameserver };
    });
  };

  cmClick = (target: any, action: string, value: string | number) => {
    if (action === "paste") {
      this.handleChange({ name: target.name, value }, action);
    }
  };

  //TODO add better validation, disabled button etc.
  addNameserver = () => {
    return (
      <div>
        <div className="tfName">Nameservers</div>
        {(() => {
          if (this.props.client.pektinConfig) {
            return (
              <ul style={{ width: "100%", display: "block" }}>
                {(this.state.nameserver.rr_set as NSRecord[]).map((rr, i) => {
                  return (
                    <li key={i} style={{ width: "100%", display: "block" }}>
                      <TextField
                        className={validateDomain(this.props.config, rr.value)?.type}
                        onChange={(e) => this.handleNsChange(e, i)}
                        name="value"
                        style={{ display: "inline-block", width: "75%", marginRight: "5%" }}
                        variant="standard"
                        value={rr.value}
                        placeholder="ns1.example.com"
                        helperText={validateDomain(this.props.config, rr.value)?.message || " "}
                      />
                      <TextField
                        type="number"
                        onChange={(e) => this.handleNsChange(e, i)}
                        name="ttl"
                        style={{ display: "inline-block", width: "20%" }}
                        variant="standard"
                        value={rr.ttl}
                      />
                    </li>
                  );
                })}
              </ul>
            );
          }
        })()}
      </div>
    );
  };

  render = () => {
    return (
      <Container style={{ marginTop: "20px" }} className="AddDomain">
        <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />
        <Grid container spacing={3} style={{ maxWidth: "100%" }}>
          <Grid item xs={4}>
            <Paper elevation={3}>
              <Container className="form" style={{ paddingBottom: "20px" }}>
                <div className="cardHead">
                  <Ballot />
                  <span className="caps label">data</span>
                </div>
                <div className={validateDomain(this.props.config, this.state.record.name)?.type}>
                  <br />
                  <div className="tfName">name</div>
                  <div className="tfHelper">Name of the domain you want to add</div>
                  <TextField
                    className="soaField"
                    variant="standard"
                    onChange={this.handleChange}
                    value={this.state.record.name}
                    name="name"
                    helperText={
                      validateDomain(this.props.config, this.state.record.name)?.message || " "
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
                    className="soaField"
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
                    className="soaField"
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
                    className="soaField"
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
                <div style={{ margin: "30px 0px" }}>{this.addNameserver()}</div>

                <div>
                  <Button
                    color="primary"
                    variant="contained"
                    onClick={async () => {
                      const setRes = await this.props.client.set(
                        [
                          l.toPektinApiRecord(this.props.config, this.state.record),
                          l.toPektinApiRecord(this.props.config, this.state.nameserver),
                        ],
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
                        this.props.history.push(`/domain/${absoluteName(this.state.record.name)}`);
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
              style={{ marginTop: "15px", maxHeight: "75vh" }}
              config={this.props.config}
              data={[this.state.record, this.state.nameserver]}
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
