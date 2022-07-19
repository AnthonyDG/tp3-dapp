import React, { Component } from "react";


export default class Vote4proposal extends Component {

    async runSet (e) {
        let id_proposition = document.getElementById("id_proposition").value;

        if (
            id_proposition.match(/^[0-9]{1,3}$/g)
            && id_proposition !== ''
            && (this.props.data.currentWorkflowStatus === 3)
            ) {
            await this.props.data.instanceContract.methods.setVote(id_proposition).send({ from: this.props.data.accounts[0] }); // "this.props.data" provient de <RegisterProposal data = {this.state} />
            }
        else {
            if ( !id_proposition.match(/^[0-9]{1,3}$/g) ) {
                document.getElementById("msgError").innerHTML = "🛑 Entrez uniquement le n° de la proposition. 🛑";
                }
            else if ( id_proposition === '' ) {
                document.getElementById("msgError").innerHTML = "🛑 Le vote ne peut pas être vide. 🛑";
                }
            else if (this.props.data.currentWorkflowStatus !== 1) {
                document.getElementById("msgError").innerHTML = "🛑 Ce n'est pas la session d'enregistrement des propositions. 🛑";
            }
            setTimeout(() => { document.getElementById("msgError").innerHTML = ""; }, "3000"); // Le message s'effacera dans 3 secondes.
            }
        };


    render() {
        let islistProposalsEmpty = true;
        if (this.props.data.listProposals && this.props.data.listProposals.length > 0) { islistProposalsEmpty = false; }
        console.log("this.props.data.listProposals : ", this.props.data.listProposals);

        return (
            <>
                <br />
                <h2>Etape 2/3 : Vote</h2>
                <br />
                <div className = "mainApp">
                    <input className="input" type="number" pattern="[0-9]{1,3}" id="id_proposition" placeholder="Quel numéro de proposition ?" size="35" ></input>
                    <div id = "msgError"></div>
                    <br /><button className = "button buttonGreen" onClick={this.runSet.bind(this)}>Enregistrer le numéro</button>
                </div>
                <div className = "nextApp AppVote">
                    <b>Votez pour l'une de ces propositions :</b>
                    { islistProposalsEmpty ? (' - VIDE -') : ('') }
                    { this.props.data.listProposals ? this.props.data.listProposals.map( (currElement, index) => (<><br />N°{index} : {currElement}</>) ) : '' }
                </div>
            </>
        );
    }
}