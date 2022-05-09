import { Component } from "react";
import { Button, Grid, TextField, Container, Paper, Checkbox, IconButton } from "@material-ui/core";
import { AddCircle, Ballot, RemoveCircle } from "@material-ui/icons";
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
import HelpPopper from "./HelpPopper";
import { cloneDeep } from "lodash";

const defaultSOA: t.DisplayRecord = {
  name: "",
  ttl: 60,
  rr_type: PektinRRType.SOA,
  rr_set: [l.rrTemplates.SOA.template],
};

const defaultNS: t.DisplayRecord = {
  name: "",
  ttl: 60,
  rr_type: PektinRRType.NS,
  rr_set: [l.rrTemplates.NS.template],
};

const defaultCAA: t.DisplayRecordCAA = {
  name: "",
  ttl: 60,
  rr_type: PektinRRType.CAA,
  rr_set: [l.rrTemplates.CAA.template, { ...l.rrTemplates.CAA.template, tag: "issuewild" }],
};

// TODO add react strict mode

interface AddDomainProps extends RouteComponentProps {
  readonly config: t.Config;
  readonly g: t.Glob;
  readonly loadDomains: InstanceType<typeof App>["loadDomains"];
  readonly client: PektinClient;
}

interface AddDomainState {
  readonly soaRecord: t.DisplayRecord;
  readonly nsRecord: t.DisplayRecord;
  readonly caaRecord: t.DisplayRecordCAA;
  readonly apiError: string;
  readonly useNameserver: boolean;
  readonly useCaa: boolean;
  readonly caaIssue: boolean;
  readonly caaIssueWild: boolean;
}

export default class AddDomain extends Component<AddDomainProps, AddDomainState> {
  state: AddDomainState = {
    soaRecord: defaultSOA,
    nsRecord: defaultNS,
    caaRecord: defaultCAA,
    apiError: "",
    useNameserver: true,
    useCaa: true,
    caaIssue: true,
    caaIssueWild: true,
  };

  componentDidMount = () => {
    if (this.props?.client?.pektinConfig) {
      const config = this.props.client.pektinConfig;
      const mainNS = getMainNameServers(config);
      this.setState(({ soaRecord: record, nsRecord: nameserver }) => {
        /*@ts-ignore*/
        record.rr_set[0].mname = absoluteName(concatDomain(mainNS[0].domain, mainNS[0].subDomain));
        /*@ts-ignore*/
        record.rr_set[0].rname = absoluteName(concatDomain(mainNS[0].domain, `hostmaster`));
        nameserver = {
          name: "",
          ttl: 60,
          rr_type: PektinRRType.NS,
          rr_set: getNameServersByDomain(config, mainNS[0].domain).map((ns) => {
            return { value: absoluteName(concatDomain(ns.domain, ns.subDomain)) };
          }),
        };

        return { soaRecord: record, nsRecord: nameserver };
      });
    }
  };

  addDomain = async () => {
    await this.props.client.createPektinSigner(this.state.soaRecord.name);

    const setRes = await this.props.client.set(
      [
        this.state.soaRecord,
        ...(this.state.useNameserver ? [this.state.nsRecord] : []),
        ...(this.state.useCaa ? [this.state.caaRecord] : []),
      ].map((r) => l.toPektinApiRecord(this.props.config, r)),
      false
    );
    if (setRes.type === "error" && (setRes as SetResponseError).data) {
      return this.setState({
        apiError: setRes.message + "\n" + (setRes as SetResponseError).data[0],
      });
    }
    await this.props.loadDomains();
    if (this.props.history)
      this.props.history.push(`/domain/${absoluteName(this.state.soaRecord.name)}/`);
  };

