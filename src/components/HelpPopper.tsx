import { IconButton, Paper, Popper } from "@material-ui/core";
import { Help } from "@material-ui/icons";
import React from "react";

export default function HelpPopper(props: any) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);
    const id = open ? "simple-popper" : undefined;

    return (
        <div style={props.style}>
            <IconButton aria-describedby={id} onClick={handleClick}>
                <Help />
            </IconButton>
            <Popper id={id} open={open} anchorEl={anchorEl} placement="top" transition>
                <Paper elevation={3} style={{ padding: "20px" }}>
                    {props.children}
                </Paper>
            </Popper>
        </div>
    );
}
