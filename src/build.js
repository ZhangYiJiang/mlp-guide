var fs = require('fs'), 
	path = require('path'),
	jade = require('jade'), 
	helper = require('./helper.js'),
	_ = require('underscore');


// Read config, tags and list of episodes 
var config = readJSON('config.json'), 
	tagCategory = readJSON('tags.json'),
	seasonData = readJSON('season.json'),
	episodeList = fs.readdirSync('doc'), 
	seasons = [];


episodeList.forEach(function(filename){
	var episodeData = readJSON(path.join('doc', filename));

	// Process tags - replace string with category, generate class name 
	for (var i = 0; i < episodeData.tags.length; i++) {
		var tagParts = episodeData.tags[i].split(':');

		episodeData.tags[i] = {
			'category': tagCategory[tagParts[0]], 
			'name': tagParts[1], 
			'class': helper.slugify(tagParts[1])
		};
	}

	// Process continuity data - turn them 
	if (episodeData.continuity) {
		episodeData.continuityData = episodeData.continuity.join(' ');
	} else {
		episodeData.continuityData = false;
	}
	

	// Filename acts as the id to the element 
	episodeData.id = filename.split('.')[0];

	var index = filename.match(/s(\d+)e0*(\d+)/i), 
		// Minus one to account for zero indexed arrays 
		episodeSeason = index[1] - 1, 
		episodeCount = index[2] - 1;

	if (!seasons[episodeSeason]) 
		seasons[episodeSeason] = [];

	seasons[episodeSeason][episodeCount] = episodeData;
});

// Load Jade template; render 
var template = jade.compileFile(path.join(__dirname, 'guide.jade'), {
	pretty: true, 
	compileDebug: true
});

var data = {
	seasons: seasons, 
	seasonData: seasonData,
	helper: helper, 
	_: _, 
	config: config
}; 

var output = template(data);

fs.writeFileSync(config.fileName, output);

// Utility functions 
function readJSON (file) {
	console.info('Reading: ' + file);
	return JSON.parse(fs.readFileSync(file, { 'encoding': 'utf8' }));
}

