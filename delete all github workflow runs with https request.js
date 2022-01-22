// references:
// https://docs.github.com/en/rest/reference/actions#delete-a-workflow-run
// https://github.com/ribrea/delete_all_workflow_runs/blob/main/main.py
// https://stackoverflow.com/questions/19539391/how-to-get-data-out-of-a-node-js-http-get-request


const https = require('https');

function request(options) {
	return new Promise((resolve, reject) => {
		https.request(options, res => {
			if (res.statusCode < 200 || res.statusCode >= 300) {
				return reject(`error with status code: ${res.statusCode}`);
			}
			var body = [];
			res.on('data', chunk => {
				body.push(chunk);
			}).on('end', () => {
				resolve(Buffer.concat(body).toString());
			})
		}).on('error', err => {
			reject(err.message);
		}).end();
	});
}


async function main() {
	const owner = process.env.OWNER;
	const repo = process.env.REPO;
	//const user = process.env.USER;
	const token = process.env.TOKEN;

	const list_work_flow_runs_options = {
		hostname: 'api.github.com',
		port: 443,
		path: `/repos/${owner}/${repo}/actions/runs`,  // ?per_page=100
		method: 'GET',
		headers: {
			'User-Agent': '',  // User-Agent field is necessary, or result will be 403 Forbidden
			'Authorization': `token ${token}`,
		},
		// or use:
		//auth: `${token}`,
		// or
		//auth: `${user}:${token}`,
	}

	while (true) {
		try {
			const work_flow_runs = JSON.parse(await request(list_work_flow_runs_options));
			if (work_flow_runs.total_count === 0) {
				break;
			}
			work_flow_runs.workflow_runs.forEach(async run => {
				const delete_work_flow_run_options = {
					hostname: 'api.github.com',
					port: 443,
					path: `/repos/${owner}/${repo}/actions/runs/${run.id}`,
					method: 'DELETE',
					headers: {
						'User-Agent': '',
					},
					auth: `${token}`,
				}
				await request(delete_work_flow_run_options);
			})
		} catch (err) {
			return console.log(err);
		}
	}
}

main();