# TP n°3 DApp System Voting.

3 vidéos à visualiser en ligne ou à télécharger :
 - Démo de la Dapp (sur Ganache)
 - Codes-Source
 - Tests unitaires (ETH-GAS & Coverage)
https://www.brainy-club.fr/Alyra-cpmd4dqwpfgh5wskz/

Déploiement de la DApp sur Ropsten (Contract address : "0x5f7b739334bBa6c9126f9037E58Ece3322bAB7e5")
https://anthonydg.github.io/tp3-dapp/


Le rapport de COVERAGE est ici : https://github.com/AnthonyDG/tp3-dapp/tree/main/truffle/test


## Dans la DApp :

### Espace administrateur :
 Lors de l'enregistrement des votants :
 - Vérifie si l'adresse est bien en hexadécimal (à part les 2 premiers carac.) et de longuer 42.
 - Vérifie si l'adresse a déjà été enregistrée (pas de doublon).
 - Ne pas pouvoir enregistrer de votant une fois la session passée.
 - Ne pas pouvoir cliquer sur startProposalsRegistering() avant qu'il y ait au moins 1 votant !

 - Les boutons s'activent en fonction de l'étape en cours (Workflow) :
   - Bouton en cours (blanc) : non cliquable
   - Bouton prochaine étape (violet) : cliquable
   - Bouton étape non prévue (blue foncé) : non cliquable

### Espace votant :
 - Vérifie que la proposition enregistrée n'est pas vide.
 - Vérifie que le vote est un nombre.
 - Vérifie quelle proposition a gagné.

### Espace non-votant :
 - Ecran rouge invitant à ne pas revenir.



# React Truffle Box

This box comes with everything you need to start using Truffle to write, compile, test, and deploy smart contracts, and interact with them from a React app.

## Installation

First ensure you are in an empty directory.

Run the `unbox` command using 1 of 2 ways.

```sh
# Install Truffle globally and run `truffle unbox`
$ npm install -g truffle
$ truffle unbox react
```

```sh
# Alternatively, run `truffle unbox` via npx
$ npx truffle unbox react
```

Start the react dev server.

```sh
$ cd client
$ npm start
  Starting the development server...
```

From there, follow the instructions on the hosted React app. It will walk you through using Truffle and Ganache to deploy the `SimpleStorage` contract, making calls to it, and sending transactions to change the contract's state.

## FAQ

- __How do I use this with Ganache (or any other network)?__

  The Truffle project is set to deploy to Ganache by default. If you'd like to change this, it's as easy as modifying the Truffle config file! Check out [our documentation on adding network configurations](https://trufflesuite.com/docs/truffle/reference/configuration/#networks). From there, you can run `truffle migrate` pointed to another network, restart the React dev server, and see the change take place.

- __Where can I find more resources?__

  This Box is a sweet combo of [Truffle](https://trufflesuite.com) and [Create React App](https://create-react-app.dev). Either one would be a great place to start!
