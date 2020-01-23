#!/usr/bin/env node
const handleArgs = require('./handleArgs')
if(handleArgs()) {
	process.exit(0)
}
const config = require('./config')
const Modbus = require('jsmodbus')
const SerialPort = require('serialport')
const fs = require('fs')
const options = {
	baudRate: 115200
}
const socket = new SerialPort(config.device, options)
const client = new Modbus.client.RTU(socket, 15)
const writeStream = fs.createWriteStream(config.file, {
	flags: 'a'
})

socket.on('open', async () => {
	const stats = fs.statSync(config.file)
	const fileSize = stats["size"]
	if(fileSize == 0) {
		writeStream.write(createHeader())
	}
	const cache = createCache()
	let lastUpdate = Date.now()
	let lastPrint = Date.now()
	while(true) {
		if(Date.now() < lastUpdate + config.updateTime) {
			continue
		}
		const start = Date.now()
		let regs = []
		try {
			regs = await client.readInputRegisters(config.startRegister, 3)
		}
		catch (e) {
			console.error(e)
			continue
		}
		const values = regs.response.body.values
		const valueStr = values.join(',')
		writeStream.write(valueStr)

		if(Date.now() > lastPrint + config.printTime) {
			const indicies = new Array(values.length).fill(0)
			// build cache
			for(let i = 0; i < values.length; i++) {
				let labelIdx = config.regLabels[i]
				if(labelIdx == 0) {
					continue
				}
				const signed = labelIdx < 0
				labelIdx--
				labelIdx = Math.abs(labelIdx)
				const val = signed ? Math.pow(2, 16) - values[i] : values[i]
				cache[config.labels[labelIdx]][indicies[labelIdx]] = values[i]
				indicies[labelIdx]++
			}
			console.log(JSON.stringify(cache))
			lastPrint = Date.now()
		}

		writeStream.write(`,${lastUpdate}\n`)
		const delta = Date.now() - lastUpdate
		//console.log(delta)

		lastUpdate = start
	}
})

function createHeader() {
	let header = ''
	for(let i = 0; i < config.regLabels.length; i++) {
		const lblIdx = config.regLabels[i]
		if(lblIdx == 0) {
			header += '0,'
		}
		else {
			lblIdx = Math.abs(lblIdx)
			header += `${config.labels[lblIdx - 1]},` 
		}
	}
	header += 'msTime\n'
	return header
}

function createCache() {
	const cache = Object.create(null)
	for(let i = 0; i < config.labels.length; i++) {
		cache[config.labels[i]] = new Array()
	}
	for(let i = 0; i < config.regLabels.length; i++) {
		let labelIdx = config.regLabels[i]
		if(labelIdx == 0) {
			continue
		}
		labelIdx--
		labelIdx = Math.abs(labelIdx)
		cache[config.labels[labelIdx]].push(0)
	}
	return cache
}