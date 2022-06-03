// ==UserScript==
// @name         douban-backup-statuses
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  export douban broadcast
// @author       Chenqi
// @match        https://www.douban.com/people/*/statuses*
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


function determine_status_type(status) {
	let item = status.children[0];
	if (item.classList.contains('reshared_by')) { return 'forward_direct'; }
	if (item.dataset.action == '0') { return 'forward'; }
	if (item.dataset.action == '9' && item.dataset.objectKind == '0') { return 'sign'; }
	if (item.dataset.targetType == 'book') { return 'book'; }
	if (item.dataset.targetType == 'movie') { return 'movie'; }
	switch (item.dataset.action) {
		case '1': return 'saying';
		case '2': return 'images';
		case '5': return 'member';
		case '8': return 'group';
		case '9': return 'club';
	}
	return;
}

function save_status_basic(status, obj) {
	let item = status.children[0];
	let mod = item.children[0];
	let hd = mod.children[0];
	let bd = mod.children[1];
	let text = hd.children[1];
	let actions = bd.children[1];

	obj.status_id = item.dataset.sid;
	obj.status_time = actions.children[0].title;
	obj.user_id = item.dataset.uid;
	obj.user_name = text.children[0].innerText;
}


function save_status_saying(status, obj, data) {
	save_status_basic(status, obj);

	let bd = status.children[0].children[0].children[1];
	let status_saying = bd.children[0];

	data.text = status_saying.children[0].innerText;
}

function save_status_images(status, obj, data) {
	save_status_saying(status, obj, data);

	let bd = status.children[0].children[0].children[1];
	let status_saying = bd.children[0];
	let img_list = status_saying.lastElementChild.children[0].children;

	data.img_list = [];
	for (let j = 0; j < img_list.length; j++) {
		data.img_list.push(img_list[j].children[0].src);
	}
}

function save_status_forward(status, obj, data) {
	save_status_basic(status, obj);

	let text = status.children[0].children[0].children[0].children[1];
	let shared = status.children[1];

	data.text = text.children[1].innerText;
	data.status = backup_status(shared);
}

function save_status_book(status, obj, data) {
	save_status_basic(status, obj);

	let bd = status.children[0].children[0].children[1];
	let book = bd.children[0].children[0].children[0];
	let text = status.children[0].children[0].children[0].children[1];

	data.name = book.title;
	data.url = book.href;
	data.status = text.childNodes[2].textContent.trim();
	if (text.children.length > 1) {
		let review = text.children[1].children[0];
		if (review.classList.contains('rating-stars')) {
			data.rating = review.innerText;
			data.review = review.nextElementSibling.innerText;
		} else {
			data.review = review.innerText;
		}
	}
}

function save_status_movie(status, obj, data) {
	save_status_basic(status, obj);

	let bd = status.children[0].children[0].children[1];
	let movie = bd.children[0].children[0].children[0];
	let text = status.children[0].children[0].children[0].children[1];

	data.name = movie.title;
	data.url = movie.href;
	data.status = text.childNodes[2].textContent.trim();
	if (text.children.length > 1) {
		let review = text.children[1].children[0];
		if (review.classList.contains('rating-stars')) {
			data.rating = review.innerText;
			data.review = review.nextElementSibling.innerText;
		} else {
			data.review = review.innerText;
		}
	}
}

function save_status_member(status, obj, data) {
	save_status_basic(status, obj);

	let bd = status.children[0].children[0].children[1];

	data.name = bd.children[0].children[1].children[0].children[0].innerText;
	data.url = bd.children[0].children[0].children[0].href;
}

function save_status_group(status, obj, data) {
	save_status_basic(status, obj);

	let bd = status.children[0].children[0].children[1];

	data.name = bd.children[0].children[1].children[0].children[0].innerText;
	data.url = bd.children[0].children[0].children[0].children[0].href;
}

function save_status_club(status, obj, data) {
	save_status_basic(status, obj);

	let bd = status.children[0].children[0].children[1];

	data.name = bd.children[0].children[1].children[0].children[0].innerText;
	data.url = bd.children[0].children[0].children[0].children[0].href;
}

function save_status_sign(status, obj, data) {
	let item = status.children[0];
	let mod = item.children[0];
	let hd = mod.children[0];
	let text = hd.children[1];

	obj.status_id = item.dataset.sid;
	obj.status_time = '';
	obj.user_id = item.dataset.uid;
	obj.user_name = text.children[0].innerText;

	data.signature = text.children[1].innerText;
}

async function backup_status(status) {
	let obj = {};
	obj.type = determine_status_type(status);
	obj.data = {};
	switch (obj.type) {
		case 'saying': save_status_saying(status, obj, obj.data); break;
		case 'images': save_status_images(status, obj, obj.data); break;
		case 'forward': save_status_forward(status, obj, obj.data); break;
		case 'book': save_status_book(status, obj, obj.data); break;
		case 'movie': save_status_movie(status, obj, obj.data); break;
		case 'member': save_status_member(status, obj, obj.data); break;
		case 'club': save_status_club(status, obj, obj.data); break;
		case 'group': save_status_group(status, obj, obj.data); break;
		case 'sign': save_status_sign(status, obj, obj.data); break;
		default: skip_status(status); return;
	}
	await save_status(status, obj);
	check_comments(status);
}

function skip_status(status) {
	console.log('skipped status:' + status.dataset.sid);
}

function check_comments(status) {
	try {
		let bd = status.children[0].children[0].children[1];
		let count = bd.children[1].children[1].dataset.count;
		if (count == 0) { return; }
		window.open(bd.children[1].children[0].children[0].href, "_blank");
	} catch (e) {
	}
}

function save_status(status, obj) {
	return new Promise(resolve => {
		GM_xmlhttpRequest({
			method: 'POST',
			url: 'http://localhost:12312/status',
			data: JSON.stringify(obj),
			onload: resolve,
		});
	});
}

function export_status() {
	GM_xmlhttpRequest({
		method: 'POST',
		url: 'http://localhost:12312/export',
	});
}

async function do_backup() {
	let stream_items = document.getElementById('db-usr-profile').nextElementSibling;
	let status_list = stream_items.children;
	for (let i = 0; i < status_list.length; i++) {
		let status = status_list[i];
		if (!status.classList.contains('status-wrapper')) { continue; }
		await backup_status(status);
	}
	if (status_list.length == 0) { return; }
	window.open(stream_items.nextElementSibling.lastElementChild.lastElementChild.href, '_self');
}
