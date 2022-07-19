import React, { Component } from "react";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";

import Welcome from "./components/Welcome.js";
import RegisterAddress from "./components/RegisterAddress.js";
import RegisterProposal from "./components/RegisterProposal.js";
import Vote4Proposal from "./components/Vote4Proposal.js";
import WinningProposal from "./components/WinningProposal.js";

import "./App.css";


class App extends Component {
    state = { 
        web3: null,
        accounts: null,
        networkId: null,
        deployedNetwork: null,
        instanceContract: null,
        contractAddress: null,
        owner: null,
        owned: false,
        listVoters: [],
        isRegistered: false,
        currentWorkflowStatus: 0,
        displayWorkflowStatus: [],
        listProposals: [],
        winPropDescription: null,
        winPropID: null,
        winPropVoteCount: null,
    };

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = VotingContract.networks[networkId];
            const instanceContract = new web3.eth.Contract(
                VotingContract.abi,
                deployedNetwork && deployedNetwork.address,
            );
            const contractAddress = instanceContract._address;
            const owner = await instanceContract.methods.owner().call();
            let owned = accounts[0] === owner;

            this.setState({ web3, accounts, networkId, deployedNetwork, instanceContract, contractAddress, owner, owned });
        } catch (error) {
            alert( `Failed to load web3, accounts, or contract. Check console for details.`, );
            console.error("Error : ", error);
        }

        await this.listVoters();
        await this.listProposals();
        await this.isRegistered();
        await this.setWorkflowStatus();
    };



    listVoters = async () => {
        let options = {
            fromBlock: 0, // Number || "earliest" || "pending" || "latest"
            toBlock: 'latest'
        };

        let listVotersPastEvents = await this.state.instanceContract.getPastEvents('VoterRegistered', options);
        
        let listPastVotersOnly = listVotersPastEvents.map(value => value.returnValues._voterAddress);
        this.setState({ listVoters: listPastVotersOnly });
        };

    listProposals = async () => {
        let options = {
            fromBlock: 0, // Number || "earliest" || "pending" || "latest"
            toBlock: 'latest'
        };

        let listProposalsPastEvents = await this.state.instanceContract.getPastEvents('ProposalRegistered', options);
        
        let listPastProposalsIDOnly = listProposalsPastEvents.map(value => value.returnValues._proposalId);

        for (let i = 0; i < listPastProposalsIDOnly.length; i++) {
            const recipient = await this.state.instanceContract.methods.getOneProposal(i).call({from: this.state.accounts[0]});
            this.state.listProposals.push(recipient.description);
            }


        this.setState({ listProposals: this.state.listProposals });
        };

    isRegistered = async () => {
        let isRegistered_TEMP = false;
        if (Array.isArray(this.state.listVoters)) {
            isRegistered_TEMP = this.state.listVoters.includes(this.state.accounts[0]); // true ou false.
            }
        this.setState({ isRegistered_TEMP });
        };

