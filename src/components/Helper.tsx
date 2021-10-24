import { Component } from "react";

interface HelperProps {
  readonly show: boolean;
  readonly handleHelper: any;
}
interface HelperState {}
export default class Helper extends Component<HelperProps, HelperState> {
  render = () => {
    return (
      <div
        className="Helper"
        style={{
          position: "fixed",
          right: "20px",
          bottom: this.props.show ? "10px" : "-300px",
          opacity: this.props.show ? "1" : "0",
          zIndex: 5,
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            draggable="false"
            src="/animated-tux.gif"
            alt="tux (the linux mascot) typing on a computer"
          />

          <div
            className="speechBubble"
            style={{
              transform: this.props.show ? "scale(1)" : "scale(0)",
              zIndex: 5,
            }}
          >
            <div>
              It looks like you're trying to create an spf record.
              <br />
              Would you like help?
            </div>

            <button>
              <span>Yes</span>
            </button>
            <button onClick={() => this.props.handleHelper("close")}>No</button>
            <svg
              height="25"
              width="25"
              style={{ position: "absolute", bottom: "-23px", right: "35px", zIndex: -2 }}
            >
              <mask id="borderTop">
                <rect width="25" height="25" style={{ fill: "white" }} />
                <rect width="25" height="2" style={{ fill: "black" }} />
              </mask>
              <polygon
                points="0,0,19 16,21 0"
                style={{
                  fill: "#ffef9c",
                  stroke: "black",
                  strokeWidth: 2,
                  mask: "url(#borderTop)",
                }}
              />
            </svg>
          </div>
        </div>
      </div>
    );
  };
}

/*
<div
            style={{
              position: "absolute",
              right: "7px",
              bottom: "100px",
              background: "#ffef9c",
              borderRadius: "50%",
              cursor: "pointer",
              border: "2px solid white",
              width: "15px",
              height: "15px",
            }}
            className="close"
            title="Close"
          >
            <Close
              onClick={() => this.props.handleHelper("close")}
              style={{ width: "100%", position: "absolute", top: "-6px" }}
            />
          </div>
*/
