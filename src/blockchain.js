import * as axios from 'axios';
import * as Q from 'q'

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
    }

    new_block(proof, previous_hash = null) {
        // Creates a new Block and add it to the chain
        const ph = previous_hash ? previous_hash : this.SHA256.hex(this.chain[this.chain.length - 1]) ;
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
        while(this.valid_proof(this.last_block().proof, proof)) {
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
        return this.SHA256.hex(`${last_proof}${proof}`).substring(0, 4) !== '0000'
    }

    static hash(block) {
        
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
        let last_block = this.chain[0];

        for(let i = 0; i < this.chain.length; i++) {
            let block = this.chain[i];
            if(block.previous_hash !== this.hash(last_block))  {
                return false;
            }

            if(!this.valid_proof(last_block.proof, block.proof)) {
                return false;
            }

            last_block = block;
        }

        return true;
    }

    /**
     * This is our Consensus Algorithm, it resolves conflicts
     * by replacing our chain with the longest one in the network.
     * 
     * @returns true if our chain was replaced, false if not
     */
    resolve_conflicts() {
        console.log('test')
        let new_chain = null;
        let max_length = this.chain.length;
        const deferred = Q.defer(); //using promises since these are asynchronous requests
    

        // Grab and verify the chains from all nodes in our network
        const requests = Array.from(this.nodes).map(node => axios.get(`${node}/chain`));
        console.log(`${Array.from(this.nodes)[0]}/chain`);
        Q.all(requests).then(responses => {
            let new_chain;
            responses
                .filter(response => response.status === 200)
                .forEach(response => {
                    console.log('test2')
                    let chain = response.data.chain
                    // Check if the length is longer and the chain is valid
                    if (chain.length > max_length && this.valid_chain(chain)) {
                        max_length = chain.length;
                        new_chain = chain;
                    }
                });
            
                console.log('test3')
            if (new_chain) {
                this.chain = new_chain;
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        });

        return deferred.promise;
    }
};

export default Blockchain;