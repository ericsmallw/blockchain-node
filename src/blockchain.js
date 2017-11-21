import * as axios from 'axios';

import Block from './block';
import Transaction from './transaction';
import * as Hashes from 'jshashes';


class Blockchain {

    constructor() {
        this.SHA256 = new Hashes.SHA256;
        this.chain = [];
        this.current_transactions = [];
        this.nodes = new Set();

        //create genesis block
        this.new_block(100, 1);

        // make sure all functions in class maintain correct context
        this.new_block = this.new_block.bind(this);
        this.valid_chain = this.valid_chain.bind(this);
        this.new_block = this.new_block.bind(this);
        this.last_block = this.last_block.bind(this);
        this.proof_of_work = this.proof_of_work.bind(this);
        this.valid_proof = this.valid_proof.bind(this);
        this.hash = this.hash.bind(this);
        this.register_node = this.register_node.bind(this);
        this.resolve_conflicts = this.resolve_conflicts.bind(this);
    }

    new_block(proof, previous_hash = null) {
        // Creates a new Block and add it to the chain
        const ph = previous_hash ? previous_hash : this.SHA256.hex(this.chain[this.chain.length - 1]);
        let block = new Block(this.chain.length + 1, this.current_transactions, proof, ph);
        this.current_transactions = [];
        this.chain.push(block);
    }

    new_transaction(sender, recipient, amount) {
        this.current_transactions.push(new Transaction(sender, recipient, amount));
        return this.last_block().index + 1;
    }

    last_block() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Simple Proof of Work Algorithm:
     * - Find a number p' such that hash(pp') contains leading 4 zeroes, where p is the previous p'
     * - p is the previous proof, and p' is the new proof
     * @param {*} address address of user that is mining
     */
    proof_of_work(address) {
        let proof = 0;
        while (!this.valid_proof(this.last_block().proof, proof)) {
            proof++;
        }

        this.new_transaction('0', address, 1);
        this.new_block(proof);

        return {
            message: 'New Block Forged',
            index: this.last_block().index,
            transactions: this.last_block().transactions,
            proof: this.last_block().proof,
            previous_hash: this.last_block().previous_hash
        };
    }

    /**
     * Validates the proof: Does hash(last_proof, proof) contain 4 leading zeroes?
     *
     * @param {*} last_proof Previous Proof
     * @param {*} proof Current Proof
     * @returns number
     */
    valid_proof(last_proof, proof) {
        return this.SHA256.hex(`${last_proof}${proof}`).substring(0, 4) === '0000'
    }

    hash(block) {
        return this.SHA256.hex(block);
    }

    /**
     * 
     * @param {*} address : Address of node. Eg. 'http://192.168.0.5'
     * @returns : null
     */
    register_node(address) {
        this.nodes.add(address);
    }

    /**
     * Determine if a given blockchain is valid
     * 
     * @param {*} chain A blockchain
     * @returns boolean - true if valid, false if not
     */
    valid_chain(chain) {
        let last_block = chain[0];

        for (let i = 1; i < chain.length; i++) {
            let block = chain[i];
            if (block.previous_hash !== this.hash(last_block)) {
                return false;
            }

            if (!this.valid_proof(last_block.proof, block.proof)) {
                return false;
            }

            last_block = block;
        }

        return true;
    }

    /**
     * This is our Consensus Algorithm, it resolves conflicts
     * by replacing our chain with the longest one in the network.
     * Since this version uses async http calls, I return a promise
     * with this function.
     * 
     * @returns true if our chain was replaced, false if not
     */
    resolve_conflicts() {
        return new Promise((resolve, reject) => {
            // Grab and verify the chains from all nodes in our network
            const requests = Array.from(this.nodes).map(node => axios.get(`${node}/chain`));
            Promise.all(requests).then(
                responses => {
                    let new_chain;

                    responses
                        .filter(response => response.status === 200)
                        .forEach(response => {
                            let chain = response.data.chain
                            // // Check if the length is longer and the chain is valid
                            if (chain.length > this.chain.length && this.valid_chain(chain)) {
                                new_chain = chain;
                            }
                        });
    
                    
                    if (new_chain) {
                        this.chain = new_chain;
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
                () => {
                    reject(false);
                }
            );
        });
    }
}

export default Blockchain;