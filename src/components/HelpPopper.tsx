import { IconButton, Paper, Popper } from "@material-ui/core";
import { Close, InfoOutlined } from "@material-ui/icons";
import React, { Fragment } from "react";

export default function HelpPopper(props: { helper: Helpers; style?: React.CSSProperties }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  return (
    <span className="HelpPopper" style={{ ...props.style }}>
      <IconButton
        style={{ verticalAlign: "-5px" }}
        size="small"
        aria-describedby={id}
        onClick={handleClick}
      >
        <InfoOutlined style={{ fontSize: "20px" }} />
      </IconButton>
      <Popper className="popper" id={id} open={open} anchorEl={anchorEl} placement="top" transition>
        <Paper elevation={7} style={{ padding: "15px", maxWidth: "400px" }}>
          <Fragment>
            <div style={{ marginBottom: "2px" }} className="tfName">
              INFO{" "}
            </div>
            <IconButton
              style={{ position: "absolute", right: "7px", top: "7px" }}
              size="small"
              onClick={handleClick}
            >
              <Close style={{ fontSize: "20px" }} />
            </IconButton>
            <div>{helpers[props.helper].message}</div>
          </Fragment>
        </Paper>
      </Popper>
    </span>
  );
}

const helpers = {
  caaHelp: {
    message: (
      <div>
        <p>
          CAA records whitelist certificate issuers that are allowed to issue a certificate for a
          domain. You should let this as is if you use LetsEncrypt.
        </p>
        <br />
        <p>
          <code>issue</code> allows the issuer to issue certs for distinct domain names.
        </p>
        <br />
        <p>
          <code>issuewild</code> allows the issuer to issue wildcard certs for the domain.
        </p>
      </div>
    ),
  },
  auth: {
    message: (
      <div>
        <p>
          Please paste your PC3 (Pektin Client Connection Config) in here. It can either be found in
          the secrets folder of your setup or has been given to you by an administrator. You should
          treat this config like a password as it includes one.
        </p>
      </div>
    ),
  },
  soaName: {
    message: (
      <div>
        <p>Name of the domain you want to add</p>
      </div>
    ),
  },
  soaMname: {
    message: (
      <div>
        <p>The domains primary nameserver</p>
      </div>
    ),
  },
  soaRname: {
    message: (
      <div>
        <p>The hostmasters email address, the @ should/will be replaced by a dot</p>
      </div>
    ),
  },
  dnssecInfoFlag: {
    message: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
  dnssecInfoAlgorithm: {
    message: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
  dnssecInfoKeyTag: {
    message: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
  dnssecInfoDigests: {
    message: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
  dnssecInfoPublicKeys: {
    message: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },

  TODO: {
    message: (
      <div>
        <p>TODO!</p>
      </div>
    ),
  },
};

type Helpers =
  | `caaHelp`
  | `auth`
  | `soaName`
  | `soaMname`
  | `soaRname`
  | `dnssecInfoFlag`
  | `dnssecInfoAlgorithm`
  | `dnssecInfoKeyTag`
  | `dnssecInfoDigests`
  | `dnssecInfoPublicKeys`
  | `TODO`;
/*
soaName: {
    message: (
      <div>
        <p></p>
      </div>
    ),
  },
*/
