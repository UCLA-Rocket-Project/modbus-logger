module.exports = function handleArgs() {
	const args = process.argv.slice(2);
	for(let arg of args) {
		if(arg == 'config') {
			const configPath = require.resolve("./config.json")
			console.log(configPath)
			return true;
		}
	}
}