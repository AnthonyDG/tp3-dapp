import React, { Component } from "react";


export default class RegisterProposal extends Component {

    async runSet (e) {
        let proposition = document.getElementById("proposition").value;

        if (
            proposition !== ''
            && (this.props.data.currentWorkflowStatus === 1)
            ) {
            await this.props.data.instanceContract.methods.addProposal(proposition).send({ from: this.props.data.accounts[0] }); // "this.props.data" provient de <RegisterProposal data = {this.state} />
            this.props.data.listProposals.push(proposition); // ID doit être le même que dans la BC.

            this.setState({ listProposals: this.props.data.listProposals });
            }
        else {
            if ( proposition === '' ) {
                document.getElementById("msgError").innerHTML = "🛑 La proposition ne peut pas être vide. 🛑";
                }
            else if (this.props.data.currentWorkflowStatus !== 1) {
                document.getElementById("msgError").innerHTML = "🛑 Ce n'est pas la session d'enregistrement des propositions. 🛑";
            }
            setTimeout(() => { document.getElementById("msgError").innerHTML = ""; }, "5000"); // Le message s'effacera dans 5 secondes.
            }
        };


    render() {
        let islistProposalsEmpty = true;
        if (this.props.data.listProposals && this.props.data.listProposals.length > 0) { islistProposalsEmpty = false; }

        return (
            <>
                <br />
                <h2>Etape 1/3 : Enregistrement d'une ou plusieurs propositions</h2>
                <br />
                <div className = "mainApp">
                    <textarea className="input" id="proposition" placeholder="Ecrivez ici votre proposition puis cliquez sur 'Enregistrer'." rows="4" cols="50"></textarea>
                    <div id = "msgError"></div>
                    <br /><button className = "button buttonGreen" onClick={this.runSet.bind(this)}>Enregistrer la proposition</button>
                </div>
                <div className = "nextApp">
                    <b>Liste des propositions déjà enregistrées :</b>
                    { islistProposalsEmpty ? (' - VIDE -') : ('') }
                    { this.props.data.listProposals ? this.props.data.listProposals.map( value => (<><br />{value}</>) ) : '' }
                </div>
            </>
        );
    }
}