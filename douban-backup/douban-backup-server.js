const express = require('express');
const bodyParser = require('body-parser');
const download = require('download');
const fs = require('fs');

const app = express();

app.use(bodyParser.text());

var status = new function () {
	this.map = new Map();
	this.add = function (obj) {
		this.map.set(obj.status_id, obj);
	};
	this.comment = function (obj) {
		this.map.get(obj.status_id).comment_list = obj.comment_list;
	};
	this.export = function () {
		let dir_name = 'R:\\douban-20220602\\';
		let list = Array.from(this.map.values()).sort((a, b) => { return b.status_id - a.status_id; });
		fs.mkdirSync(dir_name);
		fs.writeFileSync(dir_name + 'statuses.json', JSON.stringify(list, null, 4));
		list.filter(item => item.type == 'images').forEach(item => {
			item.data.img_list.forEach(img => download(img, dir_name + 'images\\'));
		})
	};
};

app.post('/status', (req, res) => {
	status.add(JSON.parse(req.body));
	res.send();
});

app.post('/comment', (req, res) => {
	status.comment(JSON.parse(req.body));
	res.send();
});

app.post('/export', (req, res) => {
	status.export();
	res.send();
});

app.listen(12312);
