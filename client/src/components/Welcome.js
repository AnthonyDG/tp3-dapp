import React, { Component } from "react";


export default class Welcome extends Component {

    hiddenAddress(address) {
        if (address) {
            const startAdd = address.slice(0, 5);
            const endAdd = address.slice(-4);
            return startAdd + '...' + endAdd;
        }
    }


    render() {
        return (
            <div className = "welCome">
                    {this.props.data.currentWorkflowStatus < 2 ? (<>👋 <b>Bienvenue !</b></>) : ("")}
                <br />
                <div className = "votreAdresseC">
                    <b>Votre adresse de connexion :</b>
                    <br />🔑 {this.hiddenAddress(this.props.data.accounts[0])}
                </div>
            </div>
            );
    }
}