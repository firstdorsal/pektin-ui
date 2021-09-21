import { PureComponent } from "react";
import { Paper, StandardTextFieldProps } from "@material-ui/core";
import * as t from "./types";
import { Link } from "react-router-dom";

interface ContextMenuProps extends StandardTextFieldProps {
    readonly g: t.Glob;
    readonly cmClick: any;
    readonly config: t.Config;
}

interface ContextMenuState {
    readonly contextMenu: any;
}

export class ContextMenu extends PureComponent<ContextMenuProps, ContextMenuState> {
    state: ContextMenuState = {
        contextMenu: false
    };
    componentDidUpdate = () => {
        this.setState({ contextMenu: this.props.g.contextMenu });
    };
    render = () => {
        const contextMenu = () => {
            const cm = this.state.contextMenu;
            const target = cm.target;
            const variables = this.props.config.local.variables;

            return (
                <Paper elevation={3} className="contextMenu" style={{ position: "fixed", left: this.state.contextMenu.clientX, top: cm.clientY, background: "var(--b)", zIndex: 10, padding: "10px" }}>
                    {variables.length ? (
                        variables.map((e: any, i: number) => {
                            const disabled = target.type === "number" && isNaN(parseInt(e.value)) ? true : false;

                            const style = disabled ? { color: "var(--b1)" } : { cursor: "pointer" };
                            const title = disabled ? `"${e.value}" can't be used here as it cannot be casted into a number` : e.value;
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
                    )}
                </Paper>
            );
        };
        return this.props.g.contextMenu && this.state.contextMenu ? contextMenu() : <div></div>;
    };
}
