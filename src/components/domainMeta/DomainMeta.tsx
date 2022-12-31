import { Box, Tab, Tabs } from "@material-ui/core";
import { PektinClient } from "@pektin/client";
import { Component } from "react";
import { RouteComponentProps } from "react-router-dom";
import { Config, Glob } from "../types";
import { Add, LockOutlined, Mail } from "@material-ui/icons";
import { MdSettingsInputSvideo } from "react-icons/md";
import { TbCertificate } from "react-icons/tb";
import { DnssecParams } from "./dnssec/DnssecInfo";
import { RegistrarInfo } from "./registrar/RegistrarInfo";
import Mailcow from "./mailcow/Mailcow";

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
    const apiCreds = this.props.client.pc3.info?.apiCredentials;

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
          <Tab
            tabIndex={2}
            icon={<TbCertificate style={{ transform: "scale(1.5)" }} />}
            label="CERTIFICATES"
          />
          {apiCreds?.mailcow && <Tab tabIndex={3} icon={<Mail />} label="MAILCOW" />}

          <Tab icon={<Add style={{ transform: "scale(1.5)" }} />} />
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
        {apiCreds?.mailcow && (
          <TabPanel value={this.state.currentPanel} index={3}>
            <Mailcow client={this.props.client} domainName={this.props.match.params.domainName} />
          </TabPanel>
        )}
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
