import { Button, Container, Grid } from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { Component } from "react";
import { Config, Glob } from "./types";

import AceEditor from "react-ace";
//import "ace-builds/webpack-resolver";

import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/ext-language_tools";

interface ExecuteQueryProps {
  g: Glob;
  config: Config;
}
interface ExecuteQueryState {
  query: string;
}

export default class ExecuteQuery extends Component<ExecuteQueryProps, ExecuteQueryState> {
  state = {
    query: "",
  };

  render = () => {
    return (
      <div className="ExecuteQuery">
        <Container style={{ margin: "20px auto" }}>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <AceEditor
                mode="json"
                theme="one_dark"
                enableBasicAutocompletion={true}
                enableLiveAutocompletion={true}
                defaultValue={JSON.stringify(t, null, "    ")}
                setOptions={{
                  useWorker: false,

                  highlightActiveLine: false,
                  enableSnippets: true,
                  highlightSelectedWord: false,
                  showInvisibles: true,
                  fadeFoldWidgets: true,
                  displayIndentGuides: true,
                  /*@ts-ignore*/
                  scrollPastEnd: 1,
                  fixedWidthGutter: true,
                  dragEnabled: false,
                  /*@ts-ignore*/
                  newLineMode: "unix",
                  useSoftTabs: true,
                  wrap: true,
                  showPrintMargin: false,
                }}
                onChange={(e) => {
                  /* @ts-ignore */
                  this.setState({ query: e?.target?.value });
                }}
                fontSize={16}
                height="90vh"
                width="70vw"
                name="aceEditor"
              />
              <Button variant="contained" color="primary" endIcon={<Send />}>
                Send
              </Button>
            </Grid>
            <Grid item xs={4} style={{ background: "none" }}></Grid>
          </Grid>
        </Container>
      </div>
    );
  };
}

const t = {
  services: {
    ui: {
      enabled: true,
      domain: "pektin.club",
      subDomain: "ui",
    },
    api: {
      domain: "pektin.club",
      subDomain: "api",
    },
    vault: {
      domain: "pektin.club",
      subDomain: "vault",
    },
    recursor: {
      enabled: true,
      domain: "pektin.club",
      subDomain: "recursor",
    },
    ribston: {
      enabled: true,
    },
    opa: {
      enabled: false,
    },
  },
  nodes: [
    {
      main: true,
      name: "balduin",
      ips: ["2a01:4f9:c01f:80::"],
    },
    {
      name: "gustav",
      ips: ["2a01:4f9:c01f:80::"],
    },
  ],
  nameservers: [
    { subDomain: "ns1", domain: "pektin.club", node: "balduin", main: true },
    { subDomain: "ns2", domain: "pektin.club", node: "gustav" },
    { subDomain: "ns1", domain: "toll.club", node: "balduin", main: true },
  ],
  letsencrypt: {
    enabled: true,
    letsencryptEmail: "test@pektin.club",
  },
  usePolicies: "ribston",
  build: {
    server: {
      enabled: false,
      path: "/home/paul/Documents/pektin/pektin-server",
    },
    api: {
      enabled: false,
      path: "/home/paul/Documents/pektin/pektin-api",
    },
    ui: {
      enabled: false,
      path: "/home/paul/Documents/pektin/pektin-ui",
    },
    ribston: {
      enabled: false,
      path: "/home/paul/Documents/pektin/ribston",
    },
    recursor: {
      enabled: false,
      path: "",
    },
    vault: {
      enabled: false,
      path: "",
    },
  },
  reverseProxy: {
    createTraefik: true,
    routing: "local",
    tls: false,
    tempZone: { enabled: true, provider: "pektin.zone", routing: "local" },
    traefikUi: { enabled: true, domain: "pektin.club", subDomain: "traefik" },
    external: {
      domain: "pektin.club",
      subDomain: "pektin-proxy",
      enabled: true,
      services: [
        {
          name: "gandi",
          enabled: true,
          domain: "api.gandi.net",
          accessControlAllowMethods: ["OPTIONS", "POST", "GET", "DELETE"],
        },
        {
          name: "crt",
          enabled: true,
          domain: "crt.sh",
          accessControlAllowMethods: ["OPTIONS", "GET"],
        },
      ],
    },
  },
};