  handleSoaChange = (e: any, mode: string = "default") => {
    const n = mode === "default" ? e?.target?.name : e.name;
    const v = mode === "default" ? e?.target?.value : e.value;
    if (!n || !v === undefined) return;

    this.setState(({ soaRecord, nsRecord, caaRecord }) => {
      if (soaRecord.rr_type === PektinRRType.SOA) {
        if (n === "ttl") {
          soaRecord.ttl = clampTTL(v);
        } else if (n === "mname") {
          soaRecord.rr_set[0].mname = v;
        } else if (n === "rname") {
          soaRecord.rr_set[0].rname = v;
        } else if (n === "name") {
          soaRecord.name = v;
          nsRecord.name = v;
          caaRecord.name = v;
        }
      }
      return { soaRecord, nsRecord, caaRecord };
    });
  };
  handleNsChange = (e: any, i: number) => {
    const n = e?.target?.name;
    const v = e?.target?.value;
    this.setState(({ nsRecord: nameserver }) => {
      if (nameserver.rr_type === PektinRRType.NS) {
        if (n === `ttl`) {
          nameserver.ttl = clampTTL(v);
        } else {
          nameserver.rr_set[i].value = v;
        }
      }
      return { nsRecord: nameserver };
    });
  };
  removeNS = (i: number) => {
    this.setState(({ nsRecord: nameserver }) => {
      if (nameserver.rr_type === PektinRRType.NS) {
        nameserver.rr_set = nameserver.rr_set.filter((e: any, ii: number) => i !== ii);
      }
      return { nsRecord: nameserver };
    });
  };
  addNS = () => {
    this.setState(({ nsRecord: nameserver }) => {
      if (nameserver.rr_type === PektinRRType.NS) {
        nameserver.rr_set = [{ value: "" }, ...nameserver.rr_set];
      }
      return { nsRecord: nameserver };
    });
  };

  cmClick = (target: any, action: string, value: string | number) => {
    if (action === "paste") {
      this.handleSoaChange({ name: target.name, value }, action);
    }
  };

  //TODO add better validation, disabled button etc.
  nameserverPanel = () => {
    const d = !this.state.useNameserver;
    const a = "Append nameservers when creating SOA";
    return (
      <div style={{ position: "relative" }}>
        <div style={{ paddingBottom: "10px" }}>
          <Checkbox
            checked={this.state.useNameserver}
            onChange={() => {
              this.setState(({ useNameserver }) => ({ useNameserver: !useNameserver }));
            }}
            title={a}
            size="small"
            style={{ padding: "0px", paddingRight: "5px" }}
          />
          <div className="tfName" style={{ display: "inline-block" }} title={a}>
            Nameservers
          </div>
          <IconButton
            style={{ position: "absolute", right: "0px", top: "-10px" }}
            onClick={() => this.addNS()}
          >
            <AddCircle />
          </IconButton>
        </div>
        <div className={d ? "disabled" : ""}>
          {(() => {
            if (this.props?.client?.pektinConfig) {
              return (
                <ul style={{ width: "100%", display: "block" }}>
                  {(this.state.nsRecord.rr_set as NSRecord[]).map((rr, i) => {
                    return (
                      <li key={i} style={{ width: "100%", display: "block" }}>
                        <TextField
                          className={validateDomain(this.props.config, rr.value)?.type}
                          onChange={(e) => this.handleNsChange(e, i)}
                          name="value"
                          style={{ display: "inline-block", width: "62%", marginRight: "5%" }}
                          variant="standard"
                          value={rr.value}
                          placeholder="ns1.example.com"
                          helperText={validateDomain(this.props.config, rr.value)?.message || " "}
                        />
                        <TextField
                          type="number"
                          onChange={(e) => this.handleNsChange(e, i)}
                          name="ttl"
                          style={{ display: "inline-block", width: "18%", marginRight: "2%" }}
                          variant="standard"
                          value={this.state.nsRecord.ttl}
                        />
                        <IconButton
                          onClick={() => this.removeNS(i)}
                          style={{ position: "absolute", right: "0px" }}
                        >
                          <RemoveCircle />
                        </IconButton>
                      </li>
                    );
                  })}
                </ul>
              );
            }
          })()}
        </div>
      </div>
    );
  };

