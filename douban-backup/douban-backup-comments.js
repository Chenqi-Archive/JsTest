// ==UserScript==
// @name         douban-backup-comments
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  export douban broadcast
// @author       Chenqi
// @match        https://www.douban.com/people/*/status/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=douban.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==


function create(element_type, class_name, child_list = [], callback = obj => { }) {
	let obj = document.createElement(element_type);
	obj.className = class_name;
	obj.append(...child_list);
	callback(obj);
	return obj;
}

function load_css(code) {
	document.getElementsByTagName('head')[0].append(create('style', '', [
		document.createTextNode(code)
	], obj => {
		obj.type = 'text/css';
		obj.rel = 'stylesheet';
	}));
}


(function () {

	load_css(`
		.backup-command-group {
			margin-bottom : 10px;
		}
		.backup-command {
			border: 0px;
			padding: 5px 10px;
			margin-right: 5px;
		}
		.backup-command:hover {
			background-color : lightgray;
		}
	`);

	document.getElementById('content').prepend(
		create('div', 'backup-command-group', [
			create('button', 'backup-command', [document.createTextNode('backup')], obj => {
				obj.onclick = do_backup;
			}),
			create('button', 'backup-command', [], async obj => {
				obj.innerText = await GM_getValue('douban-auto-backup-config', false) ? 'on' : 'off';
				obj.onclick = () => {
					obj.innerText = obj.innerText == 'on' ? 'off' : 'on';
					GM_setValue('douban-auto-backup-config', obj.innerText == 'on');
				};
				if (obj.innerText == 'on') {
					do_backup();
				}
			}),
			create('button', 'backup-command', [document.createTextNode('export')], obj => {
				obj.onclick = export_status;
			}),
		])
	);
})();


function export_status () {
	GM_xmlhttpRequest({
		method: 'POST',
		url: 'http://localhost:12312/export',
	});
}

function do_backup() {
	let obj = {};
	obj.status_id = document.getElementById('content').children[2].children[0].children[0].dataset.sid;
	obj.comment_list = [];

	let comment_list = document.getElementById('comments').children[0].children[0].children;
	for (let i = 0; i < comment_list.length; i++) {
		let comment = {};
		let item = comment_list[i].children[0].children[1];

		comment.user_name = item.children[0].children[0].title;
		comment.user_url = item.children[0].children[0].href;
		comment.time = item.children[0].children[2].innerText;
		comment.text = item.children[1].innerText;

		if (comment_list[i].children.length > 1) {
			comment.reply_list = [];

			let reply_list = comment_list[i].children[1].children;
			for (let j = 0; j < reply_list.length; j++) {
				let reply = {};
				let reply_item = reply_list[j].children[0].children[1];

				reply.user_name = reply_item.children[0].children[0].title;
				reply.user_url = reply_item.children[0].children[0].href;
				reply.time = reply_item.children[0].children[2].innerText;
				reply.text = reply_item.children[1].innerText;

				comment.reply_list.push(reply);
			}
		}

		obj.comment_list.push(comment);
	}

	GM_xmlhttpRequest({
		method: 'POST',
		url: 'http://localhost:12312/comment',
		data: JSON.stringify(obj),
		onload: window.close,
	});
}
