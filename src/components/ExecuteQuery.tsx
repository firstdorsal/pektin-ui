import { Button, Grid, TextField } from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { Component, CSSProperties } from "react";
import { Config, Glob } from "./types";
import { Rnd } from "react-rnd";
import { getDomainSnippets, rrSnippets, snippets } from "./snippets";
import AceEditor, { IAceOptions } from "react-ace";
import Autocomplete from "@material-ui/lab/Autocomplete";

//import "ace-builds/webpack-resolver";

import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ace";

import { setCompleters } from "ace-builds/src-noconflict/ext-language_tools";

import {
  isKnownApiMethod,
  methodToFunctionName,
  PektinClient,
  simpleBeautify,
  supportedMethods,
} from "@pektin/client";

interface ExecuteQueryProps {
  g: Glob;
  config: Config;
  client: PektinClient;
}
interface ExecuteQueryState {
  request: string;
  response: string;
  methodSelector: string;
  methodSelectorText: string;
  width: number;
}

export default class ExecuteQuery extends Component<ExecuteQueryProps, ExecuteQueryState> {
  state = {
    request: `[{"name":"toll.club.","rr_type":"SOA"}]`,
    response: "",
    methodSelector: "get",
    methodSelectorText: "",
    width: 600,
  };
  editorRef: any;
  editor2Ref: any;

  renderMenu = () => {
    return (
      <div className="Menu">
        <Button variant="contained" color="primary" onClick={this.handleSend} endIcon={<Send />}>
          Send
        </Button>

        <div style={{ width: 300, display: "inline-block" }}>
          <Autocomplete
            id="selectMethod"
            freeSolo
            forcePopupIcon={true}
            selectOnFocus={true}
            openOnFocus={true}
            clearOnEscape
            value={this.state.methodSelector}
            onChange={(e, value) => {
              this.setState({ methodSelector: value ?? "" });
            }}
            inputValue={this.state.methodSelectorText}
            onInputChange={(event, newInputValue) => {
              this.setState({ methodSelectorText: newInputValue });
            }}
            options={supportedMethods}
            renderInput={(params) => (
              <TextField {...params} label="method" margin="normal" variant="standard" />
            )}
          />
        </div>
      </div>
    );
  };
  handleSend = async () => {
    let body, res;
    const apiMethod = this.state.methodSelectorText.length
      ? this.state.methodSelectorText
      : this.state.methodSelector;
    try {
      body = JSON.parse(this.state.request);
    } catch (error) {}
    if (isKnownApiMethod(apiMethod)) {
      /*@ts-ignore*/
      res = await this.props.client[methodToFunctionName(apiMethod)](body, false);
    } else {
      res = await this.props.client.any(body, apiMethod, false);
    }
    this.setState({ response: simpleBeautify(res, 2) });
  };

  getCombinedSnippets = async () => {
    return [...snippets, ...getDomainSnippets(await this.props.client.getDomains()), ...rrSnippets];
  };

  componentDidMount = async () => {
    const completions = await this.getCombinedSnippets();
    setCompleters([
      {
        getCompletions: (editor: any, session: any, pos: any, prefix: any, callback: any) => {
          completions.forEach((i) => {
            completions.push({
              caption: i.caption,
              snippet: i.snippet,
              type: i.type,
              meta: i.meta,
              description: i.description,
            });
          });
          callback(null, completions);
        },
        getDocTooltip: function (item: any) {
          if (item.type === "snippet" && !item.docHTML) {
            item.docHTML = ["<b>", item.caption, "</b>", "<hr></hr>", item.description].join("");
          }
        },
      },
    ]);
  };

  render = () => {
    const codeEditorGridStyle: CSSProperties = {
      height: "calc(100% -  100px)",
      width: "100%",
      position: "relative",
    };
    const titleStyle: CSSProperties = {
      position: "absolute",
      top: "-20px",
      left: "15px",
    };
    return (
      <div
        className="ExecuteQuery"
        style={{ height: "100%", width: "100%", maxWidth: "100%", margin: "0px" }}
      >
        <Grid style={{ height: "100%", width: "100%", margin: "0px" }} container spacing={3}>
          <Grid style={{ height: "100px", width: "100%", padding: "0px" }} item xs={12}>
            {this.renderMenu()}
          </Grid>
          <Grid style={codeEditorGridStyle} item xs={12}>
            <Rnd
              disableDragging={true}
              enableResizing={{ right: true }}
              onResize={(e, direction, ref, delta, position) => {
                this.setState({ width: ref.offsetWidth });
                this.editorRef.editor.resize();
                this.editor2Ref.editor.resize();
              }}
            >
              <div
                style={{
                  width: this.state.width + "px",
                  height: "calc(100vh - 100px)",
                  borderRight: "1px solid #000",
                }}
                className="leftEditor"
              >
                <div className="tfName" style={titleStyle}>
                  Request
                </div>
                <AceEditor
                  mode="json"
                  theme="one_dark"
                  enableSnippets={true}
                  enableBasicAutocompletion={true}
                  enableLiveAutocompletion={true}
                  value={this.state.request}
                  setOptions={options}
                  onChange={(text) => this.setState({ request: text })}
                  fontSize={16}
                  width="100%"
                  height="100%"
                  name="aceEditor"
                  ref={(r) => (this.editorRef = r)}
                  editorProps={{ $blockScrolling: true }}
                />
              </div>
            </Rnd>

            <div
              style={{
                right: "0px",
                left: this.state.width + "px",
                top: "0px",
                bottom: "0px",
                position: "absolute",
              }}
            >
              <div className="tfName" style={titleStyle}>
                Reponse
              </div>
              <AceEditor
                mode="json"
                theme="one_dark"
                tabSize={2}
                value={this.state.response}
                readOnly={true}
                setOptions={options}
                fontSize={16}
                height="100%"
                width="100%"
                ref={(r) => (this.editor2Ref = r)}
                name="aceEditor2"
              />
            </div>
          </Grid>
        </Grid>
      </div>
    );
  };
}

const options: IAceOptions = {
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
  behavioursEnabled: false,
};
