import { MenuItem, Select } from "@material-ui/core";
import { Component, Fragment } from "react";

type TxtType = "SPF1" | "DKIM1" | "DMARC1";

interface TxtAssistantProps {
  type?: TxtType;
}
interface TxtAssistantState {
  type: TxtType;
}

const spfAllOther = [
  { id: "-all", desc: "Reject all" },
  { id: "~all", desc: "" },
  { id: "?all", desc: "" },
  { id: "+all", desc: "Allow all (this makes no sense)" },
];

export default class TxtAssistant extends Component<TxtAssistantProps, TxtAssistantState> {
  state: TxtAssistantState = {
    type: this.props.type || "SPF1",
  };

  SPF1 = () => {
    return (
      <Fragment>
        What shall happen with everything not catched before?
        <br />
        <Select
          style={{ padding: "2px", paddingRight: "15px" }}
          value={this.state.type}
          onChange={(e) => this.setState({ type: e.target.value as TxtType })}
        >
          {spfAllOther.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.id}
            </MenuItem>
          ))}
        </Select>
      </Fragment>
    );
  };

  render = () => {
    return (
      <div className="TxtAssistant">
        <h2>TXT Assistant</h2>
        <Select
          style={{ padding: "2px", paddingRight: "15px" }}
          value={this.state.type}
          onChange={(e) => this.setState({ type: e.target.value as TxtType })}
        >
          {["SPF1", "DKIM1", "DMARC1"].map((e) => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </Select>

        <div style={{ paddingTop: "10px" }}>
          {/*@ts-ignore*/}
          {this[this.state.type]()}
        </div>
      </div>
    );
  };
}
