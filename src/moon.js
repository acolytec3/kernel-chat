'use strict'
/* eslint-disable no-console */
const PeerId = require('peer-id')
const Node = require('./libp2p_bundle')
const multaddr = require('multiaddr')
const chalk = require('chalk');
const emoji = require('node-emoji')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')


async function run() {
    const [moonId, earthId] = await Promise.all([
        PeerId.createFromJSON(require('./ids/moonId')),
        PeerId.createFromJSON(require('./ids/earthId.json'))
      ])
    const nodeListener = new Node({
        peerId: moonId,
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/10333']
        }
    })
    nodeListener.connectionManager.on('peer:connect', (connection) => {
        console.log('connected to: ', connection.remotePeer.toB58String())
    })

    await nodeListener.handle('/chat/1.0.0', (p, conn) => {
        pull(
            p,
            conn
        )
        pull(
            conn,
            pull.map((data) => {
                return data.toString('utf8').replace('\n', '')
            }),
            pull.drain(console.log)
        )
        process.stdin.setEncoding('utf8')
        process.openStdin().on('data', (chunk) => {
            var data = `${chalk.blue("Message received from Earth: ")}\n\n`
            + chunk.toString() + `\n${emoji.get('incoming_envelope')}
            ${chalk.blue("  Send message from Moon:")}`
            
            p.push(data)
        })
    })

    await nodeListener.start()

    console.log(emoji.get('moon'), chalk.blue(' Moon ready '),
        emoji.get('headphones'), chalk.blue(' Listening on: '));
    nodeListener.multiaddrs.forEach((ma) => {
        console.log(ma.toString() + '/p2p/' + moonId.toB58String())
    })
    console.log('\n' + emoji.get('moon'), chalk.blue(' Moon trying to connect with Earth '),
        emoji.get('large_blue_circle'));
}


run();