  handleCaaChange = (e: any) => {
    const n = e?.target?.name;
    const v = e?.target?.value;
    this.setState(({ caaRecord }) => {
      if (caaRecord.rr_type === PektinRRType.CAA) {
        caaRecord.rr_set = caaRecord.rr_set.map((rr) => {
          if (n === `ttl`) {
            caaRecord.ttl = clampTTL(v);
          } else {
            rr.caaValue = v;
          }
          return rr;
        });
      }
      caaRecord = cloneDeep(caaRecord);
      return { caaRecord };
    });
  };

  handleCaaTagChange = (name: `issue` | `issuewild`) => {
    this.setState(({ caaIssue, caaIssueWild, caaRecord }) => {
      if (name === `issue` && caaIssueWild) {
        caaIssue = !caaIssue;
      } else if (name === `issuewild` && caaIssue) {
        caaIssueWild = !caaIssueWild;
      }
      if (caaIssueWild && caaIssue) {
        caaRecord.rr_set = [
          caaRecord.rr_set[0],
          {
            ...caaRecord.rr_set[0],
            tag: caaRecord.rr_set[0].tag === "issue" ? "issuewild" : "issue",
          },
        ];
      } else if (caaIssueWild) {
        caaRecord.rr_set = [
          {
            ...caaRecord.rr_set[0],
            tag: "issuewild",
          },
        ];
      } else {
        caaRecord.rr_set = [
          {
            ...caaRecord.rr_set[0],
            tag: "issue",
          },
        ];
      }
      return { caaIssue, caaIssueWild };
    });
  };

  caaPanel = () => {
    const d = !this.state.useCaa;
    const title = "Only allow tls certificates from this issuer for this domain";
    const value = this.state.caaRecord.rr_set[0].caaValue;
    const ttl = this.state.caaRecord.ttl;
    const validate = l.rrTemplates["CAA"]?.fields.caaValue?.validate(
      this.props.config,
      value,
      this.state.caaRecord.rr_set[0]
    );
    return (
      <div style={{ position: "relative" }}>
        <div style={{ paddingBottom: "10px" }}>
          <Checkbox
            checked={this.state.useCaa}
            onChange={() => {
              this.setState(({ useCaa }) => ({ useCaa: !useCaa }));
            }}
            title={title}
            size="small"
            style={{ padding: "0px", paddingRight: "5px" }}
          />
          <div className="tfName" style={{ display: "inline-block" }} title={title}>
            CAA Records
            <HelpPopper helper="caaHelp" />
          </div>
        </div>
        <div>
          <TextField
            className={[d ? "disabled" : "", validate.type].join(" ")}
            helperText={validate.message}
            onChange={(e) => this.handleCaaChange(e)}
            name="caaValue"
            style={{ display: "inline-block", width: "62%", marginRight: "5%" }}
            variant="standard"
            value={value}
            placeholder="letsencrypt.org"
          />
          <TextField
            className={d ? "disabled" : ""}
            type="number"
            onChange={(e) => this.handleCaaChange(e)}
            name="ttl"
            style={{ display: "inline-block", width: "18%", marginRight: "2%" }}
            variant="standard"
            value={ttl}
          />
          <div style={{ marginTop: "10px" }}>
            <Checkbox
              checked={this.state.caaIssue}
              onChange={() => this.handleCaaTagChange("issue")}
              title="Issue single certificates"
              size="small"
              disabled={d || (this.state.caaIssue && !this.state.caaIssueWild)}
              style={{ padding: "0px", paddingRight: "5px" }}
            />
            <span
              className={d ? "disabled" : ""}
              title="Issue single certificates"
              style={{ marginRight: "20px" }}
            >
              issue
            </span>
            <Checkbox
              checked={this.state.caaIssueWild}
              onChange={() => this.handleCaaTagChange("issuewild")}
              title="Issue wildcard certificates"
              size="small"
              disabled={d || (this.state.caaIssueWild && !this.state.caaIssue)}
              style={{ padding: "0px", paddingRight: "5px" }}
            />
            <span className={d ? "disabled" : ""} title="Issue wildcard certificates">
              issuewild
            </span>
          </div>
        </div>
      </div>
    );
  };

