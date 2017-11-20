import * as express from 'express';
import * as bodyParser from 'body-parser';
import { v4 } from 'uuid';

import Blockchain from "./blockchain";

const blockchain = new Blockchain();

// Generate a globally unique address for this node
const node_identifier = v4().replace(/-/g, 'x');

// Set port based on command line arg otherwise default to port 3000
const portIndex = process.argv.indexOf("-p");
const port = portIndex >= 0 && !Number.isNaN(parseInt(process.argv[portIndex + 1])) 
    ? parseInt(process.argv[portIndex + 1]) 
    : 3000;

const app = express.default();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Blockchain is working!');
});

app.get('/mine', (req, res)=> {
    // We run the proof of work algorithm to get the next proof...
    const result = blockchain.proof_of_work(node_identifier);
    return res.send(result);
});

app.post('/transactions/new', (req, res) => {
    if (!req.body.sender || !req.body.recipient || !req.body.amount) {
        return res.status(400).send('Missing values');
    }

    //create a new transaction
    const index = blockchain.new_transaction(req.body.sender, req.body.recipient, req.body.amount);

    return res.status(201).send({
        message: `Transaction will be added to block ${index}`
    });
});

app.get('/chain', (req, res) => {
    return res.send({
        chain: blockchain.chain,
        length: blockchain.chain.length
    });
});

app.post('/nodes/register', (req, res) => {
    const nodes = req.body.nodes;

    if(!nodes) {
        res.status(400).send('Error: Please supply a valid list of nodes');
    }

    nodes.forEach(node => {
        blockchain.register_node(node);
    });

    res.status(201).send({
        message: 'New nodes have been added',
        total_nodes: Array.from(blockchain.nodes)
    });
});

app.get('/nodes/resolve', (req, res) => {
    blockchain.resolve_conflicts().then(
        (response) => {
            if(response) {
                res.send({
                    message: 'Our chain was replaced',
                    new_chain: blockchain.chain
                })
            } else {
                res.send({
                    message: 'Our blockchain is authoritative',
                    chain: blockchain.chain
                })
            }
        },
        (error => ({error: `An error has occured: ${error}`}))
    );
});

app.listen(port,() => console.log(`Blockchain listening on port ${port}`));