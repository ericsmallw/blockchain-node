class Block {
    constructor(index, transactions, proof, previous_hash) {
        this.index = index;
        this.transactions = transactions;
        this.proof = proof;
        this.previous_hash = previous_hash;
        this.timestamp = (new Date()).getTime();
    }
}

export default Block;