import { Component } from "react";
import { Paper, StandardTextFieldProps } from "@material-ui/core";
import * as t from "./types";
import { Link } from "react-router-dom";
import { CodeStylePicker } from "./Config";

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
        contextMenu: false
    };
    componentDidUpdate = () => {
        if (this.state.contextMenu !== this.props.g.contextMenu) this.setState({ contextMenu: this.props.g.contextMenu });
    };
    /*
    shouldComponentUpdate = (nextProps: ContextMenuProps, nextState: ContextMenuState) => {
        if (nextProps.g.contextMenu === this.props.g.contextMenu) return false;
        return true;
    };*/
    render = () => {
        const contextMenu = () => {
            const cm = this.state.contextMenu;
            const target = cm.target;
            const variables = this.props.config.local.variables;
            if (target.type === "checkbox") return <div></div>;
            const renderVariables = () => {
                return variables.length ? (
                    variables.map((e: any, i: number) => {
                        let disabled = target.type === "number" && isNaN(parseInt(e.value)) ? "nan" : false;
                        if (target.disabled) disabled = "disabled";

                        const style = disabled ? { color: "var(--b1)" } : { cursor: "pointer" };
                        let title =
                            disabled === "nan" ? `"${e.value}" can't be used here as it cannot be casted into a number` : e.value;
                        if (disabled === "disabled") title = "This field is disabled";
                        return (
                            <div
                                className="contextMenu"
                                key={i}
                                style={style}
                                title={title}
                                onClick={() => {
                                    if (disabled) return;
                                    this.props.g.changeContextMenu(false);

                                    this.props.cmClick(target, this.props.g.cmAction, e.value);
                                }}
                            >
                                {e.key}
                            </div>
                        );
                    })
                ) : (
                    <Link className="contextMenu" to="/config">
                        Add Variable
                    </Link>
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
                    onContextMenu={e => e.preventDefault()}
                    elevation={3}
                    className="contextMenu"
                    style={{
                        position: "fixed",
                        left: this.state.contextMenu.clientX,
                        top: cm.clientY,
                        background: "var(--b)",
                        zIndex: 10,
                        padding: "10px"
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
