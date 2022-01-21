// reference:
// https://stackoverflow.com/questions/54857222/find-all-values-by-specific-key-in-a-deep-nested-object


let obj = {
	'id': 1,
	'type': 'list',
	'data': [
		{
			'id': 2,
			'type': 'text',
			'data': 'hello'
		},
		{
			'id': 3,
			'type': 'list',
			'data': [
				{
					'id': 4,
					'type': 'text',
					'data': 'world'
				}
			]
		}
	]
};


function findAllByKey(obj, key) {
	return Object.entries(obj).reduce((array, [_key, value]) => {
		if (_key === key) {
			return array.concat(value);
		} else if (typeof value === 'object') {
			return array.concat(findAllByKey(value, key));
		} else {
			return array;
		}
	}, []);
}

console.log(findAllByKey(obj, 'id'));
// output:
// (4) [1, 2, 3, 4]


// or

function forAllWithKey(obj, key, callback) {
	Object.entries(obj).forEach(([_key, value]) => {
		if (_key === key) {
			callback(value);
		} else if (typeof value === 'object') {
			forAllWithKey(value, key, callback);
		}
	});
}

forAllWithKey(obj, 'id', console.log);
// output:
// 1
// 2
// 3
// 4