  render = () => {
    return (
      <Container
        style={{ margin: "20px auto", overflow: "auto", height: "100%" }}
        className="AddDomain"
      >
        <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />
        <Grid container spacing={3} style={{ maxWidth: "100%", marginBottom: "20px" }}>
          <Grid item xs={4}>
            <Paper elevation={3}>
              <Container className="form" style={{ paddingBottom: "20px" }}>
                <div className="cardHead">
                  <Ballot />
                  <span className="caps label">data</span>
                </div>
                <div className={validateDomain(this.props.config, this.state.soaRecord.name)?.type}>
                  <br />
                  <div className="tfName">
                    name <HelpPopper helper="soaName" />
                  </div>
                  <TextField
                    className="soaField"
                    variant="standard"
                    onChange={this.handleSoaChange}
                    value={this.state.soaRecord.name}
                    name="name"
                    helperText={
                      validateDomain(this.props.config, this.state.soaRecord.name)?.message || " "
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
                      (this.state.soaRecord.rr_set[0] as SOARecord).mname
                    )?.type
                  }
                >
                  <div className="tfName">
                    mname
                    <HelpPopper helper="soaMname" />
                  </div>

                  <TextField
                    className="soaField"
                    variant="standard"
                    onChange={this.handleSoaChange}
                    name="mname"
                    placeholder="ns1.example.com"
                    value={(this.state.soaRecord.rr_set[0] as SOARecord).mname}
                    helperText={
                      l.rrTemplates["SOA"]?.fields.mname?.validate(
                        this.props.config,
                        (this.state.soaRecord.rr_set[0] as SOARecord).mname
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
                      (this.state.soaRecord.rr_set[0] as SOARecord).rname
                    )?.type
                  }
                >
                  <div className="tfName">
                    rname
                    <HelpPopper helper="soaRname" />
                  </div>

                  <TextField
                    className="soaField"
                    variant="standard"
                    onChange={this.handleSoaChange}
                    name="rname"
                    placeholder="hostmaster.example.com"
                    value={(this.state.soaRecord.rr_set[0] as SOARecord).rname}
                    helperText={
                      l.rrTemplates["SOA"]?.fields.rname?.validate(
                        this.props.config,
                        (this.state.soaRecord.rr_set[0] as SOARecord).rname
                      )?.message || " "
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </div>
                <div>
                  <div className="tfName">ttl</div>
                  <TextField
                    className="soaField"
                    variant="standard"
                    type="number"
                    onChange={this.handleSoaChange}
                    name="ttl"
                    value={this.state.soaRecord.ttl}
                    inputProps={{
                      min: 0,
                    }}
                  />
                </div>
                <div style={{ margin: "30px 0px" }}>{this.nameserverPanel()}</div>
                <div style={{ margin: "30px 0px" }}>{this.caaPanel()}</div>
                <div>
                  <Button color="primary" variant="contained" onClick={() => this.addDomain()}>
                    Add Domain
                  </Button>
                </div>
                <div style={{ color: "var(--error)" }}>{this.state.apiError}</div>
              </Container>
            </Paper>
          </Grid>
          <Grid container item xs={8}>
            <DataDisplay
              style={{ marginTop: "15px", maxHeight: "90vh" }}
              config={this.props.config}
              data={[
                this.state.soaRecord,
                ...(this.state.useNameserver ? [this.state.nsRecord] : []),
                ...(this.state.useCaa ? [this.state.caaRecord] : []),
              ]}
              client={this.props.client}
            />
          </Grid>
        </Grid>
      </Container>
    );
  };
}
