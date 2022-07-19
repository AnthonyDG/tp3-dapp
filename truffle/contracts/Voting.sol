// SPDX-License-Identifier: MIT

pragma solidity 0.8.14;
import "@openzeppelin/contracts/access/Ownable.sol";
//import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting system
/// @author Alyra & Anthony de Gorlof
/// @notice Exercise #3 for Alyra school
/// @dev Some functions are only for admin/owner and others for registered voters. All functions are "external".

/**
 * The Dapp allows :
 *      - the registration of a whitelist of voters.
 *      - the administrator to start the proposal registering session.
 *      - registered voters to register their proposals.
 *      - the administrator to end the proposal registration session.
 *      - the administrator to begin the voting session.
 *      - registered voters to vote for their preferred proposals.
 *      - the administrator to end the voting session.
 *      - the administrator to tally the votes.
 *      - everyone to see the only one proposal wich won.
 * 
 * And the Dapp disallows :
 *      - to register the same voter twice times.
 *      - to call functions out of the decided workflow.
 *      - non voters to vote.
 *      - to register an empty proposal.
 *      - to vote twice times.
 *      - to vote for an inexistant proposal.
 */

contract Voting is Ownable {

    uint public winningProposalId;

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus public workflowStatus;
    Proposal[] public proposalsArray;
    mapping (address => Voter) public voters;

    /// @dev trigger an event when a voter is registered.
    /// @param _voterAddress Address of a voter.
    event VoterRegistered(address _voterAddress); 

    /// @dev trigger an event when workflow status has changed.
    /// @param _previousStatus status before.
    /// @param _newStatus current status.
    event WorkflowStatusChange(WorkflowStatus _previousStatus, WorkflowStatus _newStatus);

    /// @dev trigger an event when a proposal is registered.
    /// @param _proposalId ID of the registered proposal.
    event ProposalRegistered(uint _proposalId);

    /// @dev trigger an event when a voter has voted.
    /// @param _voter Address of a voter.
    /// @param _proposalId ID of the voted proposal.
    event Voted (address _voter, uint _proposalId);

    /// @dev trigger an event about the proposal winner.
    /// @param _proposalId ID of the winning proposal.
    /// @param _description Description of the winning proposal.
    /// @param _voteCount Counted votes of the winning proposal.
    event Winner(uint _proposalId, string _description, uint _voteCount);


    /// @dev Check if a voter is registered when 'onlyVoters' is called. Revert.
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    /// @dev Check if it called from a wrong status step. Revert.
    /// @param _status The current workflow status allowed.
    modifier flowStatus(WorkflowStatus _status) {
        require(workflowStatus == _status, "You can't do this now");
        _;
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Show informations about a voter.
    /// @dev Returns the voter object of a given address.
    /// @param _addr The address of a voter.
    /// @return Voter The informations about a voter depending on his address.
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    /// @notice Show the description of a proposal.
    /// @dev Returns a proposal of a given ID.
    /// @param _proposalId The ID of a proposal.
    /// @return Proposal The description of a proposal depending on his ID.
    function getOneProposal(uint _proposalId) external view returns (Proposal memory) {
        return proposalsArray[_proposalId];
    }

    // ::::::::::::: REGISTRATION ::::::::::::: //

    /// @notice Add a voter in whitelist.
    /// @dev Only Admin/owner can register addresses of voters.
    /// @param _addr The address of a voter.
    function addVoter(address _addr) external flowStatus(WorkflowStatus.RegisteringVoters) onlyOwner {
        require(voters[_addr].isRegistered != true, "Already registered");

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    // ::::::::::::: PROPOSAL ::::::::::::: //

    /// @notice Add a proposal by a registered voter.
    /// @dev Only registered voters can register proposals.
    /// @param _desc The description of a proposal.
    function addProposal(string memory _desc) external flowStatus(WorkflowStatus.ProposalsRegistrationStarted) onlyVoters {
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), "Vous ne pouvez pas ne rien proposer"); // facultatif

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    /// @notice Add a unique vote for a proposal by a registered voter.
    /// @dev Only registered voters can register an unique vote. 
    /// @param _proposalId The ID of the preferred proposal.
    function setVote(uint _proposalId) external flowStatus(WorkflowStatus.VotingSessionStarted) onlyVoters {
        require(voters[msg.sender].hasVoted != true, "You have already voted");
        require(_proposalId < proposalsArray.length, "Proposal not found"); // inutile de vérifier si _proposalId < 0 car c'est un uint. Donc, obligatoirement >= 0.
        require(proposalsArray.length > 0, "There are no proposal already registered");

        voters[msg.sender].votedProposalId = _proposalId;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_proposalId].voteCount++;

        // Following the last vote, check if the actual proposal (_proposalId) is the new winning proposal :
        if (proposalsArray[_proposalId].voteCount > proposalsArray[winningProposalId].voteCount) {
            winningProposalId = _proposalId;
        }

        emit Voted(msg.sender, _proposalId);
    }

    // ::::::::::::: STATE ::::::::::::: //

    /// @dev Allows admin/owner to start registering proposals.
    function startProposalsRegistering() external flowStatus(WorkflowStatus.RegisteringVoters) onlyOwner {
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @dev Allows admin/owner to end registering proposals.
    function endProposalsRegistering() external flowStatus(WorkflowStatus.ProposalsRegistrationStarted) onlyOwner {
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @dev Allows admin/owner to start voting session.
    function startVotingSession() external flowStatus(WorkflowStatus.ProposalsRegistrationEnded) onlyOwner {
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @dev Allows admin/owner to end voting session.
    function endVotingSession() external flowStatus(WorkflowStatus.VotingSessionStarted) onlyOwner {
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    // ::::::::::::: WINNER ::::::::::::: //

    function tallyVotes() external flowStatus(WorkflowStatus.VotingSessionEnded) onlyOwner {
        require(proposalsArray[winningProposalId].voteCount > 0, "There was no vote registered.");
        emit Winner(winningProposalId, proposalsArray[winningProposalId].description, proposalsArray[winningProposalId].voteCount);

        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }


    /// @notice Show the proposal winner.
    /// @dev Returns the informations the proposal winner of a given ID.
    /// @return uint ID of the the proposal winner.
    /// @return description description of the the proposal winner.
    /// @return voteCount Numbers of votes of the the proposal winner.
    function getWinner() external view flowStatus(WorkflowStatus.VotingSessionEnded) returns (uint, string memory description, uint voteCount) {
        // emit Winner(winningProposalId, proposalsArray[winningProposalId].description, proposalsArray[winningProposalId].voteCount);
        // workflowStatus = WorkflowStatus.VotesTallied;
        // emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
        return (winningProposalId, proposalsArray[winningProposalId].description, proposalsArray[winningProposalId].voteCount);
    }
}