import React, { Component } from "react";


export default class RegisterAddress extends Component {

    async runSet (e) {
        let adresse = document.getElementById("valeur").value;
        let isRegistered_TEMP = false;

        if (Array.isArray(this.props.data.listVoters)) {
            isRegistered_TEMP = this.props.data.listVoters.includes(adresse); // doublon : true ou false.
            }

        if (
            adresse.match(/^0x[a-fA-F0-9]{40}$/g)
            && !isRegistered_TEMP
            && (this.props.data.currentWorkflowStatus === 0)
            ) {
            const transac = await this.props.data.instanceContract.methods.addVoter(adresse).send({ from: this.props.data.owner}); // "this.props.data" provient de <RegisterAddress data = {this.state} />

            this.props.data.listVoters.push(transac.events.VoterRegistered.returnValues._voterAddress);

            this.setState({ listVoters: this.props.data.listVoters });
            }
        else {
            if ( !adresse.match(/^0x[a-fA-F0-9]{40}$/g) ) {
                document.getElementById("msgError").innerHTML = "🛑 L'adresse doit être au format hexadécimal et d'une longueur de 42 caractères. 🛑";
                }
            else if (isRegistered_TEMP) {
                document.getElementById("msgError").innerHTML = "🛑 Cette adresse a déjà été enregistrée. 🛑";
            }
            else if (this.props.data.currentWorkflowStatus !== 0) {
                document.getElementById("msgError").innerHTML = "🛑 Ce n'est pas la session d'enregistrement des votants. 🛑";
            }
            setTimeout(() => { document.getElementById("msgError").innerHTML = ""; }, "3000"); // Le message s'effacera dans 3 secondes.
            }
        };


    render() {
        let islistVotersEmpty = true;
        if (this.props.data.listVoters && this.props.data.listVoters.length > 0) { islistVotersEmpty = false; }
 
        return (
            <>
                <div className = "mainApp">
                    <input className="input" type="text" id="valeur" placeholder="Adresse du votant" size="42" />
                    <div id = "msgError"></div>
                    <br /><button className = "button buttonGreen" onClick={this.runSet.bind(this)}>Enregistrer l'adresse d'un votant</button>
                </div>
                <div className = "nextApp">
                    <b>Liste des adresses déjà enregistrées :</b>
                    { islistVotersEmpty ? (' - VIDE -') : ('') }
                    { this.props.data.listVoters ? this.props.data.listVoters.map( value => (<><br />{value}</>) ) : '' }
                </div>
            </>
        );
    }
}