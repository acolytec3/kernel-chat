'use strict'
/* eslint-disable no-console */
const PeerId = require('peer-id')
const multiaddr = require('multiaddr')
const Node = require('./libp2p_bundle')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')

const chalk = require('chalk');
const emoji = require('node-emoji')

async function run() {
    const [moonId, earthId] = await Promise.all([
        PeerId.createFromJSON(require('./ids/moonId')),
        PeerId.createFromJSON(require('./ids/earthId.json'))
      ])
    const nodeListener = new Node({
        peerId: earthId,
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/10334']
        }
    })
    nodeListener.connectionManager.on('peer:connect', (connection) => {
        console.log('connected to: ', connection.remotePeer.toB58String())
    })

    await nodeListener.handle('/chat/1.0.0', (p, conn) => {
        console.log('\n' + emoji.get('large_blue_circle'),
        chalk.blue(' Earth dialed to Moon on protocol: /chat/1.0.0'));
console.log(`${emoji.get('incoming_envelope')}
         ${chalk.bold(`Type a message and press enter. See what happens...`)}`)

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
            var data = `${chalk.blue("Message received from Moon: ")}\n\n`
            + chunk.toString() + `\n${emoji.get('incoming_envelope')}
            ${chalk.blue("  Send message from Earth:")}`
            
            p.push(data)
        })
    })

    await nodeListener.start()

    console.log(emoji.get('large_blue_circle'), chalk.blue(' Earth ready '),
        emoji.get('headphones'), chalk.blue(' Listening on: '));
    nodeListener.multiaddrs.forEach((ma) => {
        console.log(ma.toString() + '/p2p/' + earthId.toB58String())
    })
    console.log('\n' + emoji.get('large_blue_circle'), chalk.blue(' Earth trying to connect with Moon '),
        emoji.get('moon'));

    const listenerMa = multiaddr(`/ip4/127.0.0.1/tcp/10333/p2p/${moonId.toB58String()}`)
    const { stream } = await nodeListener.dialProtocol(listenerMa, '/chat/1.0.0')
}


run();

