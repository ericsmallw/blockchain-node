import { v4 } from 'uuid';
import Blockchain from "./../src/blockchain";

describe('Blockchain', () => {
    let blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
    });

    it('should have only a genesis lock when first instantiated', () => {
        expect(blockchain.chain.length).toEqual(1);
        expect(blockchain.chain[0].proof).toEqual(100);
        expect(blockchain.chain[0].previous_hash).toEqual(1);
    });

    it('should have no transactions when instantiated', () => {
        expect(blockchain.current_transactions.length).toEqual(0);
    });

    it('should have no registered nodes when instantiated', () => {
        expect(Array.from(blockchain.nodes).length).toEqual(0);
    });

    it('should return a proof of work when mined', () => {
        const address = v4().replace(/-/g, 'x');
        const pow = blockchain.proof_of_work(address);
        expect(pow.message).toEqual('New Block Forged');
        expect(pow.index).toEqual(2);
        expect(pow.previous_hash).not.toEqual(100);
    });

    it('should add a new block', () => {
        blockchain.new_block();
        expect(blockchain.chain.length).toEqual(2);
    });
});