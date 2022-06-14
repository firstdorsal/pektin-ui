import { Box, Tab, Tabs } from "@material-ui/core";
import { PektinClient } from "@pektin/client";
import { Component } from "react";
import { RouteComponentProps } from "react-router-dom";
import { Config, Glob } from "../types";
import { LockOutlined } from "@material-ui/icons";
import { MdSettingsInputSvideo } from "react-icons/md";
import { DnssecParams } from "./dnssec/DnssecInfo";
import { RegistrarInfo } from "./registrar/RegistrarInfo";

interface RouteParams {
  readonly domainName: string;
}

interface DomainMetaProps extends RouteComponentProps<RouteParams> {
  readonly config: Config;
  readonly g: Glob;
  readonly client: PektinClient;
}

interface DomainMetaState {
  currentPanel: number;
}
export default class DomainMeta extends Component<DomainMetaProps, DomainMetaState> {
  constructor(props: DomainMetaProps) {
    super(props);
    this.state = {
      currentPanel: 0,
    };
  }
  render = () => {
    return (
      <div className="DomainMeta">
        <h1>{this.props.match.params.domainName}</h1>
        <br />
        <Tabs
          value={this.state.currentPanel}
          onChange={(e, n) => this.setState({ currentPanel: n })}
          variant="fullWidth"
          indicatorColor="secondary"
          textColor="primary"
          aria-label="icon label tabs example"
        >
          <Tab icon={<LockOutlined />} label="DNSSEC" />
          <Tab
            icon={<MdSettingsInputSvideo style={{ transform: "scale(1.5)" }} />}
            label="REGISTRAR"
          />
        </Tabs>
        <TabPanel value={this.state.currentPanel} index={0}>
          <DnssecParams
            client={this.props.client}
            domainName={this.props.match.params.domainName}
          />
        </TabPanel>
        <TabPanel value={this.state.currentPanel} index={1}>
          <RegistrarInfo
            client={this.props.client}
            domainName={this.props.match.params.domainName}
          />
        </TabPanel>
      </div>
    );
  };
}
interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

// eslint-disable-next-line
const dm = {
  registrar: "gandi",
  api: true,
  expires: { api: true, date: Date.now() }, // if the expiration time is set manually or via the api
  nameservers: { setAtRegistrar: [], resolvedAtSource: [] }, // what nameserver are set at the registrar and what the actual resolved state is
  recordsResolve: {}, // what records resolve publicly how
  certificates: {
    past: [], // what certificates were issued in the past
    configured: [], // what certificates are set to be (re)issued on a regular basis
  },
  notes: "",
  primary: true,
};
