import React, { Component } from "react";


export default class WinningProposal extends Component {
    render() {
        return (
            <>
                <br />
                <h2>Etape 3/3 : la proposition gagnante</h2>
                <br />
                <div className = "mainApp WinProp">
                    Description : {this.props.data.winPropDescription}
                    <br />Nombre de votes : {this.props.data.winPropVoteCount}
                    <br />(ID : {this.props.data.winPropID})
                </div>
            </>
        );
    }
}