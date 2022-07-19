const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const vi = artifacts.require('Voting');

contract("Voting", function (accounts) {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];

  let Voting;

  context("Add Voters Phase", function() {

    beforeEach(async function () {
      Voting = await vi.new({from: owner});
    })

      it('Test on only Owner', async function () {
        await expectRevert(Voting.addVoter(voter1, {from: voter1}),
        "Ownable: caller is not the owner")
      });

      it("Test duplicated addresses", async () => {
        Voting.addVoter(voter1, {from: owner})
        await expectRevert(Voting.addVoter(voter1, { from: owner }), "Already registered");
      });
    
      it("Add voter pass, test event", async function () {
        let receipt = await Voting.addVoter(voter1, {from: owner})
        expectEvent(receipt, "VoterRegistered", {_voterAddress: voter1});
      });

      it("Add voter pass, test isRegistered", async function () {
        await Voting.addVoter(voter1, {from: owner})
        let VoterRegisteredBool = await Voting.getVoter(voter1, {from: voter1})
        expect(VoterRegisteredBool.isRegistered).to.equal(true);
      });

      it("Add voter cant pass if wrong workflow ", async function () {
        await Voting.startProposalsRegistering({from: owner})
        await expectRevert(Voting.addVoter(voter1, {from: owner}), "You can't do this now")
      });
    })

  context("Add Proposal Phase", function() {
    beforeEach(async function () {
        Voting = await vi.new({from: owner});
        await Voting.addVoter(voter1, {from: owner})
        await Voting.addVoter(voter2, {from: owner})
        await Voting.addVoter(voter3, {from: owner})

    })
    
      it('Test on require: not proposal registration state revert', async function () {
        await expectRevert(Voting.addProposal("voter1Proposal", {from: voter1}), "You can't do this now")
      })

      it('Test on require: non voter cant propose', async function () {
        await Voting.startProposalsRegistering({from: owner})
        await expectRevert(Voting.addProposal("BadOwner", {from: owner}), "You're not a voter")
      })

      it('Test on require: voter cant propose nothing', async function () {
        await Voting.startProposalsRegistering({from: owner})
        await expectRevert(Voting.addProposal("", {from: voter2}),
            "Vous ne pouvez pas ne rien proposer")
      })

      it("Proposal pass, test on proposal description and getter getOneProposal", async function () {
        await Voting.startProposalsRegistering({from: owner})
        await Voting.addProposal("proposalVoter1", {from: voter1})
        const ID = 0;
        let voter1ProposalID = await Voting.getOneProposal(ID , {from: voter1});
        expect(voter1ProposalID.description).to.be.equal("proposalVoter1");
      })

      it("Proposal pass, test on proposalRegistered event", async function () {
        await Voting.startProposalsRegistering({from: owner})
        let receipt  = await Voting.addProposal("proposalVoter1", {from: voter1})
        const ID = 0;
        expectEvent(receipt, "ProposalRegistered", {_proposalId: new BN(ID)});
      })

      it("1 Proposal pass, test on revert getter getOneProposal ID 1", async function () {
        await Voting.startProposalsRegistering({from: owner})
        await Voting.addProposal("proposalVoter1", {from: voter1})
        const ID = 1;
        await expectRevert.unspecified( Voting.getOneProposal(ID , {from: voter1}));
      })

      it("Multiple Proposal pass : concat", async function () {
        await Voting.startProposalsRegistering({from: owner})
        await Voting.addProposal("proposalVoter1", {from: voter1})
        await Voting.addProposal("proposalVoter2", {from: voter2})
        await Voting.addProposal("proposalVoter3", {from: voter3})

        let voter1ProposalID = await Voting.getOneProposal(0 , {from: voter1});
        let voter2ProposalID = await Voting.getOneProposal(1 , {from: voter2});
        let voter3ProposalID = await Voting.getOneProposal(2 , {from: voter3});

        expect(voter1ProposalID.description).to.be.equal("proposalVoter1");
        expect(voter2ProposalID.description).to.be.equal("proposalVoter2");
        expect(voter3ProposalID.description).to.be.equal("proposalVoter3");
      })

  })

  context("Voting Phase", function() {

    it('Test on numbers of proposals registered > 0', async function () {
      Voting = await vi.new({from: owner});
      await Voting.addVoter(voter1, {from: owner})
      await Voting.addVoter(voter2, {from: owner})
      await Voting.addVoter(voter3, {from: owner})
      await Voting.startProposalsRegistering({from: owner})
      // await Voting.addProposal("proposal 1", {from: voter1})
      // await Voting.addProposal("proposal 2", {from: voter2})
      await Voting.endProposalsRegistering({from: owner})
      await Voting.startVotingSession({from: owner});
      await expectRevert(Voting.setVote(0, {from: voter1}), "There are no proposal already registered");
    })



    beforeEach(async function () {
      Voting = await vi.new({from: owner});
      await Voting.addVoter(voter1, {from: owner})
      await Voting.addVoter(voter2, {from: owner})
      await Voting.addVoter(voter3, {from: owner})
      await Voting.startProposalsRegistering({from: owner})
      await Voting.addProposal("proposal 1", {from: voter1})
      await Voting.addProposal("proposal 2", {from: voter2})
      await Voting.endProposalsRegistering({from: owner})
    })

    it('Test on require: vote cant be done if not in the right worfkflow status', async function () {
      await expectRevert(Voting.setVote(1,{from: voter1}), "You can't do this now")
    })

    it('Concat : Test on requires: non voter cant propose, voter cant propose nothing, and voter cant vote twice', async function () {
        await Voting.startVotingSession({from: owner});
        await expectRevert(Voting.setVote(0, {from: owner}), "You're not a voter");
        await expectRevert(Voting.setVote(5, {from: voter1}), "Proposal not found");
        await Voting.setVote(0, {from: voter1});
        await expectRevert(Voting.setVote(1, {from: voter1}), "You have already voted");
      })

    it("vote pass: Voter 1 vote for proposal 1: Test on event", async function () {
      await Voting.startVotingSession({from: owner})
      let VoteID = 0;

      let receipt = await Voting.setVote(0, {from: voter1});
      expectEvent(receipt,'Voted', {_voter: voter1, _proposalId: new BN(VoteID)})
    })

    it("vote pass: Voter 1 vote for proposal 1: Test on voter attributes", async function () {
      await Voting.startVotingSession({from: owner})
      let VoteID = 0;
      
      let voter1Objectbefore = await Voting.getVoter(voter1, {from: voter1});
      expect(voter1Objectbefore.hasVoted).to.be.equal(false);

      await Voting.setVote(0, {from: voter1});
      let voter1Object = await Voting.getVoter(voter1, {from: voter1});

      expect(voter1Object.hasVoted).to.be.equal(true);
      expect(voter1Object.votedProposalId).to.be.equal(VoteID.toString());
    })
    
    it("vote pass: Voter 1 vote for proposal 1: Test on proposal attributes", async function () {
      await Voting.startVotingSession({from: owner})
      let VoteID = 0;

      await Voting.setVote(0, {from: voter1});
      let votedProposalObject = await Voting.getOneProposal(VoteID, {from: voter1});

      expect(votedProposalObject.description).to.be.equal("proposal 1");
      expect(votedProposalObject.voteCount).to.be.equal('1');
    })

    it("multiple vote pass: concat", async function () {
      await Voting.startVotingSession({from: owner})

      let receipt1 = await Voting.setVote(0, {from: voter1});
      let receipt2 = await Voting.setVote(1, {from: voter2});
      let receipt3 = await Voting.setVote(1, {from: voter3});

      expectEvent(receipt1,'Voted', {_voter: voter1, _proposalId: new BN(0)})
      expectEvent(receipt2,'Voted', {_voter: voter2, _proposalId: new BN(1)})
      expectEvent(receipt3,'Voted', {_voter: voter3, _proposalId: new BN(1)})

      /////

      let voter1Object = await Voting.getVoter(voter1, {from: voter1});
      let voter2Object = await Voting.getVoter(voter2, {from: voter1});
      let voter3Object = await Voting.getVoter(voter3, {from: voter1});

      expect(voter1Object.hasVoted).to.be.equal(true);
      expect(new BN(voter1Object.votedProposalId)).to.be.bignumber.equal(new BN(0));

      expect(voter2Object.hasVoted).to.be.equal(true);
      expect(new BN(voter2Object.votedProposalId)).to.be.bignumber.equal(new BN(1));
      
      expect(voter3Object.hasVoted).to.be.equal(true);
      expect(new BN(voter3Object.votedProposalId)).to.be.bignumber.equal(new BN(1));

      /////

      let votedProposalObject1 = await Voting.getOneProposal(0, {from: voter1});
      let votedProposalObject2 = await Voting.getOneProposal(1, {from: voter2});

      expect(votedProposalObject1.voteCount).to.be.equal('1');
      expect(votedProposalObject2.voteCount).to.be.equal('2');
    })
  })

  context("Tallying Phase & Get Winner", function() {

    it('Test on Current status and numbers of votes registered > 0', async function () {
      Voting = await vi.new({from: owner});
      await Voting.addVoter(voter1, {from: owner})
      await Voting.addVoter(voter2, {from: owner})
      await Voting.addVoter(voter3, {from: owner})
      await Voting.startProposalsRegistering({from: owner})
      await Voting.addProposal("voter1Proposal", {from: voter1})
      await Voting.addProposal("voter2Proposal", {from: voter2})
      await Voting.addProposal("voter3Proposal", {from: voter3})
      await Voting.endProposalsRegistering({from: owner})
      await Voting.startVotingSession({from: owner})
      await expectRevert(Voting.getWinner(), "You can't do this now")
      await Voting.endVotingSession({from: owner})
      await expectRevert(Voting.tallyVotes({from: owner}), "There was no vote registered.")
    })


    beforeEach(async function () {
      Voting = await vi.new({from: owner});
      await Voting.addVoter(voter1, {from: owner})
      await Voting.addVoter(voter2, {from: owner})
      await Voting.addVoter(voter3, {from: owner})
      await Voting.startProposalsRegistering({from: owner})
      await Voting.addProposal("voter1Proposal", {from: voter1})
      await Voting.addProposal("voter2Proposal", {from: voter2})
      await Voting.addProposal("voter3Proposal", {from: voter3})
      await Voting.endProposalsRegistering({from: owner})
      await Voting.startVotingSession({from: owner})
      await Voting.setVote(1, {from: voter1})
      await Voting.setVote(2, {from: voter2})
      await Voting.setVote(2, {from: voter3})
      })

      it('Test on require: tally vote cant be done if not in the right worfkflow status', async function () {
        await expectRevert(Voting.tallyVotes({from: owner}), "You can't do this now") 
      })

      it('Test on require: not the owner', async function () {
        await Voting.endVotingSession({from: owner})
        await expectRevert(
            Voting.tallyVotes({from: voter1}),
            "Ownable: caller is not the owner")
      })

      it('Tally pass, test on event on workflow status', async function () {
        await Voting.endVotingSession({from: owner})
        let receipt = await Voting.tallyVotes({from: owner});
        expectEvent(receipt,'WorkflowStatusChange', {_previousStatus: new BN(4), _newStatus: new BN(5)})
      })

      it('Tally pass, test on winning proposal description and vote count', async function () {
        await Voting.endVotingSession({from: owner})
        let receipt = await Voting.tallyVotes({from: owner});
        let winningID = await Voting.winningProposalId.call();
        let winningProposal = await Voting.getOneProposal(winningID, {from:voter1});
        expect(winningProposal.description).to.equal('voter3Proposal');
        expect(winningProposal.voteCount).to.equal('2');

        expectEvent(receipt,'Winner', {_proposalId: new BN(winningID), _description: 'voter3Proposal', _voteCount: new BN(2)})
      })

      it('Get winner', async function () {
        await Voting.endVotingSession({from: owner})
        const storedData = await Voting.getWinner.call();
        const {0: winningProposalId, 1: proposalDescription, 2: proposalVoteCount} = storedData;

        // console.log("winningProposalId", winningProposalId);
        // console.log("proposalDescription", proposalDescription);
        // console.log("proposalVoteCount", proposalVoteCount);
        // expect(new BN(winningProposalId)).to.equal(new BN(2));
        // expect(proposalDescription).to.equal('voter3Proposal');
        // expect(proposalVoteCount).to.equal(new BN(2));

        assert.equal(winningProposalId, 2, "The value 2 was not stored (winningProposalId).");
        assert.equal(proposalDescription, 'voter3Proposal', "The proposal description was not stored.");
        assert.equal(proposalVoteCount, 2, "The value 2 was not stored (proposalVoteCount).");
      })
  })


  context("Worfklow status tests", function() {

    beforeEach(async function () {
        Voting = await vi.new({from: owner});
    })

    // could do both test for every worflowStatus
    it('Generalisation: test on require trigger: not owner cant change workflow status', async function () {
        await expectRevert(
        Voting.startProposalsRegistering({from: voter2}),
        "Ownable: caller is not the owner")
    })

    it('Generalisation: test on require trigger: cant change to next next workflow status', async function () {
        await expectRevert(Voting.endProposalsRegistering({from: owner}), "You can't do this now")
    })

    it("Test on event: start proposal registering", async() => {
        let status = await Voting.workflowStatus.call();
        expect(status).to.be.bignumber.equal(new BN(0));
        let startProposal = await Voting.startProposalsRegistering({from:owner});
        expectEvent(startProposal, 'WorkflowStatusChange', {_previousStatus: new BN(0),_newStatus: new BN(1)});
    });

    it("Test on event: end proposal registering", async() => {
        await Voting.startProposalsRegistering({from:owner});
        let endProposal = await Voting.endProposalsRegistering({from:owner});
        expectEvent(endProposal, 'WorkflowStatusChange', {_previousStatus: new BN(1),_newStatus: new BN(2)});
    });

    it("Test on event: start voting session", async() => {
        await Voting.startProposalsRegistering({from:owner});
        await Voting.endProposalsRegistering({from:owner});
        let startVote = await Voting.startVotingSession({from:owner});
        expectEvent(startVote, 'WorkflowStatusChange', {_previousStatus: new BN(2),_newStatus: new BN(3)});
    });

    it("Test on event: end voting session", async() => {
        await Voting.startProposalsRegistering({from:owner});
        await Voting.endProposalsRegistering({from:owner});
        await Voting.startVotingSession({from:owner});
        let endVote = await Voting.endVotingSession({from:owner});
        expectEvent(endVote, 'WorkflowStatusChange', {_previousStatus: new BN(3),_newStatus: new BN(4)});
    });
  })
})