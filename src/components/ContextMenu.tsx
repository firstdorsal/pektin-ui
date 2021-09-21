import { PureComponent } from "react";
import { Paper, StandardTextFieldProps } from "@material-ui/core";
import * as t from "./types";

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
    handleRightClick = (e: any) => {
        if (e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        this.setState({ contextMenu: e });
    };
    componentDidUpdate = () => {
        this.setState({ contextMenu: this.props.g.contextMenu });
    };
    render = () => {
        const contextMenu = () => {
            const cm = this.state.contextMenu;
            const target = cm.target;
            return (
                <Paper elevation={3} className="contextMenu" style={{ position: "fixed", left: this.state.contextMenu.clientX, top: cm.clientY, background: "var(--b)", zIndex: 10, padding: "10px" }}>
                    {this.props.config.local.variables.map((e: any, i: number) => {
                        return (
                            <div
                                className="contextMenu"
                                key={i}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    this.props.g.changeContextMenu(false);
                                    this.props.cmClick(target.name, target.cmAction ? target.cmAction : "paste", e.value);
                                }}
                            >
                                {e.key}
                            </div>
                        );
                    })}
                </Paper>
            );
        };
        return this.props.g.contextMenu && this.state.contextMenu ? contextMenu() : <div></div>;
    };
}
