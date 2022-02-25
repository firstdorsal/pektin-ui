import { Component, Fragment } from "react";
import { IconButton, Paper, StandardTextFieldProps } from "@material-ui/core";
import * as t from "./types";
import { Link } from "react-router-dom";
import { CodeStylePicker } from "./Config";
import { FaPlusCircle } from "react-icons/fa";
import { VscSymbolString } from "react-icons/vsc";

interface ContextMenuProps extends StandardTextFieldProps {
  readonly g: t.Glob;
  readonly cmClick: any;
  readonly config: t.Config;
}

interface ContextMenuState {
  readonly contextMenu: any;
}

export class ContextMenu extends Component<ContextMenuProps, ContextMenuState> {
  state: ContextMenuState = {
    contextMenu: false,
  };
  componentDidUpdate = () => {
    if (this.state.contextMenu !== this.props.g.contextMenu)
      this.setState({ contextMenu: this.props.g.contextMenu });
  };

  render = () => {
    const contextMenu = () => {
      const cm = this.state.contextMenu;
      const target = cm.target;
      const variables = this.props.config.local.variables;
      if (target.type === "checkbox") return <div></div>;
      const renderVariables = () => {
        return (
          <Fragment>
            {variables.map((e: any, i: number) => {
              let disabled = target.type === "number" && isNaN(parseInt(e.value)) ? "nan" : false;
              if (target.disabled) disabled = "disabled";

              let titleValue =
                disabled === "nan"
                  ? `"${e.value}" can't be used here as it cannot be casted into a number`
                  : `Insert Variable Value: ${e.value}`;
              let titleName =
                disabled === "nan"
                  ? `"$${e.key}" can't be used here as it's value cannot be casted into a number`
                  : `Insert Variable Name`;
              if (disabled === "disabled") {
                titleValue = "This field is disabled";
                titleName = "This field is disabled";
              }

              const color = disabled ? "var(--disabled-color)" : "inherit";
              const cursor = disabled ? "default" : "pointer";
              return (
                <div className="contextMenu" key={i} style={{ color, margin: "5px" }}>
                  <IconButton
                    title={titleValue}
                    style={{ color, cursor }}
                    onClick={() => {
                      if (disabled) return;
                      this.props.g.changeContextMenu(false);

                      this.props.cmClick(target, this.props.g.cmAction, e.value);
                    }}
                    size="small"
                  >
                    <VscSymbolString />
                  </IconButton>{" "}
                  <span
                    title={titleName}
                    style={{ color, cursor }}
                    onClick={() => {
                      if (disabled) return;
                      this.props.g.changeContextMenu(false);
                      console.log(target.selectionStart);
                      const value =
                        target.value.substring(0, target.selectionStart) +
                        "$" +
                        e.key +
                        target.value.substring(target.selectionEnd - 1);
                      this.props.cmClick(target, this.props.g.cmAction, value);
                    }}
                  >
                    {"$"}
                    {e.key}
                  </span>
                </div>
              );
            })}

            <Link
              title="Add Variable"
              style={{ margin: "5px" }}
              className="contextMenu"
              to="/settings/"
            >
              <IconButton size="small">
                <FaPlusCircle />
              </IconButton>{" "}
              Add Variable
            </Link>
          </Fragment>
        );
      };
      const renderCodeStyle = () => {
        return (
          <div className="contextMenu">
            <div> Change code style</div>
            <CodeStylePicker config={this.props.config} g={this.props.g} />
          </div>
        );
      };

      return (
        <Paper
          onContextMenu={(e) => e.preventDefault()}
          elevation={3}
          className="contextMenu"
          style={{
            position: "fixed",
            left: this.state.contextMenu.clientX,
            top: cm.clientY,
            background: "var(--bg-color-lighter)",
            zIndex: 10,
            padding: "10px",
          }}
        >
          {this.props.g.cmAction === "paste" ? renderVariables() : ""}
          {this.props.g.cmAction === "code" ? renderCodeStyle() : ""}
        </Paper>
      );
    };
    return this.props.g.contextMenu && this.state.contextMenu ? contextMenu() : <div></div>;
  };
}
