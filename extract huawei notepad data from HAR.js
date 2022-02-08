const fs = require('fs');


function convertTimeStamp(number) {
	const time = new Date(number);
	function str(number) { return ('00' + number).slice(-2); }
	return str(time.getFullYear()) + str(time.getMonth() + 1) + str(time.getDate()) + ' ' +
		str(time.getHours()) + str(time.getMinutes()) + str(time.getSeconds());
}

function convertTimeStampFull(number) {
	const time = new Date(number);
	function str(number) { return ('00' + number).slice(-2); }
	return str(time.getFullYear()) + '-' + str(time.getMonth() + 1) + '-' + str(time.getDate()) + ' ' +
		str(time.getHours()) + ':' + str(time.getMinutes()) + ':' + str(time.getSeconds());
}

function main() {
	const log = JSON.parse(fs.readFileSync('R:\\cloud.huawei.com.har'));
	log.log.entries.filter(entry =>
		entry.request.url === 'https://cloud.huawei.com/notepad/note/query'
	).forEach(entry => {
		const obj = JSON.parse(JSON.parse(entry.response.content.text).rspInfo.data).content;
		fs.writeFileSync('R:\\notes\\' + convertTimeStamp(obj.created) + '.txt',
			'created: ' + convertTimeStampFull(obj.created) + '\n' +
			'modified: ' + convertTimeStampFull(obj.modified) + '\n\n' +
			obj.content.substring(5)
		);
	});
}

main();