/**
 * 
 * @dev Gestion du Workflow. 
 */
    getWorkflowStatus = async () => {
        let currentWorkflowStatus = Number( await this.state.instanceContract.methods.workflowStatus().call({ from: this.state.accounts[0] }) );

        this.setState({ currentWorkflowStatus });

        if (currentWorkflowStatus === 5) {
            this.WinningProp();
            }

        return currentWorkflowStatus;
        };


    setWorkflowStatus = async () => {
        let currentWorkflowStatus = await this.getWorkflowStatus();

        let displayWorkflowStatus = [];
        const wStatusMax = 6; // Nbre de statuts.
        for (let i = 0; i < wStatusMax; i++) {
            if (currentWorkflowStatus === i) {
                displayWorkflowStatus[i] = 'WorkfFlow_CurrentStep';
                }
            else if ((currentWorkflowStatus + 1) === i) {
                displayWorkflowStatus[i] = 'WorkfFlow_NextStep';
                }
            else {
                displayWorkflowStatus[i] = 'WorkfFlow_NoStep';
                }
            }
        
        this.setState({ displayWorkflowStatus });
    };
    
    
    /**
     * 
     * @dev Gestion des onClick().
     */
    startProposalsRegistering = async () => {
        if (this.state.currentWorkflowStatus === 0) {
            await this.state.instanceContract.methods.startProposalsRegistering().send({ from: this.state.accounts[0] });
            this.setWorkflowStatus();
            }
    };

    endProposalsRegistering = async () => {
        if (this.state.currentWorkflowStatus === 1) {
            await this.state.instanceContract.methods.endProposalsRegistering().send({ from: this.state.accounts[0] });
            this.setWorkflowStatus();
            }
    };

    startVotingSession = async () => {
        if (this.state.currentWorkflowStatus === 2) {
            await this.state.instanceContract.methods.startVotingSession().send({ from: this.state.accounts[0] });
            this.setWorkflowStatus();
            }
    };

    endVotingSession = async () => {
        if (this.state.currentWorkflowStatus === 3) {
            await this.state.instanceContract.methods.endVotingSession().send({ from: this.state.accounts[0] });
            this.setWorkflowStatus();
            }
    };

    tallyVotes = async () => {
        console.log("tallyVotes");
        if (this.state.currentWorkflowStatus === 4) {
            await this.state.instanceContract.methods.tallyVotes().send({ from: this.state.accounts[0] });
            this.setWorkflowStatus();
            // this.WinningProp();
        }
    };

   WinningProp = async () => {
        console.log("WinningProp");
        let options = {
            fromBlock: 0, // Number || "earliest" || "pending" || "latest"
            toBlock: 'latest'
        };
        let transac = await this.state.instanceContract.getPastEvents('Winner', options);
        let winPropDescription = transac[0].returnValues._description;
        let winPropID = transac[0].returnValues._proposalId;
        let winPropVoteCount = transac[0].returnValues._voteCount;
        console.log("winPropDescription", winPropDescription);
        console.log("winPropID", winPropID);
        console.log("winPropVoteCount", winPropVoteCount);

        // console.log("WinningProp");
        this.setState({ winPropDescription: transac[0].returnValues._description, winPropID: transac[0].returnValues._proposalId, winPropVoteCount: transac[0].returnValues._voteCount });
    }



    render() {
        if (!this.state.web3) { // Affichage conditionnel.
            return (
                <div>
                    Please be patient.
                    <br />Loading Web3, accounts, and contract...
                </div>
            );
        }
        else if(this.state.owned) { // Affichage conditionnel pour l'administrateur.
            return (
                <div className = "container containerAdmin">
                    <h1>Dashboard<br />administrateur</h1>
                    <div>
                        <span className = "infoAdmin">ID du réseau : {this.state.networkId}</span>
                        <span className = "infoAdmin">Adresse du contrat : {this.state.contractAddress}</span>
                    </div>
                    <Welcome data = {this.state} />
                    <div className = "flexRow">
                        <div className = "WorkfFlowStatus">
                            <div className = {`WorkfFlow_Step ${this.state.displayWorkflowStatus[0]}`} >1. Enregistrement des votants</div>
                            <div className = {`WorkfFlow_Step ${this.state.displayWorkflowStatus[1]}`} onClick={this.startProposalsRegistering.bind(this)}>2. Début enregistrement des propositions</div>
                            <div className = {`WorkfFlow_Step ${this.state.displayWorkflowStatus[2]}`} onClick={this.endProposalsRegistering.bind(this)}>3. Fin de l'enregistrement des propositions</div>
                            <div className = {`WorkfFlow_Step ${this.state.displayWorkflowStatus[3]}`} onClick={this.startVotingSession.bind(this)}>4. Début enregistrement des votes</div>
                            <div className = {`WorkfFlow_Step ${this.state.displayWorkflowStatus[4]}`} onClick={this.endVotingSession.bind(this)}>5. Fin de l'enregistrement des votes</div>
                            <div className = {`WorkfFlow_Step ${this.state.displayWorkflowStatus[5]}`} onClick={this.tallyVotes.bind(this)}>6. Dépouillage des votes</div>
                        </div>
                        <div className = "flexColumn">
                            <RegisterAddress data = {this.state} />
                        </div>
                    </div>

                </div>
                );
        }
        else if(this.state.isRegistered_TEMP) { // Affichage conditionnel pour 1 votant enregistré.
            return (
                <div className = "container containerVotant">
                    <h1>Espace votant</h1>
                    <Welcome data = {this.state} />
                    {this.state.currentWorkflowStatus === 1 ? ( <RegisterProposal data = {this.state} /> ): (<></>)}
                    {this.state.currentWorkflowStatus === 3 ? ( <Vote4Proposal data = {this.state} /> ): (<></>)}
                    {this.state.currentWorkflowStatus === 5 ? ( <WinningProposal data = {this.state} /> ): (<></>)}
                    {/* <div onClick={this.WinningProp.bind(this)}>6. Dépouillage des votes</div> */}
                </div>
            );
        }
        else { // Affichage conditionnel pour 1 non-votant.
            return (
                <div className = "container containerNonVotant">
                    <div className = "mainApp mainAppError">
                        <h1>ERREUR :</h1>
                        <p>
                            <b>Votre adresse n'est pas enregistrée :</b>
                            <br />{this.state.accounts[0]}
                        </p>
                        <p>Vous ne pouvez donc pas participer au vote.</p>
                        <p><br />Merci de contacter l'administrateur.</p>
                    </div>
                </div>
            );
        }

    }
}

export default App;